import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, extname, join, normalize } from 'node:path';

const publicDir = join(process.cwd(), 'public');
const dataDir = join(process.cwd(), 'data');
const cmsPath = join(dataDir, 'cms.json');
const uploadsDir = join(publicDir, 'uploads');
const port = Number(process.env.PORT || 3000);
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

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
  try {
    return JSON.parse(await readFile(cmsPath, 'utf8'));
  } catch {
    return { media: [], reviews: [] };
  }
}

async function saveCms(cms) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(cmsPath, JSON.stringify(cms, null, 2), 'utf8');
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
  const safeName = basename(file.filename).replace(/[^\w.-]+/g, '_');
  const finalName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;
  const filePath = join(uploadsDir, finalName);
  await writeFile(filePath, file.content);

  sendJson(response, 200, {
    url: `/uploads/${finalName}`,
    name: safeName,
    type: file.contentType,
    size: file.content.length
  });
}

async function handleApi(request, response, pathname) {
  if (request.method === 'GET' && pathname === '/api/cms') {
    return sendJson(response, 200, await readCms());
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
    await saveCms({
      media: Array.isArray(cms.media) ? cms.media : [],
      reviews: Array.isArray(cms.reviews) ? cms.reviews : []
    });
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === 'POST' && pathname === '/api/upload') {
    return handleUpload(request, response);
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

createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://localhost');

  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(request, response, url.pathname);
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
