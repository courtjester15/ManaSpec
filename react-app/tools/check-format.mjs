import { readdir, readFile } from "node:fs/promises";
import { extname } from "node:path";

const roots = [new URL("../src/", import.meta.url), new URL("./", import.meta.url)];
const problems = [];

async function walk(url) {
  for (const entry of await readdir(url, { withFileTypes: true })) {
    const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, url);
    if (entry.isDirectory()) await walk(child);
    else if ([".js", ".jsx", ".mjs", ".css"].includes(extname(entry.name))) {
      const text = await readFile(child, "utf8");
      if (!text.endsWith("\n")) problems.push(`${child.pathname}: missing final newline`);
      if (/\r(?!\n)/.test(text)) problems.push(`${child.pathname}: invalid line endings`);
    }
  }
}

for (const root of roots) await walk(root);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Format checks passed.");
}
