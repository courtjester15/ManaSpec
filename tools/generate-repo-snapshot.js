#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const outputPath = path.join(root, "repo-snapshot-latest.md");
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
  path.normalize("repo-snapshot-latest.md"),
  path.normalize(path.join("dev notes", "snapshots", "repo-snapshot-latest.md")),
]);

const CANONICAL_DOCS = [
  "README.md",
  "docs/README.md",
  "docs/PRODUCT_PRINCIPLES.md",
  "docs/ARCHITECTURE.md",
  "docs/DATA_MODEL.md",
  "docs/STYLE_GUIDE.md",
  "docs/ROADMAP.md",
  "docs/WORKFLOW.md",
  "docs/DECISIONS.md",
];

const WORKFLOWS = [
  {
    name: "Dashboard",
    view: "dashboard",
    owner: "js/modules/dashboard/dashboard.js",
    reads: ["specs", "radar", "transactions", "cardNotes", "priceSnapshots", "marketObservations"],
    uses: ["shared attention rows", "Signals helpers", "Card Detail/navigation helpers"],
    purpose: "Current awareness and next-action summary.",
  },
  {
    name: "Radar",
    view: "radar",
    owner: "js/modules/radar/radar.js",
    files: ["js/modules/portfolio/search.js", "js/modules/portfolio/printings.js"],
    reads: ["radar", "cardNotes", "marketObservations", "Scryfall API"],
    writes: ["radar", "specs", "transactions", "cardNotes"],
    uses: ["shared tables", "printing selection", "buy flow", "Card Detail"],
    purpose: "Discovery, exact printing selection, watched ideas, entry planning, and planned quantity.",
  },
  {
    name: "Positions",
    view: "portfolio",
    owner: "js/modules/portfolio/portfolio.js",
    files: ["js/modules/portfolio/trading.js", "js/modules/portfolio/pricing.js", "js/modules/portfolio/snapshots.js"],
    reads: ["specs", "radar", "transactions", "priceSnapshots", "priceRefreshStatus"],
    writes: ["specs", "cash", "transactions", "priceSnapshots", "priceRefreshStatus"],
    uses: ["shared tables", "transaction logging", "price refresh", "Card Detail"],
    purpose: "Owned holdings, exit planning, position management, price checks, and P/L.",
  },
  {
    name: "Signals",
    view: "signals",
    owner: "js/modules/signals/signals.js",
    reads: ["specs", "radar", "cardNotes", "marketObservations", "priceRefreshStatus"],
    writes: ["signals"],
    uses: ["shared tables", "Dashboard-style attention rows", "source navigation"],
    purpose: "Computed read-only attention layer for target, plan, hold, and market-check states.",
  },
  {
    name: "Card Detail",
    view: "(modal)",
    owner: "js/modules/card-details/card-details.js",
    reads: ["specs", "radar", "cardNotes", "marketObservations", "priceSnapshots"],
    writes: ["specs", "radar", "cardNotes", "marketObservations"],
    uses: ["notes helpers", "market observations", "plan editing", "price snapshots"],
    purpose: "Command center for one exact tracked printing and canonical plan edits.",
  },
  {
    name: "Transactions",
    view: "transactions",
    owner: "js/modules/transactions/transactions.js",
    reads: ["transactions", "specs", "cash"],
    writes: ["transactions"],
    uses: ["shared tables", "position metadata", "ledger review context"],
    purpose: "Early ledger event surface for buys, sells, backfills, corrections, and review context.",
  },
  {
    name: "History",
    view: "history",
    owner: "js/modules/history/history.js",
    reads: ["transactions", "radar", "cardNotes", "thesisNotes"],
    uses: ["shared tables", "notes helpers", "transaction review helpers"],
    purpose: "Review trail across transactions, Radar activity, card notes, and thesis notes.",
  },
  {
    name: "Notes",
    view: "(shared)",
    owner: "js/modules/notes/notes.js",
    reads: ["cardNotes", "specs", "radar"],
    writes: ["cardNotes"],
    uses: ["tracked printing identity helpers"],
    purpose: "Shared exact-printing note helpers used by tables, Dashboard, History, and Card Detail.",
  },
  {
    name: "Admin",
    view: "admin",
    owner: "js/modules/admin/admin.js",
    reads: ["specs", "radar", "transactions", "cardNotes", "priceSnapshots", "marketObservations", "cash"],
    writes: ["specs", "radar", "transactions", "cardNotes", "priceSnapshots", "marketObservations", "cash"],
    uses: ["backup/import helpers", "app confirmation", "summary refresh"],
    purpose: "Local data safety, backup/import, cash reset, and maintenance workflows.",
  },
];

