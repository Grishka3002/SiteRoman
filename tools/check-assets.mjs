import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : file;
  });
}

const htmlFiles = walk('public').filter((file) => file.endsWith('index.html'));
const missing = [];

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const patterns = [
    /(?:src|href|data-original|data-img-zoom-url)=['"](\/assets\/[^'"]+)/g,
    /url\(['"]?(\/assets\/[^)'"]+)/g
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const assetPath = path.join('public', match[1]);
      if (!existsSync(assetPath)) missing.push(`${file} -> ${match[1]}`);
    }
  }
}

if (missing.length) {
  console.error(missing.join('\n'));
  process.exit(1);
}

console.log('all referenced /assets files exist');
