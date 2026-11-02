import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const ref = "vanilla-before-react-promotion-2026-10-31";
const output = join(root, ".tmp", "vanilla-rollback", "ManaSpec");
const git = args => execFileSync("git", args, { cwd: root, maxBuffer: 20_000_000 });
const files = git(["ls-tree", "-r", "--name-only", ref, "--", "index.html", "js", "css", "assets"]).toString().trim().split("\n");
const manifest = { source: git(["rev-parse", `${ref}^{commit}`]).toString().trim(), ref, files: {} };
for (const path of files) {
  if (!/^(index\.html|(?:js|css|assets)\/[^\\:]+)$/.test(path) || path.split("/").includes("..")) throw new Error("Unexpected archive path");
  const target = join(output, path);
  mkdirSync(dirname(target), { recursive: true });
  let bytes = git(["show", `${ref}:${path}`]);
  if (path === "index.html") {
    // Preserve parser-blocking classic-script order. Only trusted archived src
    // attributes enter this generated loader, and the guard runs before all of them.
    const html = bytes.toString().replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
      if (!/^(js|assets)\/[a-zA-Z0-9_./?=\-]+$/.test(src)) throw new Error("Unexpected script source");
      return `<script>if(window.manaspecVanillaSafe)document.write(${JSON.stringify(`<script src="${src}"><` + "/script>").replaceAll("</script>", "<\\/script>")});</script>`;
    }).replace("<head>", '<head>\n<script src="rollback-guard.js"></script>');
    bytes = Buffer.from(html);
  }
  writeFileSync(target, bytes);
  manifest.files[path] = createHash("sha256").update(bytes).digest("hex");
}
const guard = readFileSync(join(root, "tools", "vanilla-rollback-guard.js"));
writeFileSync(join(output, "rollback-guard.js"), guard);
manifest.files["rollback-guard.js"] = createHash("sha256").update(guard).digest("hex");
writeFileSync(join(output, "rollback-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Prepared guarded vanilla archive from ${manifest.source} at ${output}. No deployment performed.`);
