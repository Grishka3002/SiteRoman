import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, extname, join, normalize } from 'node:path';
import sharp from 'sharp';
import pg from 'pg';

const { Pool } = pg;

const publicDir = join(process.cwd(), 'public');
const dataDir = join(process.cwd(), 'data');
const cmsPath = join(dataDir, 'cms.json');
const inquiriesPath = join(dataDir, 'inquiries.json');
const uploadsDir = join(publicDir, 'uploads');
const port = Number(process.env.PORT || 3000);
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
const pool = databaseUrl
  ? new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined
  })
  : null;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const editablePages = {
  home: join(publicDir, 'index.html'),
  wedding: join(publicDir, 'wedding', 'index.html'),
  corporate: join(publicDir, 'corporate', 'index.html'),
  privacy: join(publicDir, 'privacy', 'index.html')
};

const defaultCms = { media: [], reviews: [], settings: {} };

function normalizeCms(cms) {
  return {
    media: Array.isArray(cms?.media) ? cms.media : [],
    reviews: Array.isArray(cms?.reviews) ? cms.reviews : [],
    settings: cms?.settings && typeof cms.settings === 'object' ? cms.settings : {}
  };
}

async function initDatabase() {
  if (!pool) return false;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cms_state (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id text PRIMARY KEY,
      data jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS media_files (
      name text PRIMARY KEY,
      original_name text NOT NULL,
      content_type text NOT NULL,
      content bytea NOT NULL,
      size integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  return true;
}

const databaseReady = initDatabase()
  .then((ready) => {
    if (ready) console.log('Postgres storage is enabled');
    return ready;
  })
  .catch((error) => {
    console.error('Postgres storage is unavailable, using local JSON/files:', error.message);
    return false;
  });

async function queryDatabase(sql, params = []) {
  if (!pool || !await databaseReady) return null;

  try {
    return await pool.query(sql, params);
  } catch (error) {
    console.error('Postgres query failed:', error.message);
    return null;
  }
}

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

function isAuthorized(request) {
  return request.headers['x-admin-password'] === adminPassword;
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function readJson(request) {
  const body = await readBody(request);
  return body.length ? JSON.parse(body.toString('utf8')) : {};
}

async function readCms() {
  const result = await queryDatabase('SELECT data FROM cms_state WHERE id = $1', ['main']);
  if (result?.rows.length) return normalizeCms(result.rows[0].data);

  try {
    const cms = normalizeCms(JSON.parse(await readFile(cmsPath, 'utf8')));
    await saveCmsToDatabase(cms);
    return cms;
  } catch {
    return defaultCms;
  }
}

async function saveCms(cms) {
  const normalized = normalizeCms(cms);
  if (await saveCmsToDatabase(normalized)) return;

  await mkdir(dataDir, { recursive: true });
  await writeFile(cmsPath, JSON.stringify(normalized, null, 2), 'utf8');
}

async function saveCmsToDatabase(cms) {
  const result = await queryDatabase(`
    INSERT INTO cms_state (id, data, updated_at)
    VALUES ($1, $2::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `, ['main', JSON.stringify(normalizeCms(cms))]);
  return Boolean(result);
}

async function readInquiries() {
  const result = await queryDatabase(`
    SELECT data
    FROM inquiries
    ORDER BY COALESCE(data->>'createdAt', created_at::text) DESC
  `);
  if (result) return result.rows.map((row) => row.data);

  try {
    const inquiries = JSON.parse(await readFile(inquiriesPath, 'utf8'));
    return Array.isArray(inquiries) ? inquiries : [];
  } catch {
    return [];
  }
}

async function saveInquiries(inquiries) {
  if (pool && await databaseReady) {
    for (const inquiry of inquiries) await saveInquiryToDatabase(inquiry);
    return;
  }

  await mkdir(dataDir, { recursive: true });
  await writeFile(inquiriesPath, JSON.stringify(inquiries, null, 2), 'utf8');
}

async function saveInquiryToDatabase(inquiry) {
  const result = await queryDatabase(`
    INSERT INTO inquiries (id, data, created_at)
    VALUES ($1, $2::jsonb, $3)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `, [inquiry.id, JSON.stringify(inquiry), inquiry.createdAt]);
  return Boolean(result);
}

async function saveUploadToDatabase({ finalName, originalName, contentType, content }) {
  const result = await queryDatabase(`
    INSERT INTO media_files (name, original_name, content_type, content, size, created_at)
    VALUES ($1, $2, $3, $4, $5, now())
    ON CONFLICT (name) DO UPDATE
      SET original_name = EXCLUDED.original_name,
          content_type = EXCLUDED.content_type,
          content = EXCLUDED.content,
          size = EXCLUDED.size
  `, [finalName, originalName, contentType, content, content.length]);
  return Boolean(result);
}

async function readUploadFromDatabase(name) {
  const result = await queryDatabase('SELECT content_type, content, size FROM media_files WHERE name = $1', [name]);
  return result?.rows[0] || null;
}

function sanitizeInquiry(payload, request) {
  const fields = payload && typeof payload.fields === 'object' && payload.fields !== null
    ? payload.fields
    : {};

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    page: String(payload.page || ''),
    formId: String(payload.formId || ''),
    title: String(payload.title || ''),
    userAgent: request.headers['user-agent'] || '',
    fields: Object.fromEntries(Object.entries(fields)
      .filter(([key]) => !key.startsWith('formservices') && key !== 'form-spec-comments')
      .map(([key, value]) => [
        String(key).slice(0, 120),
        Array.isArray(value)
          ? value.map((item) => String(item).slice(0, 2000))
          : String(value).slice(0, 4000)
      ]))
  };
}

function parseMultipart(buffer, boundary) {
  const boundaryText = `--${boundary}`;
  const body = buffer.toString('binary');
  const parts = body.split(boundaryText).slice(1, -1);

  return parts.map((part) => {
    const clean = part.replace(/^\r\n/, '').replace(/\r\n$/, '');
    const [rawHeaders, rawContent = ''] = clean.split('\r\n\r\n');
    const headers = Object.fromEntries(rawHeaders.split('\r\n').map((line) => {
      const index = line.indexOf(':');
      return [line.slice(0, index).toLowerCase(), line.slice(index + 1).trim()];
    }));
    const disposition = headers['content-disposition'] || '';
    const name = /name="([^"]+)"/.exec(disposition)?.[1] || '';
    const filename = /filename="([^"]*)"/.exec(disposition)?.[1] || '';

    return {
      name,
      filename,
      contentType: headers['content-type'] || 'application/octet-stream',
      content: Buffer.from(rawContent, 'binary')
    };
  });
}

