import { readFile } from "node:fs/promises";
import path from "node:path";

const publicMirrorDir = path.join(process.cwd(), "public", "mirror");

export async function readMirroredHtml(fileName: string) {
  return readFile(path.join(publicMirrorDir, fileName), "utf8");
}
