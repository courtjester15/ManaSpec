import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../dist-portable/index.html", import.meta.url);
const html = await readFile(path, "utf8");
const portable = html
  .replace(/\s+type="module"/g, "")
  .replace(/\s+crossorigin/g, "")
  .replace(/<link rel="modulepreload"[^>]*>/g, "");

await writeFile(path, portable, "utf8");