async function handleUpload(request, response) {
  const contentType = request.headers['content-type'] || '';
  const boundary = /boundary=(.+)$/.exec(contentType)?.[1];
  if (!boundary) return sendJson(response, 400, { error: 'No multipart boundary' });

  const body = await readBody(request);
  const file = parseMultipart(body, boundary).find((part) => part.filename);
  if (!file) return sendJson(response, 400, { error: 'No file uploaded' });

  await mkdir(uploadsDir, { recursive: true });
  const originalName = basename(file.filename).replace(/[^\w.-]+/g, '_');
  const fileId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const isImage = /^image\//.test(file.contentType) && file.contentType !== 'image/svg+xml' && file.contentType !== 'image/gif';
  const isVideo = /^video\//.test(file.contentType);
  const safeName = isImage
    ? originalName.replace(/\.[^.]+$/, '') + '.webp'
    : originalName;
  const finalName = `${fileId}-${safeName}`;
  const filePath = join(uploadsDir, finalName);
  const content = isImage
    ? await sharp(file.content)
      .rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toBuffer()
    : file.content;
  const finalContentType = isImage ? 'image/webp' : file.contentType;
  const savedToDatabase = await saveUploadToDatabase({
    finalName,
    originalName,
    contentType: finalContentType,
    content
  });

  if (!savedToDatabase) await writeFile(filePath, content);
  else {
    try {
      await writeFile(filePath, content);
    } catch {
      // Postgres is the durable source on Railway; this file is only a runtime cache.
    }
  }

  sendJson(response, 200, {
    url: `/uploads/${finalName}`,
    name: safeName,
    type: finalContentType,
    size: content.length,
    originalSize: file.content.length,
    optimized: isImage,
    stored: savedToDatabase ? 'postgres' : 'filesystem',
    warning: isVideo ? 'Video is saved as a file. For strong compression use ffmpeg or external storage/transcoder.' : undefined
  });
}

