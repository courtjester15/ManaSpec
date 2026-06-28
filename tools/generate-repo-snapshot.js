#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const outputPath = path.join(root, "dev notes", "snapshots", "repo-snapshot-latest.md");
const gitCommand = findGitCommand();

const EXCLUDED_DIRS = new Set([
  ".git",
  ".cache",
  ".vscode",
  ".idea",
  "node_modules",
  "releases",
  "dist",
  "build",
  "coverage",
  "tmp",
  "temp",
  "logs",
]);

const GENERATED_PATHS = new Set([
  path.normalize(path.join("dev notes", "snapshots", "repo-snapshot-latest.md")),
]);

const MODULES = [
  {
    name: "Dashboard",
    purpose: "Awareness and current workflow summary.",
    files: ["js/modules/dashboard/dashboard.js"],
  },
  {
    name: "Radar",
    purpose: "Card discovery, exact printing selection, watched ideas, entry planning, and planned quantity.",
    files: ["js/modules/radar/radar.js", "js/modules/portfolio/search.js", "js/modules/portfolio/printings.js"],
  },
  {
    name: "Positions",
    purpose: "Owned holdings, buy/sell/delete actions, current value, P/L, targets, and hold tracking.",
    files: ["js/modules/portfolio/portfolio.js", "js/modules/portfolio/trading.js", "js/modules/portfolio/pricing.js", "js/modules/portfolio/snapshots.js"],
  },
  {
    name: "Signals",
    purpose: "Read-only attention layer for target and plan states.",
    files: ["js/modules/signals/signals.js"],
  },
  {
    name: "Card Detail",
    purpose: "Command center for one exact tracked printing.",
    files: ["js/modules/card-details/card-details.js"],
  },
  {
    name: "Transactions",
    purpose: "Early ledger event surface for buys, sells, backfills, corrections, and review context.",
    files: ["js/modules/transactions/transactions.js"],
  },
  {
    name: "History",
    purpose: "Review trail across transactions, Radar activity, and notes.",
    files: ["js/modules/history/history.js"],
  },
  {
    name: "Admin",
    purpose: "Local data safety and maintenance workflows.",
    files: ["js/modules/admin/admin.js"],
  },
  {
    name: "Shared UI",
    purpose: "Reusable table, context band, modal, summary, and help surfaces.",
    files: ["js/ui/table.js", "js/ui/context-band.js", "js/ui/intent-modal.js", "js/ui/summary.js", "js/ui/help.js"],
  },
  {
    name: "Core",
    purpose: "Storage, startup state, navigation, global search, and app boot.",
    files: ["js/core/storage.js", "js/core/state.js", "js/core/app.js"],
  },
];

main();

function main() {
  const sections = [
    "# ManaSpec Repository Snapshot",
    "",
    "Generated file. Do not edit manually.",
    "Active docs remain the source of truth.",
    "This snapshot is for fast orientation only.",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    renderGitSection(),
    renderTreeSection(),
    renderDocsMapSection(),
    renderModuleMapSection(),
    renderScriptLoadOrderSection(),
    renderStorageSection(),
    renderActiveWorkflowSection(),
    renderFileSizeSection(),
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, sections.join("\n"), "utf8");
  console.log(`Generated ${path.relative(root, outputPath)}`);
}

function renderGitSection() {
  const status = getGitStatusSummary();
  return [
    "## Git",
    "",
    `- Branch: ${getGitBranch()}`,
    "- Status:",
    fenced(status),
    "- Last 8 commits:",
    fenced(getGitLog()),
    "",
  ].join("\n");
}

function renderTreeSection() {
  return [
    "## Repository Structure",
    "",
    ...buildTree(root, 0, 2),
    "",
  ].join("\n");
}

function renderDocsMapSection() {
  const docsReadme = readText("docs/README.md");
  const map = extractSection(docsReadme, "Documentation Ownership Map");
  const lines = map
    ? map.split("\n").filter(line => line.trim().startsWith("- "))
    : [
      "- `README.md`: current product behavior and where to start.",
      "- `ROADMAP.md`: committed current and future work.",
      "- `WORKFLOW.md`: how to work on the app.",
    ];

  return [
    "## Documentation Map",
    "",
    ...lines,
    "",
  ].join("\n");
}

function renderModuleMapSection() {
  const lines = ["## Module Map", ""];

  MODULES.forEach(module => {
    lines.push(`### ${module.name}`);
    lines.push("");
    lines.push(`- Purpose: ${module.purpose}`);
    lines.push("- Primary files:");
    module.files.forEach(file => {
      lines.push(`  - ${file}${fs.existsSync(path.join(root, file)) ? "" : " (missing)"}`);
    });
    lines.push("");
  });

  return lines.join("\n");
}

