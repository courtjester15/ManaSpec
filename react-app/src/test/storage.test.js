import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildPositionRow, calculatePortfolioSummary } from "../domain/portfolio.js";
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
  assert.equal(result.backup.dataSchemaVersion, 2);
  assert.deepEqual(result.backup.data.sealedSpecs, []);
  assert.deepEqual(result.backup.data.sealedRadar, []);
  assert.deepEqual(result.backup.data.sealedTransactions, []);
});

test("future data schema is rejected before restore", async () => {
  const backup = await fixture("future-v3-rejected.json");
  const result = normalizeBackup(backup);
  assert.equal(result.ok, false);
  assert.match(result.message, /unsupported ManaSpec data schema version/);
});

test("sealed state loads, saves, and round-trips through schema version two backups", () => {
  const sealed = {
    id: "sealed:d575bd23-ebd6-586e-af7b-04924db4f1c3",
    assetType: "sealed",
    assetKey: "sealed:d575bd23-ebd6-586e-af7b-04924db4f1c3",
    mtgjson_uuid: "d575bd23-ebd6-586e-af7b-04924db4f1c3",
    name: "Bloomburrow Play Booster Box",
    set_code: "BLB",
    qty: 1,
    buyPrice: 120,
    currentPrice: 135,
  };
  const sealedTransaction = { ...sealed, id: "sealed-buy-1", type: "BUY", quantity: 1, price: 120, date: "2026-08-18T00:00:00.000Z" };
  const storage = memoryStorage({ sealedSpecs: JSON.stringify([sealed]), sealedTransactions: JSON.stringify([sealedTransaction]) });
  const adapter = createStorageAdapter(storage);
  const state = adapter.loadState();
  assert.equal(state.sealedSpecs[0].assetKey, sealed.assetKey);
  assert.equal(state.sealedSpecs[0].scryfall_id, undefined);
  assert.equal(state.sealedTransactions[0].id, "sealed-buy-1");

  const backup = adapter.createBackup(state);
  assert.equal(backup.dataSchemaVersion, 2);
  assert.equal(backup.counts.sealedPositions, 1);
  assert.deepEqual(backup.data.sealedSpecs[0], state.sealedSpecs[0]);

  const restoredStorage = memoryStorage();
  const restoredAdapter = createStorageAdapter(restoredStorage);
  const restored = restoredAdapter.restoreBackup(backup);
  assert.equal(restored.sealedSpecs[0].assetKey, sealed.assetKey);
  assert.equal(restored.sealedTransactions[0].id, "sealed-buy-1");
  assert.equal(JSON.parse(restoredStorage.getItem("sealedSpecs"))[0].name, sealed.name);
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

test("canonical Position rows do not pollute compatible storage or backups", () => {
  const storage = memoryStorage({
    specs: JSON.stringify([{
      id: "card-id|nonfoil",
      scryfall_id: "card-id",
      finish: "nonfoil",
      name: "Example",
      qty: 1,
      buyPrice: 2,
      buyDate: "2026-01-15T12:00:00.000Z",
      currentPrice: 3,
      futureField: { keep: true },
    }]),
  });
  const adapter = createStorageAdapter(storage);
  const state = adapter.loadState();
  const row = buildPositionRow(state.specs[0]);

  adapter.saveSlice("specs", [{ ...row.sourceRecord, exitTarget: 8 }]);
  const saved = JSON.parse(storage.getItem("specs"))[0];
  assert.equal(saved.qty, 1);
  assert.equal(saved.buyPrice, 2);
  assert.equal(saved.buyDate, "2026-01-15T12:00:00.000Z");
  assert.deepEqual(saved.futureField, { keep: true });
  assert.equal(Object.hasOwn(saved, "quantity"), false);
  assert.equal(Object.hasOwn(saved, "averageBuyPrice"), false);
  assert.equal(Object.hasOwn(saved, "acquiredAt"), false);

  const backupSpec = adapter.createBackup(adapter.loadState()).data.specs[0];
  assert.equal(backupSpec.qty, 1);
  assert.equal(backupSpec.buyPrice, 2);
  assert.equal(backupSpec.buyDate, "2026-01-15T12:00:00.000Z");
  assert.deepEqual(backupSpec.futureField, { keep: true });
});

test("portfolio summary matches the vanilla calculation for trusted Positions", () => {
  const summary = calculatePortfolioSummary([
    { id: "one|nonfoil", scryfall_id: "one", trackedPrintingKey: "one|nonfoil", finish: "nonfoil", qty: 2, buyPrice: 3, buyDate: "2026-01-01", currentPrice: 5 },
    { id: "two|nonfoil", scryfall_id: "two", trackedPrintingKey: "two|nonfoil", finish: "nonfoil", qty: 0, buyPrice: 100, buyDate: "2026-01-01", currentPrice: 200 },
  ], 10);
  assert.equal(summary.cash, 10);
  assert.equal(summary.invested, 6);
  assert.equal(summary.pricedInvested, 6);
  assert.equal(summary.value, 10);
  assert.equal(summary.totalEquity, 20);
  assert.equal(summary.unrealizedProfitLoss, 4);
  assert.equal(summary.profitLossPercent, 66.66666666666666);
  assert.equal(summary.openPositionCount, 1);
  assert.equal(summary.invalidPositionCount, 1);
  assert.equal(summary.unpricedPositionCount, 0);
});
