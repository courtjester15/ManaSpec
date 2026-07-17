import { readFile, writeFile } from "node:fs/promises";
import { finalizePortableHtml } from "./portable-html.mjs";

const path = new URL("../dist-portable/index.html", import.meta.url);
const html = await readFile(path, "utf8");
const portable = finalizePortableHtml(html);

await writeFile(path, portable, "utf8");