function renderScriptLoadOrderSection() {
  const html = readText("index.html");
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"><\/script>/g)].map(match => match[1]);
  const lines = [
    "## Script Load Order",
    "",
    ...scripts.map((script, index) => `${index + 1}. ${script}`),
    "",
  ];

  return lines.join("\n");
}

function renderStorageSection() {
  const keys = findLocalStorageKeys();
  return [
    "## localStorage Keys Found In JS",
    "",
    ...(keys.length ? keys.map(key => `- ${key}`) : ["- (none found)"]),
    "",
  ].join("\n");
}

function renderActiveWorkflowSection() {
  const roadmap = readText("docs/ROADMAP.md");
  const phaseMatch = roadmap.match(/## Current Phase:\s*(.+)/);
  const betaTrack = extractSection(roadmap, "1.0 Beta Track");
  const betaGoal = betaTrack?.match(/Goal:\s*(.+)/)?.[1];
  const next = extractHeading(roadmap, "Next", 3);
  const nextLines = next
    ? next.split("\n").filter(line => /^(\d+\.|\s+-)/.test(line)).slice(0, 12)
    : [];

  return [
    "## Active Workflow Areas",
    "",
    `- Current roadmap phase: ${phaseMatch ? phaseMatch[1].trim() : "(not found)"}`,
    `- Current beta milestone: ${betaGoal || "(not found)"}`,
    "- Current Next items:",
    ...(nextLines.length ? nextLines.map(line => `  ${line.trim()}`) : ["  - (not found)"]),
    "",
  ].join("\n");
}

function renderFileSizeSection() {
  const files = listFiles(root)
    .filter(file => /\.(js|css|md)$/.test(file))
    .filter(file => (
      file.startsWith("js\\") ||
      file.startsWith("css\\") ||
      file.startsWith("docs\\") ||
      file === "README.md" ||
      file === "CHANGELOG.md"
    ))
    .map(file => ({
      file: toPosix(file),
      bytes: fs.statSync(path.join(root, file)).size,
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 30);

  return [
    "## File Size Summary",
    "",
    "| File | Size |",
    "| --- | ---: |",
    ...files.map(item => `| ${item.file} | ${formatBytes(item.bytes)} |`),
    "",
  ].join("\n");
}

function findLocalStorageKeys() {
  const keys = new Set();
  const jsFiles = listFiles(path.join(root, "js")).filter(file => file.endsWith(".js"));
  const keyPatterns = [
    /localStorage\.(?:getItem|setItem|removeItem)\(\s*["'`]([^"'`]+)["'`]/g,
    /loadJson(?:Array|Value)?\(\s*["'`]([^"'`]+)["'`]/g,
  ];

  jsFiles.forEach(relativeFile => {
    const text = fs.readFileSync(path.join(root, relativeFile), "utf8");
    keyPatterns.forEach(pattern => {
      for (const match of text.matchAll(pattern)) {
        keys.add(match[1]);
      }
    });
  });

  return [...keys].sort((a, b) => a.localeCompare(b));
}

function buildTree(dir, depth, maxDepth) {
  if (depth > maxDepth) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => shouldIncludeEntry(dir, entry))
    .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name));

  const lines = [];
  entries.forEach(entry => {
    const prefix = "  ".repeat(depth);
    lines.push(`${prefix}- ${entry.name}${entry.isDirectory() ? "/" : ""}`);
    if (entry.isDirectory()) {
      lines.push(...buildTree(path.join(dir, entry.name), depth + 1, maxDepth));
    }
  });

  return lines;
}

function shouldIncludeEntry(parent, entry) {
  if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) return false;
  const relative = path.normalize(path.relative(root, path.join(parent, entry.name)));
  if (GENERATED_PATHS.has(relative)) return false;
  if (/backup/i.test(entry.name)) return false;
  return true;
}

function listFiles(startDir) {
  if (!fs.existsSync(startDir)) return [];
  const output = [];

  walk(startDir);
  return output.map(file => path.normalize(path.relative(root, file)));

  function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
      if (!shouldIncludeEntry(dir, entry)) return;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        output.push(fullPath);
      }
    });
  }
}

function extractSection(text, heading) {
  return extractHeading(text, heading, 2);
}

function extractHeading(text, heading, level) {
  const lines = text.split(/\r?\n/);
  const marker = `${"#".repeat(level)} ${heading}`;
  const start = lines.findIndex(line => line.trim() === marker);
  if (start === -1) return "";

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,6})\s+/);
    if (match && match[1].length <= level) {
      end = index;
      break;
    }
  }

  return lines.slice(start + 1, end).join("\n").trim();
}

