import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculatePortfolioSummary } from "../domain/portfolio.js";
import { createStorageAdapter, normalizeBackup } from "../persistence/storage.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    snapshot: () => Object.fromEntries(values),
  };
}

async function fixture(name) {
  return JSON.parse(await readFile(new URL(`../../../test-fixtures/migrations/${name}`, import.meta.url), "utf8"));
}

test("legacy version-one backup remains accepted", async () => {
  const backup = await fixture("legacy-unversioned-v1.json");
  const result = normalizeBackup(backup);
  assert.equal(result.ok, true);
  assert.equal(result.backup.dataSchemaVersion, 1);
});

test("future data schema is rejected before restore", async () => {
  const backup = await fixture("future-v2-rejected.json");
  const result = normalizeBackup(backup);
  assert.equal(result.ok, false);
  assert.match(result.message, /unsupported ManaSpec data schema version/);
});

test("adapter loads current backup records with normalized printing identity", async () => {
  const backup = await fixture("current-v1.json");
  const stored = {};
  for (const [key, value] of Object.entries(backup.data)) {
    stored[key] = key === "cash" ? value : JSON.stringify(value);
  }
  const adapter = createStorageAdapter(memoryStorage(stored));
  const state = adapter.loadState();
  assert.equal(state.specs.length, backup.data.specs.length);
  assert.equal(state.radar.length, backup.data.radar.length);
  assert.equal(state.transactions.length, backup.data.transactions.length);
  assert.ok(state.specs.every(spec => spec.trackedPrintingKey));
});

test("compatible saves preserve unknown fields and avoid derived-field pollution", () => {
  const storage = memoryStorage({
    specs: JSON.stringify([{
      id: "card-id|nonfoil",
      scryfall_id: "card-id",
      finish: "nonfoil",
      name: "Example",
      qty: 1,
      buyPrice: 2,
      currentPrice: 3,
      futureField: { keep: true },
    }]),
  });
  const adapter = createStorageAdapter(storage);
  const state = adapter.loadState();
  adapter.saveSlice("specs", [{ ...state.specs[0], qty: 2 }]);
  const saved = JSON.parse(storage.getItem("specs"))[0];
  assert.equal(saved.qty, 2);
  assert.deepEqual(saved.futureField, { keep: true });
  assert.equal(Object.hasOwn(saved, "trackedPrintingKey"), false);
});

test("portfolio summary matches the vanilla invested/value calculation", () => {
  const summary = calculatePortfolioSummary([
    { qty: 2, buyPrice: 3, currentPrice: 5 },
    { qty: 0, buyPrice: 100, currentPrice: 200 },
  ], 10);
  assert.deepEqual(summary, {
    cash: 10,
    invested: 6,
    value: 10,
    totalEquity: 20,
    profitLoss: 4,
    profitLossPercent: 66.66666666666666,
    openPositionCount: 1,
  });
});
