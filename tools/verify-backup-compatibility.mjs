// Read-only audit of a supplied copy. Never contacts a browser or writes data.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { ARRAY_KEYS, createStorageAdapter, normalizeBackup } from "../react-app/src/persistence/storage.js";
import { calculatePortfolioSummary } from "../react-app/src/domain/portfolio.js";

if (!process.argv[2]) throw new Error("Pass the path to a backup copy. The original is never modified.");
const bytes = readFileSync(process.argv[2]);
const input = JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));
const validation = normalizeBackup(input);
if (!validation.ok) throw new Error(validation.message);
const raw = new Map(Object.entries(validation.backup.data).map(([key, value]) => [key, key === "cash" ? String(value) : JSON.stringify(value)]));
const before = [...raw];
const adapter = createStorageAdapter({
  getItem: key => raw.get(key) ?? null,
  setItem() { throw new Error("Load-only compatibility audit attempted a write"); },
  removeItem() { throw new Error("Load-only compatibility audit attempted a removal"); },
});
const state = adapter.loadState();
const exported = JSON.parse(JSON.stringify(adapter.createBackup(state)));
for (const key of ARRAY_KEYS) assert.deepEqual(exported.data[key], validation.backup.data[key], `Record content changed: ${key}`);
assert.equal(exported.data.cash, validation.backup.data.cash);
assert.deepEqual(exported.data.priceRefreshStatus, validation.backup.data.priceRefreshStatus);
assert.deepEqual([...raw], before);
const summary = calculatePortfolioSummary(state.specs, state.cash, { sealedSpecs: state.sealedSpecs, transactions: state.transactions, sealedTransactions: state.sealedTransactions, radar: state.radar, sealedRadar: state.sealedRadar });
const restoredRaw = new Map();
const restored = createStorageAdapter({ getItem: key => restoredRaw.get(key) ?? null, setItem: (key, value) => restoredRaw.set(key, String(value)), removeItem: key => restoredRaw.delete(key) });
const roundTrip = restored.restoreBackup(exported);
assert.deepEqual(restored.createBackup(roundTrip).data, exported.data);
assert.deepEqual(calculatePortfolioSummary(roundTrip.specs, roundTrip.cash, { sealedSpecs: roundTrip.sealedSpecs, transactions: roundTrip.transactions, sealedTransactions: roundTrip.sealedTransactions, radar: roundTrip.radar, sealedRadar: roundTrip.sealedRadar }), summary);
console.log(JSON.stringify({ status: "passed", sha256: createHash("sha256").update(bytes).digest("hex"), loadOnlyWrites: 0, exactRecordsAndUnknownFieldsPreserved: true, backupRoundTrip: true, portfolioSummaryUnchanged: true }));
