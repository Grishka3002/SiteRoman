import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, extname, join, normalize } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import sharp from 'sharp';
import pg from 'pg';

const { Pool } = pg;
const require = createRequire(import.meta.url);
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const publicDir = join(process.cwd(), 'public');
const dataDir = join(process.cwd(), 'data');
const cmsPath = join(dataDir, 'cms.json');
const inquiriesPath = join(dataDir, 'inquiries.json');
const uploadsDir = join(publicDir, 'uploads');
const port = Number(process.env.PORT || 3000);
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
const telegramChatId = process.env.TELEGRAM_CHAT_ID || '';
const defaultCornerVideoUrl = '/assets/corner-video-roman.mp4';
const legacyCornerVideoUrl = '/assets/360p.f5fe27dad4.mp4';
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
  const settings = cms?.settings && typeof cms.settings === 'object' ? { ...cms.settings } : {};
  const cornerVideo = settings.cornerVideo && typeof settings.cornerVideo === 'object'
    ? { ...settings.cornerVideo }
    : {};
  if (!cornerVideo.url || cornerVideo.url === legacyCornerVideoUrl) {
    cornerVideo.url = defaultCornerVideoUrl;
  }
  settings.cornerVideo = cornerVideo;

  return {
    media: Array.isArray(cms?.media) ? cms.media : [],
    reviews: Array.isArray(cms?.reviews) ? cms.reviews : [],
    settings
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

function parseRange(range, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(range || '');
  if (!match) return null;

  let start = match[1] ? Number(match[1]) : 0;
  let end = match[2] ? Number(match[2]) : size - 1;
  if (!match[1] && match[2]) start = Math.max(size - Number(match[2]), 0);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return null;
  end = Math.min(end, size - 1);
  return { start, end };
}

function sendBuffer(response, request, content, contentType, cacheControl) {
  const size = content.length;
  const range = parseRange(request.headers.range, size);

  if (range) {
    response.writeHead(206, {
      'Content-Type': contentType,
      'Content-Length': range.end - range.start + 1,
      'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': cacheControl
    });
    response.end(content.subarray(range.start, range.end + 1));
    return;
  }

  response.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': cacheControl
  });
  response.end(content);
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.split('\n').slice(-8).join('\n') || `ffmpeg exited with code ${code}`));
    });
  });
}

async function optimizeVideo(content, originalName) {
  const tempDir = await mkdtemp(join(tmpdir(), 'site-video-'));
  const inputPath = join(tempDir, originalName || 'input.mp4');
  const outputPath = join(tempDir, 'output.mp4');

  try {
    await writeFile(inputPath, content);
    await runFfmpeg([
      '-y', '-i', inputPath,
      '-map', '0:v:0', '-map', '0:a?',
      '-vf', 'scale=if(gt(iw\\,900)\\,900\\,iw):-2',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '27',
      '-maxrate', '2200k', '-bufsize', '4400k',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '80k', '-ac', '1',
      '-movflags', '+faststart',
      outputPath
    ]);
    const optimized = await readFile(outputPath);
    return optimized.length < content.length ? optimized : content;
  } catch (error) {
    console.error('Video optimization failed:', error.message);
    return content;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function createVideoPoster(content, originalName) {
  const tempDir = await mkdtemp(join(tmpdir(), 'site-poster-'));
  const inputPath = join(tempDir, originalName || 'input.mp4');
  const posterPath = join(tempDir, 'poster.webp');

  try {
    await writeFile(inputPath, content);
    await runFfmpeg([
      '-y', '-ss', '00:00:00.25', '-i', inputPath,
      '-frames:v', '1',
      '-vf', 'scale=720:-2',
      '-q:v', '65',
      posterPath
    ]);
    return await readFile(posterPath);
  } catch (error) {
    console.error('Video poster generation failed:', error.message);
    return null;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
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

function escapeTelegramHtml(value) {
  return String(value || '').replace(/[&<>]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
  })[char]);
}

function pageLabel(page) {
  const labels = {
    '/': 'Главная',
    home: 'Главная',
    '/wedding': 'Свадьба',
    '/corporate': 'Корпоративы',
    '/privacy': 'Политика конфиденциальности'
  };
  return labels[page] || page || 'Не указана';
}

function fieldValueText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value || '').trim();
}

