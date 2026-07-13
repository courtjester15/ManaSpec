const fs = require("node:fs");
const path = require("node:path");
const foundation = require("../js/core/data-foundation.js");

function newestFixture() {
  const directory = path.resolve(__dirname, "..", "test-fixtures");
  return fs.readdirSync(directory)
    .filter(name => name.endsWith(".json"))
    .map(name => ({ path: path.join(directory, name), modified: fs.statSync(path.join(directory, name)).mtimeMs }))
    .sort((left, right) => right.modified - left.modified)[0]?.path || null;
}

const requested = process.argv[2] ? path.resolve(process.argv[2]) : newestFixture();
if (!requested || !fs.existsSync(requested)) {
  process.stderr.write("Usage: node tools/report-data-reconciliation.js [backup.json]\n");
  process.exitCode = 1;
} else {
  const backup = JSON.parse(fs.readFileSync(requested, "utf8"));
  const report = foundation.buildReconciliationReport(backup);
  process.stdout.write(`${JSON.stringify({ fixture: path.basename(requested), ...report }, null, 2)}\n`);
}
