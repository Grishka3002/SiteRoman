import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'public');
const assetsDir = path.join(outDir, 'assets');

await mkdir(assetsDir, { recursive: true });

const downloaded = new Map();
const pages = [
  { input: 'source.html', output: 'index.html', route: '/' },
  { input: 'wedding.html', output: 'wedding/index.html', route: '/wedding' },
  { input: 'corporate.html', output: 'corporate/index.html', route: '/corporate' }
];

function isAssetUrl(url) {
  return /^https:\/\/(?:static|neo|ws|thb)\.tildacdn\.com\//.test(url) ||
    /^https:\/\/static\.tildacdn\.info\//.test(url) ||
    /^https:\/\/lottie\.host\/.+\.json/.test(url) ||
    /^https:\/\/unpkg\.com\/@lottiefiles\/.+\.js/.test(url) ||
    /^https:\/\/kinescope\.io\/.+/.test(url) ||
    /^https:\/\/dsgnmax\.ru\/.+/.test(url);
}

function extensionFromUrl(url, contentType = '') {
  const clean = new URL(url).pathname;
  const ext = path.extname(clean);
  if (ext) return ext;
  if (contentType.includes('text/css')) return '.css';
  if (contentType.includes('javascript')) return '.js';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('jpeg')) return '.jpg';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('svg')) return '.svg';
  if (contentType.includes('mp4')) return '.mp4';
  if (contentType.includes('json')) return '.json';
  if (contentType.includes('woff2')) return '.woff2';
  if (contentType.includes('woff')) return '.woff';
  return '.bin';
}

function localNameFor(url, contentType) {
  const u = new URL(url);
  const base = path.basename(u.pathname).replace(/[^\w.-]+/g, '_') || 'asset';
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 10);
  const ext = extensionFromUrl(url, contentType);
  const withoutExt = base.endsWith(ext) ? base.slice(0, -ext.length) : base;
  return `${withoutExt}.${hash}${ext}`;
}

async function download(url) {
  if (downloaded.has(url)) return downloaded.get(url);
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; site migration script)'
    }
  });
  if (!response.ok) throw new Error(`Failed ${response.status} ${url}`);
  const contentType = response.headers.get('content-type') || '';
  const buffer = Buffer.from(await response.arrayBuffer());
  const name = localNameFor(url, contentType);
  const localFs = path.join(assetsDir, name);
  await writeFile(localFs, buffer);
  const localWeb = `/assets/${name}`;
  downloaded.set(url, localWeb);
  return localWeb;
}

function extractUrls(content) {
  const urls = new Set();
  const patterns = [
    /https:\/\/(?:static|neo|ws|thb)\.tildacdn\.com\/[^"' <>)\\]+/g,
    /https:\/\/static\.tildacdn\.info\/[^"' <>)\\]+/g,
    /https:\/\/lottie\.host\/[^"' <>)\\]+\.json/g,
    /https:\/\/unpkg\.com\/@lottiefiles\/[^"' <>)\\]+\.js/g,
    /https:\/\/kinescope\.io\/[^"' <>)\\]+/g,
    /https:\/\/dsgnmax\.ru\/[^"' <>)\\]+/g
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      urls.add(match[0].replace(/&quot;$/g, ''));
    }
  }
  return urls;
}

async function rewriteContent(content) {
  const urls = [...extractUrls(content)];
  for (const url of urls) {
    if (!isAssetUrl(url)) continue;
    try {
      const local = await download(url);
      content = content.split(url).join(local);
    } catch (error) {
      console.warn(error.message);
    }
  }
  return content;
}

async function localizeKinescopeEmbeds(content) {
  const ids = [...content.matchAll(/data-kinescopeid=["']([^"']+)["']/g)].map((match) => match[1]);
  for (const id of [...new Set(ids)]) {
    try {
      const local = await download(`https://kinescope.io/${id}/360p`);
      const pattern = new RegExp(`<div\\s+class=['"]tn-atom__videoiframe['"]\\s+data-kinescopeid=["']${id}["']\\s+style=["']([^"']*)["']><\\/div>`, 'g');
      content = content.replace(pattern, `<video class="tn-atom__videoiframe" style="$1 object-fit:cover;" src="${local}" controls playsinline preload="metadata"></video>`);
    } catch (error) {
      console.warn(error.message);
    }
  }
  return content;
}

const pageOutputs = [];

for (const page of pages) {
  let html = await readFile(path.join(root, page.input), 'utf8');
  html = await rewriteContent(html);
  html = await localizeKinescopeEmbeds(html);
  pageOutputs.push({ ...page, html });
}

// Recursively pull assets referenced by downloaded CSS/JS files.
let changed = true;
while (changed) {
  changed = false;
  for (const [remote, localWeb] of [...downloaded.entries()]) {
    if (!/\.(css|js)(?:$|\?)/.test(new URL(remote).pathname)) continue;
    const filePath = path.join(outDir, localWeb.replace(/^\//, ''));
    let content = await readFile(filePath, 'utf8');
    const before = content;
    content = await rewriteContent(content);
    if (content !== before) {
      await writeFile(filePath, content, 'utf8');
      changed = true;
    }
  }
}

for (const page of pageOutputs) {
  let html = await rewriteContent(page.html);
  html = html
    .replace(/<link rel="dns-prefetch" href="https:\/\/(?:ws|static)\.tildacdn\.com">\s*/g, '')
    .replace(/<script type="text\/javascript">window\.dataLayer=window\.dataLayer\|\|\[\];<\/script>\s*/g, '')
    .replace(/<!-- Tilda copyright[\s\S]*?id="tildacopy"[\s\S]*?<!-- Stat -->/g, '<!-- Stat -->')
    .replace(/<div class="t-tildalabel[\s\S]*?id="tildacopy"[\s\S]*?<\/a><\/div>\s*/g, '')
    .replace(/<!-- Stat -->[\s\S]*?<\/script>\s*<\/body>/, '</body>')
    .replace(/https:\/\/shymilovroman\.ru\/corporate/g, '/corporate')
    .replace(/https:\/\/shymilovroman\.ru\/wedding/g, '/wedding')
    .replace(/https:\/\/shymilovroman\.ru/g, '/')
    .replace(/<!--https:\/\/dsgnmax\.ru\/[^>]+-->/g, '')
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${page.route}">`);

  const outputPath = path.join(outDir, page.output);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, 'utf8');
}

await mkdir(path.join(outDir, 'privacy'), { recursive: true });
await writeFile(path.join(outDir, 'privacy', 'index.html'), `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Политика конфиденциальности</title>
  <style>
    body{margin:0;background:#000;color:#fff;font-family:Arial,sans-serif;line-height:1.6}
    main{max-width:900px;margin:0 auto;padding:48px 20px}
    a{color:#ffe40f}
  </style>
</head>
<body>
  <main>
    <h1>Политика конфиденциальности</h1>
    <p>Этот файл добавлен как локальная страница для автономного деплоя. Замените текст на актуальную юридическую редакцию, если требуется полная политика.</p>
    <p><a href="/">Вернуться на сайт</a></p>
  </main>
</body>
</html>
`, 'utf8');

console.log(`Done. Downloaded ${downloaded.size} assets and ${pages.length} pages.`);
