import { createHash } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const mirrorDir = path.join(publicDir, "mirror");
const assetDir = path.join(publicDir, "mirror-assets");

const pages = [
  { url: "https://shymilovroman.ru/", output: "index.html" },
  { url: "https://shymilovroman.ru/wedding", output: "wedding.html" },
  { url: "https://shymilovroman.ru/corporate", output: "corporate.html" },
];

function shouldMirror(url) {
  if (/^https:\/\/(?:static\.tildacdn\.com|thb\.tildacdn\.com|ws\.tildacdn\.com|neo\.tildacdn\.com)\//i.test(url)) {
    return true;
  }

  if (!url.startsWith("https://shymilovroman.ru/")) {
    return false;
  }

  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname === "/" || pathname === "/wedding" || pathname === "/corporate" || pathname === "/privacy") {
    return false;
  }

  return (
    /\.[a-z0-9]{2,6}$/i.test(pathname) ||
    pathname.includes("tilda") ||
    pathname.includes("/files/") ||
    pathname.includes("/css/") ||
    pathname.includes("/js/")
  );
}

function normalizedUrl(url) {
  return url.replace(/[);]+$/g, "");
}

function assetLocalPath(url) {
  const clean = normalizedUrl(url);
  const ext = path.extname(new URL(clean).pathname) || ".bin";
  const hash = createHash("sha1").update(clean).digest("hex").slice(0, 16);
  return `/mirror-assets/${hash}${ext}`;
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function downloadAsset(url) {
  const clean = normalizedUrl(url);
  const localPath = assetLocalPath(clean);
  const output = path.join(publicDir, localPath.replace(/^\//, ""));

  if (await exists(output)) {
    return localPath;
  }

  const response = await fetch(clean);
  if (!response.ok) {
    throw new Error(`Failed to fetch asset ${clean}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(output, buffer);
  console.log(`saved ${localPath}`);
  return localPath;
}

async function mirrorHtml(pageUrl) {
  const response = await fetch(pageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch page ${pageUrl}: ${response.status}`);
  }

  let html = await response.text();
  const matches = [...html.matchAll(/https:\/\/[^"'`\s<>)]+/g)].map((match) => match[0]);
  const assetUrls = [...new Set(matches.filter(shouldMirror))];
  const mapping = new Map();

  for (const url of assetUrls) {
    const localPath = await downloadAsset(url);
    mapping.set(url, localPath);
  }

  for (const [remote, local] of mapping.entries()) {
    html = html.split(remote).join(local);
    html = html.split(`${remote});`).join(`${local});`);
  }

  const routePath = pageUrl.endsWith("/wedding")
    ? "/wedding"
    : pageUrl.endsWith("/corporate")
      ? "/corporate"
      : "/";

  html = html
    .replace(/(href|content)="https:\/\/shymilovroman\.ru\/wedding\/?"/g, '$1="/wedding"')
    .replace(/(href|content)="https:\/\/shymilovroman\.ru\/corporate\/?"/g, '$1="/corporate"')
    .replace(/(href|content)="https:\/\/shymilovroman\.ru\/?"/g, `$1="${routePath}"`)
    .replace(/https:\/\/lp9\.ru\/page\/[^\"]+/g, "#popup:quiz")
    .replaceAll("https://lp9.ru/page/suhyde02", "#popup:quiz")
    .replace(/<base[^>]*>/gi, "")
    .replace(/<link rel="dns-prefetch"[^>]+>\s*/gi, "")
    .replace(/<script>\(function\(d,\s*w\)\{[\s\S]*?lp9\.ru\/widget\/[\s\S]*?<\/script>\s*/gi, "")
    .replace(
      /<!--\/allrecords-->[\s\S]*$/i,
      `<!--/allrecords--><script src="/mirror-assets/form-bridge.js" defer></script></body></html>`,
    );

  return html;
}

async function main() {
  await mkdir(mirrorDir, { recursive: true });
  await mkdir(assetDir, { recursive: true });

  for (const page of pages) {
    const html = await mirrorHtml(page.url);
    const outputPath = path.join(mirrorDir, page.output);
    await writeFile(outputPath, html, "utf8");
    console.log(`wrote /mirror/${page.output}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