function formatInquiryForTelegram(inquiry) {
  const fields = Object.entries(inquiry.fields || {})
    .map(([key, value]) => {
      const cleanValue = fieldValueText(value);
      return cleanValue ? `• <b>${escapeTelegramHtml(key)}:</b> ${escapeTelegramHtml(cleanValue)}` : '';
    })
    .filter(Boolean)
    .join('\n');

  const createdAt = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'Asia/Vladivostok'
  }).format(new Date(inquiry.createdAt));

  const lines = [
    '<b>Новая заявка с сайта</b>',
    '',
    `<b>Страница:</b> ${escapeTelegramHtml(pageLabel(inquiry.page))}`,
    `<b>Время:</b> ${escapeTelegramHtml(createdAt)}`,
    inquiry.title ? `<b>Заголовок:</b> ${escapeTelegramHtml(inquiry.title)}` : '',
    inquiry.formId ? `<b>Форма:</b> ${escapeTelegramHtml(inquiry.formId)}` : '',
    '',
    fields || 'Поля заявки не распознаны.'
  ].filter(Boolean);

  const message = lines.join('\n');
  return message.length > 3900 ? `${message.slice(0, 3900)}\n...` : message;
}

async function notifyTelegram(inquiry) {
  if (!telegramBotToken || !telegramChatId) {
    console.warn('Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured');
    return false;
  }

  const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramChatId,
      text: formatInquiryForTelegram(inquiry),
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.description || `Telegram API error ${response.status}`);
  }

  return true;
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
    : isVideo
      ? originalName.replace(/\.[^.]+$/, '') + '.mp4'
      : originalName;
  const finalName = `${fileId}-${safeName}`;
  const filePath = join(uploadsDir, finalName);
  let content = isImage
    ? await sharp(file.content)
      .rotate()
      .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toBuffer()
    : file.content;
  if (isVideo) content = await optimizeVideo(content, originalName);
  const finalContentType = isImage ? 'image/webp' : isVideo ? 'video/mp4' : file.contentType;
  const posterName = isVideo ? finalName.replace(/\.[^.]+$/, '.poster.webp') : '';
  const posterContent = isVideo ? await createVideoPoster(content, safeName) : null;
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
  if (posterName && posterContent) {
    await saveUploadToDatabase({
      finalName: posterName,
      originalName: posterName,
      contentType: 'image/webp',
      content: posterContent
    });
    try {
      await writeFile(join(uploadsDir, posterName), posterContent);
    } catch {
      // Postgres is enough on Railway.
    }
  }

  sendJson(response, 200, {
    url: `/uploads/${finalName}`,
    poster: posterName && posterContent ? `/uploads/${posterName}` : '',
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
    let telegramNotified = false;
    await notifyTelegram(inquiry).then((notified) => {
      telegramNotified = Boolean(notified);
    }).catch((error) => {
      console.error('Telegram notification failed:', error.message);
    });
    return sendJson(response, 200, { ok: true, id: inquiry.id, telegramNotified });
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

async function handleUploadRequest(request, response, pathname) {
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

  sendBuffer(response, request, file.content, file.content_type, 'public, max-age=31536000, immutable');
  return true;
}

createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://localhost');

  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(request, response, url.pathname);
      return;
    }

    if (url.pathname.startsWith('/uploads/') && await handleUploadRequest(request, response, url.pathname)) {
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

  const stats = statSync(filePath);
  const range = parseRange(request.headers.range, stats.size);
  if (range) {
    response.writeHead(206, {
      'Content-Type': type,
      'Content-Length': range.end - range.start + 1,
      'Content-Range': `bytes ${range.start}-${range.end}/${stats.size}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': noCache ? 'no-store, max-age=0' : 'public, max-age=31536000, immutable'
    });
    createReadStream(filePath, { start: range.start, end: range.end }).pipe(response);
    return;
  }

  response.writeHead(200, {
    'Content-Type': type,
    'Content-Length': stats.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': noCache ? 'no-store, max-age=0' : 'public, max-age=31536000, immutable'
  });

  createReadStream(filePath).pipe(response);
}).listen(port, '0.0.0.0', () => {
  console.log(`Site is running on http://localhost:${port}`);
});