const DATA_CONTRACTS = [
  {
    name: "Radar Item",
    owner: "Radar / Card Detail",
    storage: "radar",
    fields: ["id", "name", "set_code", "collector_number", "foil", "currentPrice", "entryTarget", "plannedQty", "status", "addedDate"],
    consumers: ["Dashboard", "Radar", "Signals", "Card Detail", "History", "Pricing"],
  },
  {
    name: "Position",
    owner: "Positions / Card Detail",
    storage: "specs",
    fields: ["id", "name", "qty", "buyPrice", "currentPrice", "exitTarget", "holdUntil", "foil", "buyDate"],
    consumers: ["Dashboard", "Positions", "Signals", "Transactions", "Card Detail", "Pricing"],
  },
  {
    name: "Transaction",
    owner: "Transactions / trading helpers",
    storage: "transactions",
    fields: ["id", "cardId", "type", "quantity", "price", "date", "notes", "realizedPL", "balanceAfter"],
    consumers: ["Transactions", "History", "Dashboard", "Admin backup"],
  },
  {
    name: "Signal",
    owner: "Signals",
    storage: "signals (legacy saved records); active rows are computed",
    fields: ["id", "source", "status", "bucket", "reason", "targetValue", "currentPrice"],
    consumers: ["Signals", "Dashboard"],
  },
  {
    name: "Card Note",
    owner: "Notes / Card Detail",
    storage: "cardNotes",
    fields: ["id", "cardKey", "cardId", "cardName", "text", "createdAt", "source"],
    consumers: ["Dashboard", "History", "Card Detail", "Radar", "Positions"],
  },
  {
    name: "Market Observation",
    owner: "Card Detail",
    storage: "marketObservations",
    fields: ["id", "cardKey", "text", "createdAt", "source", "evaluation"],
    consumers: ["Card Detail", "Dashboard", "Signals"],
  },
  {
    name: "Price Snapshot",
    owner: "Pricing / snapshots",
    storage: "priceSnapshots",
    fields: ["id", "cardId", "date", "price", "source", "foil"],
    consumers: ["Positions", "Card Detail", "Dashboard", "Admin backup"],
  },
];

const SHARED_COMPONENT_HINTS = [
  { name: "Shared tables", files: ["js/ui/table.js"], markers: ["renderStandardTable", "paginateStandardRows", "sortStandardRows"] },
  { name: "Context bands", files: ["js/ui/context-band.js"], markers: ["renderContextBand"] },
  { name: "Summary bar", files: ["js/ui/summary.js"], markers: ["updateTotals", "summaryBar"] },
  { name: "Help drawer", files: ["js/ui/help.js"], markers: ["openHelpDrawer", "help"] },
  { name: "Toast system", files: ["js/core/app.js"], markers: ["showAppNotice", "toastStack"] },
  { name: "Confirmation dialog", files: ["js/core/app.js"], markers: ["requestAppConfirmation", "appConfirmDialog"] },
  { name: "Card Detail helpers", files: ["js/modules/card-details/card-details.js"], markers: ["openCardDetail", "cardDetail"] },
  { name: "Formatting helpers", files: ["js/core/app.js", "js/ui/table.js"], markers: ["money", "tableMoney", "escapeHtml"] },
  { name: "Storage helpers", files: ["js/core/storage.js"], markers: ["loadJsonValue", "saveState", "createManaSpecBackup"] },
  { name: "Tracked printing identity", files: ["js/modules/card-metadata/card-metadata.js", "js/modules/notes/notes.js"], markers: ["getTrackedPrintingKey", "findTrackedCard"] },
];

const STORAGE_PURPOSES = {
  specs: "Owned Positions and current position state.",
  radar: "Watched pre-purchase ideas and entry planning state.",
  transactions: "Early ledger events for buys, sells, backfills, and review context.",
  cardNotes: "Shared notes keyed to exact tracked printing identity.",
  thesisNotes: "Retired or archived thesis notes preserved for compatibility.",
  signals: "Legacy saved signal records; active Signals rows are mostly computed.",
  cash: "Available cash balance.",
  priceSnapshots: "Dated price snapshots for tracked cards.",
  priceRefreshStatus: "Metadata for the latest price refresh.",
  marketObservations: "Saved market-check observations for tracked printings.",
  cardDetailNotesExpanded: "Card Detail UI expansion preference.",
  manaspec_pre_import_backup: "Emergency backup captured before import restore.",
};

const BUILT_IN_WINDOW_GLOBALS = new Set([
  "window.alert",
  "window.clearTimeout",
  "window.location",
  "window.requestAnimationFrame",
  "window.scrollTo",
  "window.scrollX",
  "window.scrollY",
  "window.setTimeout",
]);

main();

function main() {
  const html = readText("index.html");
  const cssLinks = extractCssLinks(html);
  const scripts = extractScripts(html);
  const jsAnalyses = analyzeJavaScriptFiles(scripts);
  const cssAnalyses = analyzeCssFiles(cssLinks);
  const storageContracts = analyzeStorageContracts(jsAnalyses);
  const globalSymbols = buildGlobalSymbolIndex(jsAnalyses);

  const sections = [
    "# ManaSpec Repository Snapshot",
    "",
    renderSourceOfTruthNotice(),
    renderRepositoryOverview(html, scripts, cssLinks, jsAnalyses, cssAnalyses, storageContracts),
    renderRuntimeArchitecture(html, scripts, cssLinks, jsAnalyses),
    renderScreenOwnershipMap(jsAnalyses),
    renderRuntimeDataFlow(),
    renderJavaScriptInventory(jsAnalyses, globalSymbols),
    renderSharedComponentInventory(jsAnalyses),
    renderLocalStorageContract(storageContracts),
    renderDataContractSummary(storageContracts),
    renderDependencyMap(jsAnalyses),
    renderDomContract(jsAnalyses),
    renderCssStructure(cssAnalyses),
    renderHtmlLoadOrder(html, scripts, cssLinks),
    renderGlobalNamespaceSummary(jsAnalyses),
    renderArchitectureHotspots(jsAnalyses, cssAnalyses),
    renderRepositoryMetrics(jsAnalyses, cssAnalyses, storageContracts),
    renderDocsMapSection(),
    renderRepositoryStructureSection(),
    renderSnapshotLimits(),
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, sections.join("\n"), "utf8");
  console.log(`Generated ${path.relative(root, outputPath)}`);
}