async function handleApi(request, response, pathname) {
  if (request.method === 'GET' && pathname === '/api/cms') {
    return sendJson(response, 200, await readCms());
  }

  if (request.method === 'POST' && pathname === '/api/inquiry') {
    const payload = await readJson(request);
    const inquiry = sanitizeInquiry(payload, request);
    if (!Object.keys(inquiry.fields).length) {
      return sendJson(response, 400, { error: 'Нет данных заявки' });
    }
    const inquiries = await readInquiries();
    inquiries.push(inquiry);
    if (!await saveInquiryToDatabase(inquiry)) await saveInquiries(inquiries);
    return sendJson(response, 200, { ok: true, id: inquiry.id });
  }

  if (request.method === 'POST' && pathname === '/api/login') {
    return isAuthorized(request)
      ? sendJson(response, 200, { ok: true })
      : sendJson(response, 401, { error: 'Неверный пароль' });
  }

  if (!isAuthorized(request)) {
    return sendJson(response, 401, { error: 'Неверный пароль' });
  }

  if (request.method === 'PUT' && pathname === '/api/cms') {
    const cms = await readJson(request);
    await saveCms(cms);
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === 'POST' && pathname === '/api/upload') {
    return handleUpload(request, response);
  }

  if (request.method === 'GET' && pathname === '/api/inquiries') {
    return sendJson(response, 200, await readInquiries());
  }

  if (pathname === '/api/page') {
    const url = new URL(request.url || '/', 'http://localhost');
    const page = url.searchParams.get('page') || 'home';
    const filePath = editablePages[page];
    if (!filePath) return sendJson(response, 404, { error: 'Unknown page' });

    if (request.method === 'GET') {
      return sendJson(response, 200, { page, html: await readFile(filePath, 'utf8') });
    }

    if (request.method === 'PUT') {
      const { html } = await readJson(request);
      if (typeof html !== 'string') return sendJson(response, 400, { error: 'HTML is required' });
      await writeFile(filePath, html, 'utf8');
      return sendJson(response, 200, { ok: true });
    }
  }

  sendJson(response, 404, { error: 'Not found' });
}

function resolveRequest(url) {
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const isAdminPageRoute = pathname === '/admin' ||
    pathname === '/admin/home' ||
    pathname === '/admin/wedding' ||
    pathname === '/admin/corporate';

  if (isAdminPageRoute) {
    return join(publicDir, 'admin', 'index.html');
  }

  const cleanPath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const basePath = join(publicDir, cleanPath);

  const candidates = [
    basePath,
    join(basePath, 'index.html'),
    join(publicDir, 'index.html')
  ];

  for (const candidate of candidates) {
    try {
      const stats = statSync(candidate);
      if (stats.isFile()) return candidate;
    } catch {
      // Try the next candidate.
    }
  }

  return join(publicDir, 'index.html');
}

async function handleUploadRequest(response, pathname) {
  const name = basename(decodeURIComponent(pathname.replace(/^\/uploads\//, '')));
  if (!name) return false;

  const localPath = join(uploadsDir, name);
  try {
    const stats = statSync(localPath);
    if (stats.isFile()) return false;
  } catch {
    // Missing local files can still be restored from Postgres after a redeploy.
  }

  const file = await readUploadFromDatabase(name);
  if (!file) return false;

  response.writeHead(200, {
    'Content-Type': file.content_type,
    'Content-Length': file.size,
    'Cache-Control': 'public, max-age=31536000, immutable'
  });
  response.end(file.content);
  return true;
}

createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://localhost');

  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(request, response, url.pathname);
      return;
    }

    if (url.pathname.startsWith('/uploads/') && await handleUploadRequest(response, url.pathname)) {
      return;
    }
  } catch (error) {
    sendJson(response, 500, { error: error.message });
    return;
  }

  const filePath = resolveRequest(request.url || '/');
  const type = mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream';
  const noCache = filePath.endsWith('.html') ||
    filePath.includes(`${join('public', 'admin')}`) ||
    filePath.includes(`${join('public', 'cms')}`);

  response.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': noCache ? 'no-store, max-age=0' : 'public, max-age=31536000, immutable'
  });

  createReadStream(filePath).pipe(response);
}).listen(port, '0.0.0.0', () => {
  console.log(`Site is running on http://localhost:${port}`);
});
