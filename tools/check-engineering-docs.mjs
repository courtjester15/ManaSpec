import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const skillsPath = ".agents/skills";
const staged = process.argv.includes("--staged");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
const tracked = staged ? new Set(git("ls-files", "-z").split("\0")) : null;
const read = path => (staged ? git("show", `:${path}`) : readFileSync(join(root, path), "utf8")).replaceAll("\r\n", "\n");
const skillPattern = /^\.agents\/skills\/[^/]+\/SKILL\.md$/;
const files = staged
  ? [...tracked].filter(path => skillPattern.test(path))
  : readdirSync(join(root, skillsPath), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => `${skillsPath}/${entry.name}/SKILL.md`);

const failures = [];
const map = read("AGENTS.md");
const mapped = [...map.matchAll(/\]\((\.agents\/skills\/[^/)]+\/SKILL\.md)\)/g)].map(match => match[1]);
if (files.length === 0) failures.push("Expected at least one repository skill.");
for (const path of files) {
  const name = path.split("/")[2];
  if (!mapped.includes(path)) failures.push(`AGENTS.md: missing link to ${path}`);
  if (!staged && !existsSync(join(root, path))) {
    failures.push(`${path}: missing skill entry point`);
    continue;
  }
  const contents = read(path);
  const frontmatter = contents.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
  if (!frontmatter.split("\n").includes(`name: ${name}`) || !/^description: \S/m.test(frontmatter)) {
    failures.push(`${path}: expected matching name and description`);
  }
  for (const [, target] of contents.matchAll(/\]\((\.\.?\/[^\s)#]+)(?:#[^)]*)?\)/g)) {
    const resolved = resolve(root, dirname(path), target);
    const repositoryPath = relative(root, resolved).replaceAll("\\", "/");
    if (repositoryPath.startsWith("../") || !(staged ? tracked.has(repositoryPath) : existsSync(resolved))) {
      failures.push(`${path}: invalid repository reference ${target}`);
    }
  }
}
for (const path of mapped) {
  if (!files.includes(path)) failures.push(`AGENTS.md: missing mapped skill ${path}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`${files.length} repository skills and their local references verified.`);
}