function renderSourceOfTruthNotice() {
  return [
    "## Source Of Truth Notice",
    "",
    "Generated: This is a generated repository orientation snapshot.",
    "",
    "It is intended to help humans and AI quickly understand project structure. It is not the source of truth.",
    "",
    "Always open the real files before editing. Product, architecture, workflow, UI, and data truth live in `/docs`, especially:",
    "",
    ...CANONICAL_DOCS.map(file => `- \`${file}\`${fs.existsSync(path.join(root, file)) ? "" : " (missing)"}`),
    "",
  ].join("\n");
}

function renderRepositoryOverview(html, scripts, cssLinks, jsAnalyses, cssAnalyses, storageContracts) {
  const version = extractVersion(html);
  const status = getGitStatusSummary();
  const jsFiles = jsAnalyses.map(item => item.path);
  const cssFiles = cssAnalyses.map(item => item.path);

  return [
    "## Repository Overview",
    "",
    `- Detected project type: Local-first MTG speculation workflow terminal.`,
    `- Detected current version: ${version || "(not found)"}.`,
    "- Detected app architecture: static HTML shell, vanilla JS global scripts, localStorage persistence, Scryfall API reads, no backend.",
    "- Detected SPA structure: single `index.html` shell with workflow views rendered into `#viewContainer`.",
    "- Detected build step: none found; files appear to run directly in the browser.",
    `- Generated timestamp: ${new Date().toISOString()}.`,
    `- Git branch: ${getGitBranch()}.`,
    "- Git status:",
    fenced(status),
    "- Recent commits:",
    fenced(getGitLog()),
    "- Primary active folders:",
    "  - `js/core/`: storage, state, navigation, boot.",
    "  - `js/modules/`: workflow modules.",
    "  - `js/ui/`: shared UI surfaces.",
    "  - `css/`: active styling split into imported CSS layers.",
    "  - `docs/`: canonical project truth.",
    "  - `dev notes/`: raw or historical project memory.",
    `- Detected active JS files: ${jsFiles.length}.`,
    `- Detected active CSS files: ${cssFiles.length}.`,
    `- Detected localStorage keys: ${storageContracts.length}.`,
    "",
  ].join("\n");
}

function renderRuntimeArchitecture(html, scripts, cssLinks, jsAnalyses) {
  const runtimeGlobals = unique(jsAnalyses.flatMap(item => item.runtimeStateGlobals)).sort();
  const namespaces = unique(jsAnalyses.flatMap(item => item.windowGlobals)).sort();
  const renderFunctions = jsAnalyses.flatMap(item => item.functions.filter(name => /^render[A-Z]/.test(name)));

  return [
    "## Runtime Architecture",
    "",
    "- Detected entry HTML: `index.html`.",
    "- Detected boot file: `js/core/app.js` loaded last and calls app initialization.",
    "- Detected script load order: storage, state, metadata/shared UI, workflow modules, summary/help/pricing, app boot.",
    "- Detected view rendering: workflow render functions write into `#viewContainer` after navigation changes.",
    "- Detected navigation: `.toolbar-tab` buttons with `data-view` attributes.",
    `- Detected active CSS entry: ${cssLinks.map(link => `\`${link}\``).join(", ") || "(none)"}.`,
    `- Detected runtime state globals: ${runtimeGlobals.length ? runtimeGlobals.map(name => `\`${name}\``).join(", ") : "(none)"}.`,
    `- Detected runtime namespaces/window flags: ${namespaces.length ? namespaces.map(name => `\`${name}\``).join(", ") : "(none)"}.`,
    `- Detected render functions: ${formatCappedList(renderFunctions.sort(), 20)}.`,
    "- Shared UI systems referenced: standard tables, context bands, global summary, help drawer, toasts, confirmation dialog, Card Detail modal, card art preview.",
    "",
  ].join("\n");
}

function renderScreenOwnershipMap(jsAnalyses) {
  const analysisByPath = new Map(jsAnalyses.map(item => [item.path, item]));
  const lines = ["## Screen Ownership Map", ""];

  WORKFLOWS.forEach(workflow => {
    const files = [workflow.owner, ...(workflow.files || [])];
    const detectedReads = unique(files.flatMap(file => analysisByPath.get(file)?.storageReads || []));
    const detectedWrites = unique(files.flatMap(file => analysisByPath.get(file)?.storageWrites || []));
    const dependencies = unique(files.flatMap(file => analysisByPath.get(file)?.dependencies || []));

    lines.push(`### ${workflow.name}`);
    lines.push("");
    lines.push(`- Owner: \`${workflow.owner}\`${fs.existsSync(path.join(root, workflow.owner)) ? "" : " (missing)"}`);
    if (workflow.view) lines.push(`- View: ${workflow.view}.`);
    lines.push(`- Likely responsibility: ${workflow.purpose}`);
    lines.push(`- Referenced support files: ${formatCappedList(workflow.files || [], 8)}.`);
    lines.push(`- Detected reads: ${formatCappedList(detectedReads.length ? detectedReads : workflow.reads || [], 12)}.`);
    lines.push(`- Detected writes: ${formatCappedList(detectedWrites.length ? detectedWrites : workflow.writes || [], 12)}.`);
    lines.push(`- Likely uses: ${formatCappedList(workflow.uses || dependencies, 12)}.`);
    lines.push("");
  });

  return lines.join("\n");
}

