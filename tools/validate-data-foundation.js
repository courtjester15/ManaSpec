const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const foundation = require("../js/core/data-foundation.js");

function tx(id, cardId, type, quantity, price, date, extra = {}) {
  return { id, cardId, type, quantity, price, date, foil: cardId.endsWith("|foil"), ...extra };
}

function runFocusedCases() {
  const unknown = foundation.normalizeSpec({
    id: "printing-a", scryfall_id: "printing-a", foil: false, qty: "2", buyPrice: "4.50", customFutureField: "preserved",
  });
  assert.equal(unknown.lang, null);
  assert.equal(unknown.customFutureField, "preserved");
  assert.equal(unknown.trackedPrintingKey, "printing-a|nonfoil");

  const multipleBuys = foundation.projectPositionsFromTransactions([
    tx("b1", "printing-a", "BUY", 4, 5, "2026-01-01"),
    tx("b2", "printing-a", "BUY", 6, 7, "2026-01-02", { fees: 2 }),
    tx("s1", "printing-a", "SELL", 3, 10, "2026-01-03", { fees: 1 }),
  ]).positions[0];
  assert.equal(multipleBuys.quantity, 7);
  assert.equal(Number(multipleBuys.averageCost.toFixed(4)), 6.4);
  assert.equal(Number(multipleBuys.realizedPL.toFixed(2)), 9.8);

  const repurchase = foundation.projectPositionsFromTransactions([
    tx("b1", "printing-b|foil", "BUY", 2, 5, "2026-01-01"),
    tx("s1", "printing-b|foil", "SELL", 2, 8, "2026-01-02"),
    tx("b2", "printing-b|foil", "BUY", 3, 4, "2026-01-03"),
  ]).positions[0];
  assert.equal(repurchase.quantity, 3);
  assert.equal(repurchase.averageCost, 4);
  assert.equal(repurchase.realizedPL, 6);

  const oversell = foundation.projectPositionsFromTransactions([
    tx("b1", "printing-c", "BUY", 1, 5, "2026-01-01"),
    tx("s1", "printing-c", "SELL", 2, 8, "2026-01-02"),
    tx("b2", "printing-c", "BUY", 1, 4, "2026-01-03"),
  ]).positions[0];
  assert.equal(oversell.projectionSafe, false);
  assert.equal(oversell.quantity, 1);
  assert(oversell.issues.some(issue => issue.type === "oversell"));

  const legacyBackfill = foundation.projectPositionsFromTransactions([
    tx("backfill", "printing-e", "BUY", 2, 3, "2026-01-01", { backfilledFromPositionId: "printing-e" }),
  ]).positions[0];
  assert(legacyBackfill.issues.some(issue => issue.type === "backfill_provenance_unmarked"));

  const malformed = foundation.normalizeTransaction({
    id: "bad", cardId: "printing-d", foil: false, type: "BUY", quantity: "bad", price: "?", date: "bad",
  });
  assert.deepEqual(foundation.validateTransaction(malformed).sort(), ["invalid_date", "invalid_price", "invalid_quantity"].sort());
  return { status: "passed", caseCount: 8 };
}

function newestFixture() {
  const directory = path.resolve(__dirname, "..", "test-fixtures");
  if (!fs.existsSync(directory)) return null;
  return fs.readdirSync(directory).filter(name => name.endsWith(".json"))
    .map(name => ({ name, path: path.join(directory, name), modified: fs.statSync(path.join(directory, name)).mtimeMs }))
    .sort((left, right) => right.modified - left.modified)[0] || null;
}

function auditFixture() {
  const fixture = newestFixture();
  if (!fixture) return { status: "skipped", reason: "No local JSON backup fixture found." };
  const backup = JSON.parse(fs.readFileSync(fixture.path, "utf8"));
  const comparison = foundation.compareProjectedPositions(backup?.data?.specs || [], backup?.data?.transactions || []);
  const discrepancyTypes = comparison.results.reduce((counts, result) => {
    counts[result.status] = (counts[result.status] || 0) + 1;
    return counts;
  }, {});
  const projectionIssueTypes = comparison.projection.positions.flatMap(position => position.issues).reduce((counts, issue) => {
    counts[issue.type] = (counts[issue.type] || 0) + 1;
    return counts;
  }, {});
  return {
    status: "completed",
    fixture: fixture.name,
    summary: comparison.summary,
    discrepancyTypes,
    projectionSummary: comparison.projection.summary,
    projectionIssueTypes,
    unsafeRecords: comparison.results.filter(result => !["matched", "closed_history_only"].includes(result.status)).slice(0, 25),
  };
}

process.stdout.write(`${JSON.stringify({ focusedCases: runFocusedCases(), realFixture: auditFixture() }, null, 2)}\n`);