function readText(relativePath) {
  const fullPath = path.join(root, relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8") : "";
}

function runGit(args) {
  try {
    return execFileSync(gitCommand, args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function getGitBranch() {
  const branch = runGit(["branch", "--show-current"]);
  if (branch) return branch;

  const head = readGitFile("HEAD");
  const refMatch = head.match(/^ref:\s+refs\/heads\/(.+)$/);
  if (refMatch) return refMatch[1].trim();
  return head ? `(detached ${head.slice(0, 7)})` : "(unknown)";
}

function getGitStatusSummary() {
  const status = runGit(["status", "--short"]);
  if (status !== null) return status || "clean";

  const fallback = getApproximateGitStatus();
  return [
    "approximate: Node child_process could not run git in this environment",
    fallback || "clean",
  ].join("\n");
}

function getGitLog() {
  const log = runGit(["log", "--oneline", "-8"]);
  if (log) return log;

  const branch = getGitBranch();
  const refLog = branch && !branch.startsWith("(")
    ? readGitFile(path.join("logs", "refs", "heads", branch))
    : readGitFile(path.join("logs", "HEAD"));

  const commits = refLog
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-8)
    .reverse()
    .map(line => {
      const [meta, message = ""] = line.split("\t");
      const parts = meta.split(" ");
      const hash = parts[1] || "";
      return `${hash.slice(0, 7)} ${message.replace(/^commit(?: \(initial\))?:\s*/, "")}`.trim();
    });

  return commits.length ? commits.join("\n") : "(none)";
}

function readGitFile(relativePath) {
  const fullPath = path.join(root, ".git", relativePath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, "utf8").trim() : "";
}

function getApproximateGitStatus() {
  const indexEntries = readGitIndex();
  if (!indexEntries.length) return "";

  const tracked = new Set(indexEntries.map(entry => entry.path));
  const rows = [];

  indexEntries.forEach(entry => {
    const fullPath = path.join(root, ...entry.path.split("/"));
    if (!fs.existsSync(fullPath)) {
      rows.push(` D ${entry.path}`);
      return;
    }

    const stat = fs.statSync(fullPath);
    const mtimeSeconds = Math.floor(stat.mtimeMs / 1000);
    if (stat.size !== entry.size || mtimeSeconds > entry.mtimeSeconds) {
      rows.push(` M ${entry.path}`);
    }
  });

  listFiles(root).forEach(file => {
    const posix = toPosix(file);
    if (tracked.has(posix)) return;
    if (isIgnoredForApproxStatus(posix)) return;
    rows.push(`?? ${posix}`);
  });

  return rows.sort().join("\n");
}

function readGitIndex() {
  const indexPath = path.join(root, ".git", "index");
  if (!fs.existsSync(indexPath)) return [];

  const buffer = fs.readFileSync(indexPath);
  if (buffer.toString("utf8", 0, 4) !== "DIRC") return [];

  const entryCount = buffer.readUInt32BE(8);
  const entries = [];
  let offset = 12;

  for (let index = 0; index < entryCount; index += 1) {
    const entryStart = offset;
    const mtimeSeconds = buffer.readUInt32BE(offset + 8);
    const size = buffer.readUInt32BE(offset + 36);
    const flags = buffer.readUInt16BE(offset + 60);
    const nameLength = flags & 0x0fff;
    const pathStart = offset + 62;
    let pathEnd = pathStart;

    if (nameLength < 0x0fff) {
      pathEnd = pathStart + nameLength;
    } else {
      while (buffer[pathEnd] !== 0) pathEnd += 1;
    }

    const entryPath = buffer.toString("utf8", pathStart, pathEnd);
    entries.push({
      path: entryPath,
      mtimeSeconds,
      size,
    });

    offset = pathEnd + 1;
    while ((offset - entryStart) % 8 !== 0) offset += 1;
  }

  return entries;
}

function isIgnoredForApproxStatus(posixPath) {
  if (posixPath === "dev notes/snapshots/repo-snapshot-latest.md") return true;
  if (posixPath.startsWith("node_modules/")) return true;
  if (posixPath.startsWith("releases/")) return true;
  if (posixPath.startsWith("test-fixtures/") && posixPath.endsWith(".json")) return true;
  if (posixPath.endsWith(".log")) return true;
  return false;
}

function findGitCommand() {
  if (process.platform !== "win32") return "git";

  try {
    const result = execFileSync("where.exe", ["git"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split(/\r?\n/)
      .map(line => line.trim())
      .find(Boolean);

    return result || "git";
  } catch {
    return "git";
  }
}

function fenced(value) {
  return ["```text", value, "```"].join("\n");
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
