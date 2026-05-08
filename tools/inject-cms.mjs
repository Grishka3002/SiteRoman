import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const pages = [
  'public/index.html',
  'public/wedding/index.html',
  'public/corporate/index.html',
  'public/privacy/index.html'
];

for (const page of pages) {
  const file = path.join(process.cwd(), page);
  let html = await readFile(file, 'utf8');

  if (!html.includes('/cms/site.css')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="/cms/site.css?v=20260508-3"></head>');
  }

  if (!html.includes('/cms/site.js')) {
    html = html.replace('</body>', '<script src="/cms/site.js?v=20260508-3"></script></body>');
  }

  await writeFile(file, html, 'utf8');
}

console.log('CMS assets injected');
