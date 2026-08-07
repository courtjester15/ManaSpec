import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const repositoryRoot = resolve(import.meta.dirname, "..");
const artifactRoot = join(repositoryRoot, "react-spike");
const manifestPath = join(artifactRoot, "artifact-manifest.json");
const deployPrefix = "/ManaSpec/react-spike/";
const textExtensions = new Set([".css", ".html", ".js", ".json", ".map", ".svg", ".txt"]);

function fail(message) {
  console.error(`React spike artifact check failed: ${message}`);
  process.exit(1);
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function artifactPath(path) {
  return relative(artifactRoot, path).split(sep).join("/");
}

function canonicalBytes(path) {
  const bytes = readFileSync(path);
  if (!textExtensions.has(extname(path).toLowerCase())) return bytes;
  return Buffer.from(bytes.toString("utf8").replace(/\r\n?/g, "\n"), "utf8");
}

function describe(path) {
  const bytes = canonicalBytes(path);
  return {
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

function buildManifest() {
  const files = Object.fromEntries(
    listFiles(artifactRoot)
      .filter((path) => path !== manifestPath)
      .sort((left, right) => artifactPath(left).localeCompare(artifactPath(right)))
      .map((path) => [artifactPath(path), describe(path)]),
  );

  return {
    schemaVersion: 1,
    deployPrefix,
    files,
  };
}

function localReference(reference) {
  if (/^(?:[a-z]+:|#)/i.test(reference)) return null;
  if (reference.startsWith(deployPrefix)) return reference.slice(deployPrefix.length);
  return reference.replace(/^\.\//, "");
}

function validateEntryPoint(manifest) {
  const indexPath = join(artifactRoot, "index.html");
  const html = readFileSync(indexPath, "utf8");
  if (!html.includes('<div id="root"></div>')) fail("index.html is missing the React root element");

  const references = [
    ...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi),
    ...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["']/gi),
  ].map((match) => match[1]);

  const localReferences = references.map(localReference).filter(Boolean);
  if (!localReferences.some((path) => path.endsWith(".js"))) fail("index.html does not reference JavaScript");
  if (!localReferences.some((path) => path.endsWith(".css"))) fail("index.html does not reference CSS");

  for (const path of localReferences) {
    if (!manifest.files[path]) fail(`index.html references an untracked artifact file: ${path}`);
  }

  for (const path of localReferences.filter((path) => path.endsWith(".js"))) {
    const result = spawnSync(process.execPath, ["--check", join(artifactRoot, path)], {
      encoding: "utf8",
    });
    if (result.error) fail(`could not validate ${path}: ${result.error.message}`);
    if (result.status !== 0) fail(`${path} is not valid JavaScript\n${result.stderr?.trim() ?? ""}`);
  }
}

if (!existsSync(artifactRoot)) fail("react-spike/ does not exist");

if (process.argv.includes("--write")) {
  const manifest = buildManifest();
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Wrote ${artifactPath(manifestPath)} with ${Object.keys(manifest.files).length} files.`);
  process.exit(0);
}

if (!existsSync(manifestPath)) fail("artifact-manifest.json is missing; run this check with --write after a verified build");

const expected = JSON.parse(readFileSync(manifestPath, "utf8"));
if (expected.schemaVersion !== 1 || expected.deployPrefix !== deployPrefix) {
  fail("artifact-manifest.json has an unsupported schema or deployment prefix");
}

const actual = buildManifest();
const expectedPaths = Object.keys(expected.files).sort();
const actualPaths = Object.keys(actual.files).sort();
if (JSON.stringify(expectedPaths) !== JSON.stringify(actualPaths)) {
  fail("the artifact file list does not match artifact-manifest.json");
}

for (const path of expectedPaths) {
  const wanted = expected.files[path];
  const found = actual.files[path];
  if (wanted.bytes !== found.bytes || wanted.sha256 !== found.sha256) {
    fail(`${path} does not match artifact-manifest.json (expected ${wanted.bytes} bytes / ${wanted.sha256}, found ${found.bytes} bytes / ${found.sha256})`);
  }
}

validateEntryPoint(expected);
console.log(`React spike artifact is complete and valid (${expectedPaths.length} files).`);
