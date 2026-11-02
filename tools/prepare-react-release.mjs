// Build a reviewable release artifact, never copy over the working vanilla root
// and never publish. Both entry points come from the same tested React source.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
mkdirSync(join(root, ".tmp"), { recursive: true });
const output = mkdtempSync(join(root, ".tmp", "react-release-"));
const app = join(output, "ManaSpec");
cpSync(join(root, "react-app", "dist-canonical"), app, { recursive: true });
cpSync(join(root, "react-app", "dist-portable"), join(app, "recovery"), { recursive: true });
const recoveryEntry = join(app, "recovery", "index.html");
writeFileSync(recoveryEntry, readFileSync(recoveryEntry, "utf8").replace("<body>", '<body><aside role="status" style="padding:8px;background:#3b2b08;color:#fff;font:14px system-ui">ManaSpec recovery copy. Export a backup before troubleshooting. Close other ManaSpec tabs; this copy uses the same saved data at this origin.</aside>'));
writeFileSync(join(app, ".nojekyll"), "");
const git = args => execFileSync("git", args, { cwd: root }).toString().trim();
const manifest = { sourceCommit: git(["rev-parse", "HEAD"]), sourceDirty: Boolean(git(["status", "--porcelain", "--untracked-files=no"])), base: "/ManaSpec/", recovery: "/ManaSpec/recovery/index.html", files: {} };
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else {
      const bytes = readFileSync(path);
      manifest.files[relative(app, path).replaceAll("\\", "/")] = { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
    }
  }
}
walk(app);
writeFileSync(join(app, "release-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ output, sourceCommit: manifest.sourceCommit, sourceDirty: manifest.sourceDirty, files: Object.keys(manifest.files).length, deployed: false }));