function renderRuntimeDataFlow() {
  return [
    "## Runtime Data Flow",
    "",
    "Generated conceptual flow. This is intentionally a workflow map, not a complete call graph.",
    "",
    "```text",
    "Search",
    "  -> Printings",
    "  -> Radar",
    "  -> Buy",
    "  -> Positions",
    "  -> Transactions",
    "  -> History",
    "  -> Dashboard",
    "  -> Signals",
    "  -> Card Detail",
    "  -> Notes / Market Observations / Price Snapshots",
    "```",
    "",
    "- Detected persistence flow: workflow modules mutate runtime arrays, then write localStorage keys directly or through storage helpers.",
    "- Likely read flow: Dashboard, Signals, History, and Card Detail aggregate data from multiple workflow-owned stores.",
    "- Referenced external data flow: Search, Printings, and Pricing call Scryfall API endpoints.",
    "",
  ].join("\n");
}

function renderJavaScriptInventory(jsAnalyses, globalSymbols) {
  const lines = ["## JavaScript Inventory", ""];

  jsAnalyses.forEach(item => {
    lines.push(`### ${item.path}`);
    lines.push("");
    lines.push(`- Approximate line count: ${item.lineCount}.`);
    lines.push(`- Exported globals: ${formatCappedList(item.exportedGlobals, 20)}.`);
    lines.push(`- Top-level functions: ${formatCappedList(item.functions, 24)}.`);
    lines.push(`- Major constants: ${formatCappedList(item.constants, 18)}.`);
    lines.push(`- Likely responsibility: ${describeLikelyResponsibility(item.path, item)}.`);
    lines.push(`- Detected dependencies: ${formatCappedList(item.dependencies, 18)}.`);
    lines.push(`- Detected runtime globals referenced: ${formatCappedList(item.referencedRuntimeGlobals, 18)}.`);
    lines.push(`- Referenced cross-file symbols: ${formatCappedList(findReferencedGlobalSymbols(item, globalSymbols), 18)}.`);
    lines.push("");
  });

  return lines.join("\n");
}

function renderSharedComponentInventory(jsAnalyses) {
  const analysisByPath = new Map(jsAnalyses.map(item => [item.path, item]));
  const lines = ["## Shared Component Inventory", ""];

  SHARED_COMPONENT_HINTS.forEach(component => {
    const files = component.files.filter(file => analysisByPath.has(file) || fs.existsSync(path.join(root, file)));
    const detectedMarkers = component.markers.filter(marker => files.some(file => readText(file).includes(marker)));
    const consumers = jsAnalyses
      .filter(item => detectedMarkers.some(marker => item.path !== component.files[0] && item.text.includes(marker)))
      .map(item => item.path);

    lines.push(`### ${component.name}`);
    lines.push("");
    lines.push(`- Detected files: ${formatCappedList(files, 8)}.`);
    lines.push(`- Detected markers: ${formatCappedList(detectedMarkers, 12)}.`);
    lines.push(`- Referenced by: ${formatCappedList(consumers, 12)}.`);
    lines.push("");
  });

  return lines.join("\n");
}

function renderLocalStorageContract(storageContracts) {
  const lines = ["## localStorage Contract", ""];
  lines.push("Generated from string-literal storage calls and known backup helper arrays. Do not treat sample fields as exhaustive.");
  lines.push("");

  storageContracts.forEach(contract => {
    lines.push(`### ${contract.key}`);
    lines.push("");
    lines.push(`- Purpose: ${contract.purpose}.`);
    lines.push(`- Approximate structure: ${contract.structure}.`);
    lines.push(`- Sample fields: ${formatCappedList(contract.sampleFields, 14)}.`);
    lines.push(`- Modules that appear to read it: ${formatCappedList(contract.readers, 12)}.`);
    lines.push(`- Modules that appear to write it: ${formatCappedList(contract.writers, 12)}.`);
    lines.push(`- Detection: ${contract.detection}.`);
    lines.push("");
  });

  return lines.join("\n");
}

function renderDataContractSummary(storageContracts) {
  const storageKeys = new Set(storageContracts.map(contract => contract.key));
  const lines = ["## Data Contract Summary", ""];

  DATA_CONTRACTS.forEach(entity => {
    lines.push(`### ${entity.name}`);
    lines.push("");
    lines.push(`- Owner: ${entity.owner}.`);
    lines.push(`- Sample fields: ${formatCappedList(entity.fields, 16)}.`);
    lines.push(`- Primary storage: ${entity.storage}${storageKeys.has(entity.storage) ? " (detected)" : ""}.`);
    lines.push(`- Primary consumers: ${formatCappedList(entity.consumers, 12)}.`);
    lines.push("");
  });

  return lines.join("\n");
}

function renderDependencyMap(jsAnalyses) {
  const lines = ["## Dependency Map", ""];
  lines.push("Generated dependency hints. This is not a complete call graph.");
  lines.push("");

  WORKFLOWS.forEach(workflow => {
    const related = jsAnalyses
      .filter(item => item.path === workflow.owner || (workflow.files || []).includes(item.path))
      .flatMap(item => item.dependencies.concat(item.referencedRuntimeGlobals))
      .filter(Boolean);

    lines.push(`### ${workflow.name}`);
    lines.push("");
    lines.push("```text");
    lines.push(workflow.name);
    unique(related).sort().slice(0, 8).forEach(dep => {
      lines.push(`  -> ${dep}`);
    });
    if (unique(related).length > 8) lines.push(`  -> ... capped ${unique(related).length - 8} more`);
    lines.push("```");
    lines.push("");
  });

  return lines.join("\n");
}

