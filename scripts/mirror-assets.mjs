import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const contentPath = path.join(rootDir, "content", "default-pages.json");
const mediaDir = path.join(rootDir, "public", "media");

function isRemoteAsset(value) {
  return typeof value === "string" && /^https:\/\/(?:static|thb)\.tildacdn\.com\//i.test(value);
}

function extensionFromUrl(url) {
  const cleanUrl = url.replace(/[);]+$/, "");
  const pathname = new URL(cleanUrl).pathname;
  const ext = path.extname(pathname);
  return ext || ".bin";
}

function localAssetPath(url) {
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 12);
  const ext = extensionFromUrl(url);
  return `/media/${hash}${ext}`;
}

function collectAssets(node, set = new Set()) {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectAssets(item, set);
    }
    return set;
  }

  if (node && typeof node === "object") {
    for (const value of Object.values(node)) {
      collectAssets(value, set);
    }
    return set;
  }

  if (isRemoteAsset(node)) {
    set.add(node);
  }

  return set;
}

function replaceAssets(node, mapping) {
  if (Array.isArray(node)) {
    return node.map((item) => replaceAssets(item, mapping));
  }

  if (node && typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [key, replaceAssets(value, mapping)]),
    );
  }

  if (isRemoteAsset(node) && mapping.has(node)) {
    return mapping.get(node);
  }

  return node;
}

async function fileExists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(mediaDir, { recursive: true });

  const raw = await readFile(contentPath, "utf8");
  const content = JSON.parse(raw);
  const assetUrls = [...collectAssets(content)];

  if (!assetUrls.length) {
    console.log("No remote assets found.");
    return;
  }

  const mapping = new Map();

  for (const url of assetUrls) {
    const localPath = localAssetPath(url);
    const outputPath = path.join(rootDir, "public", localPath.replace(/^\//, ""));
    mapping.set(url, localPath);

    if (await fileExists(outputPath)) {
      console.log(`skip ${localPath}`);
      continue;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(outputPath, buffer);
    console.log(`saved ${localPath}`);
  }

  const nextContent = replaceAssets(content, mapping);
  await writeFile(contentPath, `${JSON.stringify(nextContent, null, 2)}\n`, "utf8");
  console.log(`Updated ${path.relative(rootDir, contentPath)} with local asset paths.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
