import { cp, mkdir, rm } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(toolsDir, "..");
const source = resolve(appDir, "dist");
const target = resolve(appDir, "..", "react-spike");

if (basename(target) !== "react-spike" || dirname(target) !== resolve(appDir, "..")) {
  throw new Error(`Refusing to replace unexpected Pages target: ${target}`);
}

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true, force: true });
console.log(`Synced Pages artifact to ${target}`);
