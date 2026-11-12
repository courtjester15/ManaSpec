import test from "node:test";
import assert from "node:assert/strict";
import { createMarketObservation, marketEvidence, observationAge, comparableJudgment, safeResearchUrl } from "../domain/marketIntelligence.js";
import { deriveSignalRows } from "../domain/signals.js";
import { createStorageAdapter } from "../persistence/storage.js";

const item = { id: "exact|foil", scryfall_id: "exact", finish: "foil", foil: true, oracle_id: "same", name: "Synthetic premium", qty: 2, buyPrice: 500 };
const now = "2026-11-11T18:00:00Z";
const fields = { marketPrice: "500", nmLow: "600", checkedAt: "2026-11-10T12:00:00Z", source: "tcgplayer-manual", url: "https://example.com/quote", confidence: "low" };

test("manual evidence keeps exact finish and unknown listing distinct from zero", () => {
  const record = createMarketObservation(item, { ...fields, nmLow: "" }, now);
  assert.equal(record.nmLow, null);
  assert.equal(record.marketPrice, 500);
  assert.equal(marketEvidence([record], { ...item, finish: "etched", id: "exact|etched" }).latest, undefined);
  assert.equal(marketEvidence([record], item, Date.parse(now)).spread, null);
  assert.throws(() => createMarketObservation(item, { ...fields, checkedAt: "2027-01-01" }, now), /observation time/);
  assert.equal(safeResearchUrl("javascript:alert(1)"), null);
  assert.equal(observationAge("bad").stale, true);
});

test("stale manual, exit research and sparse history never manufacture price changes", () => {
  const record = createMarketObservation(item, { ...fields, checkedAt: "2025-01-01" }, now);
  const exit = { ...record, checkedAt: now, researchType: "exit", marketPrice: 999 };
  const evidence = marketEvidence([exit, record], item, Date.parse(now));
  assert.equal(evidence.market, 500);
  assert.equal(evidence.age.stale, true);
  assert.equal(evidence.change, null);
  assert.equal(comparableJudgment(item, { oracle_id: "other" }).startsWith("Weak"), true);
});

test("release and supported change signals link to exact underlying plan", () => {
  const old = createMarketObservation(item, { ...fields, marketPrice: "400", checkedAt: "2026-11-09" }, now);
  const recent = createMarketObservation(item, { ...fields, releaseReviewAt: "2026-11-11" }, now);
  const rows = deriveSignalRows({ specs: [item], radar: [], marketObservations: [old, recent] }, { now });
  assert.ok(rows[0].buckets.includes("evidenceReview"));
  assert.match(rows[0].reasonLabel, /25.0%/);
});

test("market evidence round trips through existing backup and reload without schema change", () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const adapter = createStorageAdapter(storage);
  const state = adapter.loadState();
  const record = createMarketObservation(item, fields, now);
  adapter.saveSlices({ marketObservations: [record] });
  assert.deepEqual(adapter.loadState().marketObservations, JSON.parse(JSON.stringify([record])));
  const backup = adapter.createBackup({ ...state, marketObservations: [record] });
  const parsed = adapter.parseBackupText(JSON.stringify(backup));
  assert.equal(parsed.ok, true);
  adapter.restoreBackup(parsed.backup);
  assert.deepEqual(adapter.loadState().marketObservations, JSON.parse(JSON.stringify([record])));
});