function renderDomContract(jsAnalyses) {
  const lines = ["## DOM Contract", ""];
  lines.push("Detected selectors used by active JS. Generated class names are heuristic and capped.");
  lines.push("");

  jsAnalyses.forEach(item => {
    lines.push(`### ${item.path}`);
    lines.push("");
    lines.push(`- IDs used: ${formatCappedList(item.dom.ids, 24)}.`);
    lines.push(`- Classes used: ${formatCappedList(item.dom.classes, 24)}.`);
    lines.push(`- Query selectors: ${formatCappedList(item.dom.selectors, 24)}.`);
    lines.push(`- Generated class names: ${formatCappedList(item.dom.generatedClasses, 24)}.`);
    lines.push("");
  });

  return lines.join("\n");
}

function renderCssStructure(cssAnalyses) {
  const lines = ["## CSS Structure", ""];

  cssAnalyses.forEach(item => {
    lines.push(`### ${item.path}`);
    lines.push("");
    lines.push(`- Approximate size: ${formatBytes(item.bytes)}; approximate lines: ${item.lineCount}.`);
    lines.push(`- Major selector groups: ${formatCappedList(item.groups, 20)}.`);
    lines.push(`- Detected layout selectors: ${formatCappedList(item.layout, 16)}.`);
    lines.push(`- Detected table selectors: ${formatCappedList(item.tables, 16)}.`);
    lines.push(`- Detected form selectors: ${formatCappedList(item.forms, 16)}.`);
    lines.push(`- Detected component/modal selectors: ${formatCappedList(item.components, 16)}.`);
    lines.push(`- Detected workflow selectors: ${formatCappedList(item.workflow, 18)}.`);
    lines.push(`- Media queries: ${item.mediaQueries}; print rules: ${item.printRules}.`);
    lines.push("");
  });

  return lines.join("\n");
}

function renderHtmlLoadOrder(html, scripts, cssLinks) {
  const shellIds = extractHtmlIds(html);
  const navViews = [...html.matchAll(/data-view="([^"]+)"/g)].map(match => match[1]);

  return [
    "## HTML Load Order",
    "",
    "### CSS",
    "",
    ...(cssLinks.length ? cssLinks.map((href, index) => `${index + 1}. ${href}`) : ["- (none detected)"]),
    "",
    "### JavaScript",
    "",
    ...(scripts.length ? scripts.map((src, index) => `${index + 1}. ${src}`) : ["- (none detected)"]),
    "",
    "### App Shell",
    "",
    `- Navigation views: ${formatCappedList(navViews, 12)}.`,
    `- Root containers and mounts: ${formatCappedList(shellIds, 24)}.`,
    "- Modal/shared UI mounts: `toastStack`, `appConfirmDialog`, Card Detail modal generated at runtime.",
    "",
  ].join("\n");
}

function renderGlobalNamespaceSummary(jsAnalyses) {
  const runtimeGlobals = unique(jsAnalyses.flatMap(item => item.runtimeStateGlobals)).sort();
  const windowGlobals = unique(jsAnalyses.flatMap(item => item.windowGlobals)).sort();
  const topLevelFunctions = unique(jsAnalyses.flatMap(item => item.functions)).sort();
  const topLevelState = unique(jsAnalyses.flatMap(item => item.topLevelVariables)).sort();

  return [
    "## Global Namespace Summary",
    "",
    `- Detected runtime state globals: ${formatCappedList(runtimeGlobals, 30)}.`,
    `- Detected top-level state variables: ${formatCappedList(topLevelState, 30)}.`,
    `- Detected window.* assignments/flags: ${formatCappedList(windowGlobals, 30)}.`,
    `- Detected top-level function globals: ${formatCappedList(topLevelFunctions, 40)}.`,
    "",
  ].join("\n");
}

function renderArchitectureHotspots(jsAnalyses, cssAnalyses) {
  const largestJs = [...jsAnalyses].sort((a, b) => b.lineCount - a.lineCount).slice(0, 8);
  const largestCss = [...cssAnalyses].sort((a, b) => b.lineCount - a.lineCount).slice(0, 6);
  const docs = listFiles(path.join(root, "docs"))
    .filter(file => file.endsWith(".md"))
    .map(file => ({
      path: toPosix(file),
      lines: lineCount(readText(file)),
      bytes: fs.statSync(path.join(root, file)).size,
    }))
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 8);
  const highDependency = [...jsAnalyses]
    .sort((a, b) => b.dependencies.length + b.referencedRuntimeGlobals.length - (a.dependencies.length + a.referencedRuntimeGlobals.length))
    .slice(0, 8);

  return [
    "## Architecture Hotspots",
    "",
    "Informational only. This section identifies central or larger files; it does not recommend refactoring.",
    "",
    "### Largest JS Files",
    "",
    ...largestJs.map(item => `- ${item.path}: ${item.lineCount} lines`),
    "",
    "### Largest CSS Files",
    "",
    ...largestCss.map(item => `- ${item.path}: ${item.lineCount} lines`),
    "",
    "### Largest Documentation Files",
    "",
    ...docs.map(item => `- ${item.path}: ${item.lines} lines`),
    "",
    "### High-Dependency Modules",
    "",
    ...highDependency.map(item => `- ${item.path}: ${item.dependencies.length} dependencies, ${item.referencedRuntimeGlobals.length} runtime globals referenced`),
    "",
    "### Shared Infrastructure Modules",
    "",
    "- js/core/storage.js",
    "- js/core/state.js",
    "- js/core/app.js",
    "- js/ui/table.js",
    "- js/ui/context-band.js",
    "- js/ui/summary.js",
    "- js/modules/card-details/card-details.js",
    "",
  ].join("\n");
}

