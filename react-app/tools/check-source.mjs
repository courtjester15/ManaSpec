import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = [new URL("../src/", import.meta.url), new URL("./", import.meta.url)];
const problems = [];

async function walk(url) {
  for (const entry of await readdir(url, { withFileTypes: true })) {
    const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, url);
    if (entry.isDirectory()) {
      await walk(child);
      continue;
    }
    if (![".js", ".jsx", ".mjs"].includes(extname(entry.name))) continue;
    const text = await readFile(child, "utf8");
    if (/\t/.test(text)) problems.push(`${child.pathname}: tab indentation`);
    if (/[ \t]+$/m.test(text)) problems.push(`${child.pathname}: trailing whitespace`);
    if (child.pathname.includes("/features/") && /localStorage\./.test(text)) {
      problems.push(`${child.pathname}: feature code must use the persistence boundary`);
    }
  }
}

for (const root of roots) await walk(root);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Source policy checks passed.");
}