function renderRepositoryMetrics(jsAnalyses, cssAnalyses, storageContracts) {
  const docFiles = listFiles(path.join(root, "docs")).filter(file => file.endsWith(".md"));
  const activeModuleCount = WORKFLOWS.length;
  const jsLineCounts = jsAnalyses.map(item => item.lineCount);
  const largestFiles = listFiles(root)
    .filter(file => /\.(js|css|md|html)$/.test(file))
    .filter(file => !toPosix(file).startsWith("dev notes/archive/"))
    .map(file => ({ path: toPosix(file), bytes: fs.statSync(path.join(root, file)).size }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 12);

  return [
    "## Repository Metrics",
    "",
    `- JS file count: ${jsAnalyses.length}.`,
    `- CSS file count: ${cssAnalyses.length}.`,
    `- Documentation count under docs/: ${docFiles.length}.`,
    `- Script count in index.html: ${jsAnalyses.length}.`,
    `- Storage key count: ${storageContracts.length}.`,
    `- Workflow/module count: ${activeModuleCount}.`,
    `- Average active JS module size: ${jsLineCounts.length ? Math.round(jsLineCounts.reduce((sum, value) => sum + value, 0) / jsLineCounts.length) : 0} lines.`,
    "- Largest generated file set:",
    ...largestFiles.map(item => `  - ${item.path}: ${formatBytes(item.bytes)}`),
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
    "Referenced from active docs when available.",
    "",
    ...lines,
    "",
  ].join("\n");
}

function renderRepositoryStructureSection() {
  return [
    "## Repository Structure",
    "",
    "Generated shallow tree. Release copies, backups, generated snapshot output, and dependency folders are excluded.",
    "",
    ...buildTree(root, 0, 2),
    "",
  ].join("\n");
}

function renderSnapshotLimits() {
  return [
    "## Snapshot Limits",
    "",
    "- Generated: this file is produced by `tools/generate-repo-snapshot.js`.",
    "- Lightweight: scanners use regexes and curated hints, not deep static analysis.",
    "- Heuristic: ownership and dependencies are labeled as detected, likely, referenced, generated, or capped.",
    "- Capped: long lists are truncated to keep the snapshot readable and diffs manageable.",
    "- Orientation only: do not edit application code based only on this snapshot; open the real source and docs first.",
    "- Excluded: full source code, full JSON data, CSS dumps, backup data, historical release copies, and generated mirrors of canonical docs.",
    "",
  ].join("\n");
}

function analyzeJavaScriptFiles(scripts) {
  return scripts
    .filter(src => src.startsWith("js/"))
    .map(src => {
      const relativePath = toNative(src);
      const text = readText(relativePath);
      const functions = unique([...text.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(match => match[1])).sort();
      const constants = unique([...text.matchAll(/^const\s+([A-Z][A-Z0-9_$]*)\s*=/gm)].map(match => match[1])).sort();
      const topLevelVariables = unique([...text.matchAll(/^(?:let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm)].map(match => match[1])).sort();
      const windowGlobals = unique([...text.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\b/g)]
        .map(match => `window.${match[1]}`)
        .filter(name => !BUILT_IN_WINDOW_GLOBALS.has(name))).sort();
      const runtimeStateGlobals = unique(topLevelVariables.filter(name => [
        "specs",
        "radar",
        "signals",
        "thesisNotes",
        "cardNotes",
        "transactions",
        "cash",
        "startingCash",
        "currentPrintings",
        "marketObservations",
        "priceRefreshInFlight",
      ].includes(name))).sort();
      const storage = extractStorageAccess(text);
      const dom = extractDomContract(text);
      const dependencies = detectDependencies(text);
      const referencedRuntimeGlobals = detectRuntimeGlobalReferences(text);
      const exportedGlobals = unique(functions.concat(topLevelVariables, constants, runtimeStateGlobals)).sort();

      return {
        path: toPosix(relativePath),
        text,
        lineCount: lineCount(text),
        functions,
        constants,
        topLevelVariables,
        exportedGlobals,
        windowGlobals,
        runtimeStateGlobals,
        storageReads: storage.reads,
        storageWrites: storage.writes,
        dependencies,
        referencedRuntimeGlobals,
        dom,
      };
    });
}

function analyzeCssFiles(cssLinks) {
  const active = expandCssImports(cssLinks);
  return active.map(file => {
    const relativePath = toNative(file);
    const text = readText(relativePath);
    const selectors = extractCssSelectors(text);
    return {
      path: toPosix(relativePath),
      bytes: fs.existsSync(path.join(root, relativePath)) ? fs.statSync(path.join(root, relativePath)).size : 0,
      lineCount: lineCount(text),
      groups: groupSelectors(selectors),
      layout: selectors.filter(selector => /(container|layout|grid|flex|header|workbar|view-container|toolbar|app-shell)/i.test(selector)).slice(0, 20),
      tables: selectors.filter(selector => /(table|ms-table|row|cell|pagination)/i.test(selector)).slice(0, 20),
      forms: selectors.filter(selector => /(input|select|button|form|field|filter|control)/i.test(selector)).slice(0, 20),
      components: selectors.filter(selector => /(modal|drawer|toast|card|band|summary|dialog|preview|tile)/i.test(selector)).slice(0, 20),
      workflow: selectors.filter(selector => /(dashboard|radar|portfolio|position|signal|transaction|history|admin|card-detail)/i.test(selector)).slice(0, 24),
      mediaQueries: (text.match(/@media\b/g) || []).length,
      printRules: (text.match(/@media\s+print|@page\b/g) || []).length,
    };
  });
}

function analyzeStorageContracts(jsAnalyses) {
  const keys = new Map();
  jsAnalyses.forEach(item => {
    item.storageReads.forEach(key => touchStorage(keys, key, item.path, "read"));
    item.storageWrites.forEach(key => touchStorage(keys, key, item.path, "write"));
  });

  Object.keys(STORAGE_PURPOSES).forEach(key => touchStorage(keys, key, null, "known"));

  return [...keys.values()]
    .map(contract => ({
      ...contract,
      readers: [...contract.readers].sort(),
      writers: [...contract.writers].sort(),
      sampleFields: getStorageSampleFields(contract.key),
      structure: getStorageStructure(contract.key),
      purpose: STORAGE_PURPOSES[contract.key] || "Detected storage key; purpose should be confirmed in source/docs",
      detection: [...contract.detections].sort().join(", "),
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function touchStorage(keys, key, file, type) {
  if (!key) return;
  if (!keys.has(key)) {
    keys.set(key, {
      key,
      readers: new Set(),
      writers: new Set(),
      detections: new Set(),
    });
  }
  const contract = keys.get(key);
  if (file && type === "read") contract.readers.add(file);
  if (file && type === "write") contract.writers.add(file);
  contract.detections.add(type === "known" ? "known key hint" : `detected ${type}`);
}

function buildGlobalSymbolIndex(jsAnalyses) {
  const index = new Map();
  jsAnalyses.forEach(item => {
    item.functions.concat(item.topLevelVariables, item.constants).forEach(symbol => {
      if (!index.has(symbol)) index.set(symbol, []);
      index.get(symbol).push(item.path);
    });
  });
  return index;
}

function findReferencedGlobalSymbols(item, globalSymbols) {
  const refs = [];
  for (const [symbol, owners] of globalSymbols.entries()) {
    if (owners.includes(item.path)) continue;
    const pattern = new RegExp(`\\b${escapeRegExp(symbol)}\\b`);
    if (pattern.test(item.text)) {
      refs.push(`${symbol} (${owners.join(", ")})`);
    }
  }
  return refs.sort();
}

function extractStorageAccess(text) {
  const reads = new Set();
  const writes = new Set();
  const readPatterns = [
    /localStorage\.getItem\(\s*["'`]([^"'`]+)["'`]/g,
    /loadJson(?:Array|Value)?\(\s*["'`]([^"'`]+)["'`]/g,
  ];
  const writePatterns = [
    /localStorage\.(?:setItem|removeItem)\(\s*["'`]([^"'`]+)["'`]/g,
    /save(?:Radar|Signals|Thesis|CardNotes|Transactions|MarketObservations)?State?\(\s*["'`]([^"'`]+)["'`]/g,
  ];

  readPatterns.forEach(pattern => {
    for (const match of text.matchAll(pattern)) reads.add(match[1]);
  });
  writePatterns.forEach(pattern => {
    for (const match of text.matchAll(pattern)) writes.add(match[1]);
  });

  for (const match of text.matchAll(/MANASPEC_BACKUP_ARRAY_KEYS\s*=\s*\[([\s\S]*?)\]/g)) {
    for (const keyMatch of match[1].matchAll(/["'`]([^"'`]+)["'`]/g)) {
      reads.add(keyMatch[1]);
      writes.add(keyMatch[1]);
    }
  }

  return { reads: [...reads].sort(), writes: [...writes].sort() };
}

function extractDomContract(text) {
  const ids = unique([
    ...[...text.matchAll(/getElementById\(\s*["'`]([^"'`]+)["'`]/g)].map(match => `#${match[1]}`),
    ...[...text.matchAll(/#([A-Za-z][\w-]+)/g)].map(match => `#${match[1]}`),
  ]).sort();
  const classes = unique([
    ...[...text.matchAll(/classList\.(?:add|remove|toggle|contains)\(\s*["'`]([^"'`]+)["'`]/g)].map(match => `.${match[1]}`),
    ...[...text.matchAll(/className\s*=\s*["'`]([^"'`]+)["'`]/g)].flatMap(match => match[1].split(/\s+/).map(name => `.${name}`)),
    ...[...text.matchAll(/class=["'`]([^"'`]+)["'`]/g)].flatMap(match => match[1].split(/\s+/).map(name => `.${name}`)),
    ...[...text.matchAll(/querySelector(?:All)?\(\s*["'`]([^"'`]+)["'`]/g)].flatMap(match => extractClassesFromSelector(match[1])),
  ])
    .filter(isLikelyClassName)
    .sort();
  const selectors = unique([...text.matchAll(/querySelector(?:All)?\(\s*["'`]([^"'`]+)["'`]/g)].map(match => match[1])).sort();
  const generatedClasses = unique([...text.matchAll(/class=["'`]([^"'`]+)["'`]/g)]
    .flatMap(match => match[1].split(/\s+/).filter(Boolean).map(name => `.${name}`))
    .filter(isLikelyClassName)).sort();
  return { ids, classes, selectors, generatedClasses };
}

function detectDependencies(text) {
  const deps = [];
  const dependencyChecks = [
    ["Scryfall API", /api\.scryfall\.com|scryfall/i],
    ["localStorage", /localStorage\./],
    ["shared table renderer", /renderStandardTable|paginateStandardRows|setStandardTableSort|sortStandardRows/],
    ["context band", /renderContextBand/],
    ["Card Detail", /openCardDetail|card-detail|cardDetail/i],
    ["notes helpers", /CardNote|cardNotes|getTrackedNote|addCardNote/i],
    ["transactions", /transactions|logTransaction|getTransactionsWithReviewContext/],
    ["pricing/snapshots", /priceSnapshots|refreshPrices|saveDailyPriceSnapshots|priceRefresh/i],
    ["app navigation", /setActiveView|openTrackedSource|focusTrackedRow/],
    ["app notices", /showAppNotice|requestAppConfirmation/],
    ["Dashboard/Signals attention", /getAllSignalRows|getDashboardSignalRows|attention-queue-row/],
    ["backup/import", /createManaSpecBackup|restoreManaSpecBackup|parseManaSpecBackupText/],
  ];

  dependencyChecks.forEach(([label, pattern]) => {
    if (pattern.test(text)) deps.push(label);
  });

  return deps.sort();
}

function detectRuntimeGlobalReferences(text) {
  const names = [
    "specs",
    "radar",
    "signals",
    "thesisNotes",
    "cardNotes",
    "transactions",
    "cash",
    "startingCash",
    "currentPrintings",
    "priceSnapshots",
    "marketObservations",
  ];
  return names.filter(name => new RegExp(`\\b${name}\\b`).test(text)).sort();
}

function describeLikelyResponsibility(file, analysis) {
  const workflow = WORKFLOWS.find(item => item.owner === file || (item.files || []).includes(file));
  if (workflow) return workflow.purpose;
  if (file.includes("/core/storage")) return "Storage safety, backup/import, load/save helpers.";
  if (file.includes("/core/state")) return "Startup state loading, migrations, and backfills.";
  if (file.includes("/core/app")) return "Navigation, global search, toasts, confirmations, and app boot.";
  if (file.includes("/ui/")) return "Shared UI infrastructure.";
  if (analysis.functions.some(name => /^render/.test(name))) return "View or component rendering.";
  return "Active runtime module; inspect source before editing.";
}

function getStorageSampleFields(key) {
  const found = DATA_CONTRACTS.find(entity => entity.storage === key);
  if (found) return found.fields;
  const samples = {
    cash: ["number"],
    priceRefreshStatus: ["checkedAt", "updatedCount"],
    cardDetailNotesExpanded: ["boolean"],
    thesisNotes: ["id", "cardId", "cardName", "conviction", "text", "createdAt"],
    manaspec_pre_import_backup: ["createdAt", "reason", "backup"],
  };
  return samples[key] || [];
}

function getStorageStructure(key) {
  if (["cash", "cardDetailNotesExpanded"].includes(key)) return "scalar";
  if (key === "priceRefreshStatus") return "object";
  if (key === "manaspec_pre_import_backup") return "object containing a full backup";
  return "array of objects";
}

function extractCssLinks(html) {
  return [...html.matchAll(/<link\s+[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)]
    .map(match => match[1])
    .filter(href => !/^https?:\/\//.test(href));
}

function expandCssImports(cssLinks) {
  const seen = new Set();
  const output = [];

  function visit(file) {
    const normalized = toPosix(toNative(file));
    if (seen.has(normalized)) return;
    seen.add(normalized);
    output.push(normalized);
    const text = readText(toNative(file));
    for (const match of text.matchAll(/@import\s+(?:url\()?["']?([^"')]+)["']?\)?/g)) {
      const imported = toPosix(path.join(path.dirname(toNative(file)), match[1]));
      visit(imported);
    }
  }

  cssLinks.forEach(visit);
  return output;
}

function extractScripts(html) {
  return [...html.matchAll(/<script\s+src="([^"]+)"><\/script>/g)].map(match => match[1]);
}

function extractVersion(html) {
  return html.match(/Version:\s*([^\n]+)/)?.[1]?.trim()
    || html.match(/ManaSpec\s*<small>v?([^<]+)<\/small>/)?.[1]?.trim()
    || "";
}

function extractHtmlIds(html) {
  return unique([...html.matchAll(/\sid="([^"]+)"/g)].map(match => `#${match[1]}`)).sort();
}

function extractCssSelectors(text) {
  return unique([...text.matchAll(/(^|})\s*([^@{}][^{]+)\s*\{/g)]
    .flatMap(match => match[2].split(",").map(selector => selector.trim()))
    .filter(selector => selector && !selector.includes("\n") && selector.length < 80))
    .sort();
}

function groupSelectors(selectors) {
  const groups = new Set();
  selectors.forEach(selector => {
    const match = selector.match(/\.([A-Za-z][\w-]*)|#([A-Za-z][\w-]*)|^([A-Za-z][\w-]*)/);
    if (match) groups.add(match[1] || match[2] || match[3]);
  });
  return [...groups].sort().slice(0, 30);
}

function extractClassesFromSelector(selector) {
  return [...selector.matchAll(/\.([A-Za-z][\w-]*)/g)].map(match => `.${match[1]}`);
}

function isLikelyClassName(value) {
  return /^\.[A-Za-z_][\w-]*$/.test(value);
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
  if (posixPath === "repo-snapshot-latest.md") return true;
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

function toNative(value) {
  return value.split("/").join(path.sep);
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function lineCount(text) {
  if (!text) return 0;
  return text.split(/\r?\n/).length;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatCappedList(values, limit) {
  const list = unique(values).filter(Boolean);
  if (!list.length) return "(none detected)";
  const rendered = list.slice(0, limit).map(value => `\`${value}\``).join(", ");
  if (list.length <= limit) return rendered;
  return `${rendered}, ... capped ${list.length - limit} more`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
