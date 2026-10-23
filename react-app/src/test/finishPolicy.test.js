import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { finishPolicy as policy } from "../domain/finishPolicy.js";
import { buyFromRadar } from "../domain/trading.js";
import { toTrackedCard } from "../services/scryfall.js";
import { createStorageAdapter, normalizeBackup } from "../persistence/storage.js";
import { calculatePortfolioSummary } from "../domain/portfolio.js";
import { getRelatedRecordsForPrinting } from "../domain/relatedRecords.js";

const { cards } = JSON.parse(await readFile(new URL("../../../test-fixtures/browser/issue-20-live-unf-quotes.json", import.meta.url), "utf8"));
const clone = value => JSON.parse(JSON.stringify(value));
function fixture() {
  const specs = cards.map(card => ({ id: card.id, scryfall_id: card.id, name: card.name, set_code: "UNF", collector_number: card.collector_number, foil: false, finishes: ["foil"], qty: 2, buyPrice: 100, buyDate: "2026-07-01T12:00:00Z", currentPrice: 0, futureField: { preserve: true } }));
  return {
    specs, radar: [{ ...specs[0], qty: undefined, buyPrice: undefined, plannedQty: 3, entryTarget: 120 }], cash: 500,
    transactions: specs.map((row, index) => ({ id: `buy-${index}`, cardId: row.id, backfilledFromPositionId: row.id, foil: false, type: "BUY", quantity: 2, price: 100, fees: 2, date: row.buyDate, notes: "Keep acquisition facts", balanceAfter: 500 })),
    cardNotes: [{ id: "note-1", cardId: specs[0].id, cardKey: `${specs[0].id}|nonfoil`, finish: "nonfoil", text: "Keep thesis", createdAt: "2026-07-01" }],
    priceSnapshots: [{ cardId: specs[0].id, foil: false, date: "2026-07-01", price: 150, source: "scryfall", savedAt: "2026-07-01T12:00:00Z" }],
    marketObservations: [{ id: "market-1", scryfall_id: specs[0].id, finish: "nonfoil", marketPrice: 160, checkedAt: "2026-07-01" }],
    sealedSpecs: [{ id: "sealed:untouched", assetType: "sealed", qty: 4, buyPrice: 90 }],
  };
}
function memory(data, failKey) {
  const values = new Map(Object.entries(data).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]));
  let failed = false;
  return {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { if (key === failKey && !failed) { failed = true; throw new Error("storage failure"); } values.set(key, String(value)); },
    removeItem: key => values.delete(key), snapshot: () => Object.fromEntries(values),
  };
}

test("sole finish is locked by metadata; multi finish requires a supported explicit choice independent of prices", () => {
  for (const finish of ["nonfoil", "foil", "etched"]) {
    const card = { id: "printing", finishes: [finish], prices: {} };
    assert.equal(policy.selectFinish(card), finish);
    const tracked = toTrackedCard(card);
    assert.equal(tracked.finish, finish);
    assert.equal(tracked.currentPrice, null);
    assert.equal(tracked.trackedPrintingKey, `printing|${finish}`);
    assert.equal(tracked.foil, finish === "foil");
  }
  const multi = { id: "multi", finishes: ["nonfoil", "foil", "etched"], prices: { usd: null, usd_foil: "0.00", usd_etched: "12" } };
  assert.throws(() => toTrackedCard(multi), /Choose a supported/);
  assert.throws(() => toTrackedCard({ ...multi, finishes: ["foil"] }, { finish: "nonfoil" }), /Choose a supported/);
  assert.throws(() => toTrackedCard({ ...multi, finishes: undefined }), /unavailable/);
  assert.equal(toTrackedCard(multi, { finish: "foil" }).currentPrice, 0);
  assert.equal(toTrackedCard(multi, { finish: "etched" }).id, "multi|etched");
  assert.equal(toTrackedCard(multi, { finish: "nonfoil" }).currentPrice, null);
});

test("targeted correction preserves acquisition/history facts and exact Radar/Position/related identities", () => {
  const original = fixture();
  const before = clone(original);
  const plan = policy.planCorrection(original, cards, "2026-10-21T12:00:00Z");
  assert.deepEqual(clone(original), before);
  assert.equal(plan.corrections.length, 2);
  assert.equal(plan.data.cash, original.cash);
  assert.strictEqual(plan.data.sealedSpecs, original.sealedSpecs);
  for (let index = 0; index < 2; index += 1) {
    const row = plan.data.specs[index];
    assert.equal(row.id, `${cards[index].id}|foil`);
    assert.equal(row.currentPrice, Number(cards[index].prices.usd_foil));
    assert.equal(row.qty, 2); assert.equal(row.buyPrice, 100); assert.equal(row.buyDate, before.specs[index].buyDate);
    assert.deepEqual(row.futureField, { preserve: true });
    for (const field of ["id", "type", "quantity", "price", "fees", "date", "notes", "balanceAfter"]) assert.deepEqual(plan.data.transactions[index][field], before.transactions[index][field]);
    assert.equal(plan.data.transactions[index].cardId, row.id);
    assert.equal(plan.data.transactions[index].backfilledFromPositionId, row.id);
  }
  assert.equal(plan.data.radar[0].id, plan.data.specs[0].id);
  assert.equal(plan.data.radar[0].entryTarget, 120);
  assert.equal(plan.data.cardNotes[0].text, before.cardNotes[0].text);
  assert.equal(plan.data.cardNotes[0].id, before.cardNotes[0].id);
  assert.equal(plan.data.priceSnapshots[0].price, 150);
  assert.equal(plan.data.priceSnapshots[0].date, "2026-07-01");
  assert.equal(plan.data.marketObservations[0].marketPrice, 160);
  assert.equal(getRelatedRecordsForPrinting(plan.data.cardNotes, plan.data.specs[0], plan.data.specs).length, 1);
  assert.deepEqual(plan.data.priceSnapshots, before.priceSnapshots);
  assert.equal(getRelatedRecordsForPrinting(plan.data.priceSnapshots, plan.data.specs[0], plan.data.specs).length, 0);
  assert.equal(policy.planCorrection(plan.data, cards).corrections.length, 0);
});

test("collision, mismatched live metadata and unrelated same-name printings fail closed or remain untouched", () => {
  const data = fixture();
  data.specs.push({ ...data.specs[0], id: `${cards[0].id}|foil`, finish: "foil", foil: true });
  assert.throws(() => policy.planCorrection(data, cards), /duplicate|existing foil/);
  assert.throws(() => policy.planCorrection(fixture(), []), /could not be verified/);
  const unrelated = { ...fixture().specs[0], id: "other-printing", scryfall_id: "other-printing", set_code: "OTHER" };
  const separate = fixture(); separate.specs.push(unrelated);
  assert.strictEqual(policy.planCorrection(separate, cards).data.specs[2], unrelated);
});

test("correction persistence survives reload and backup/import; pre-correction raw state retained", () => {
  const storage = memory(fixture());
  const adapter = createStorageAdapter(storage);
  const before = storage.snapshot();
  const preview = adapter.previewFinishCorrection(cards);
  assert.deepEqual(storage.snapshot(), before);
  const corrected = adapter.applyFinishCorrection(preview);
  const reload = adapter.loadState();
  assert.deepEqual(reload.specs.map(row => row.id), cards.map(card => `${card.id}|foil`));
  assert.equal(reload.transactions.length, 2);
  const summary = calculatePortfolioSummary(reload.specs, reload.cash);
  assert.equal(summary.value, 678.04);
  assert.ok(Math.abs(summary.profitLoss - 278.04) < 1e-9);
  assert.equal(summary.invested, 400);
  const savedBackup = JSON.parse(storage.getItem(policy.BACKUP_KEY));
  assert.equal(savedBackup.rawStorage.specs, before.specs);
  assert.deepEqual(savedBackup.backup.data.transactions, fixture().transactions);
  assert.equal(normalizeBackup(adapter.createBackup(corrected)).ok, true);
  const exported = adapter.createBackup(corrected);
  const imported = createStorageAdapter(memory({})).restoreBackup(exported);
  assert.deepEqual(imported.specs.map(row => row.id), reload.specs.map(row => row.id));
  assert.equal(imported.cardNotes[0].cardKey, `${cards[0].id}|foil`);
});

test("storage failure rolls back affected keys; stale previews and backup failures never apply changes", () => {
  for (const failKey of ["transactions", policy.BACKUP_KEY]) {
    const storage = memory(fixture(), failKey);
    const adapter = createStorageAdapter(storage);
    const before = storage.snapshot();
    assert.throws(() => adapter.applyFinishCorrection(adapter.previewFinishCorrection(cards)), /storage failure/);
    for (const key of Object.keys(before)) assert.equal(storage.getItem(key), before[key]);
  }
  const storage = memory(fixture()); const adapter = createStorageAdapter(storage);
  const preview = adapter.previewFinishCorrection(cards);
  storage.setItem("cash", "501");
  assert.throws(() => adapter.applyFinishCorrection(preview), /changed since preview/);
  assert.equal(storage.getItem(policy.BACKUP_KEY), null);
  assert.equal(JSON.parse(storage.getItem("specs"))[0].foil, false);
});

 test("conflicting finish blocks all writes; unavailable foil quote corrects identity without invented value", () => {
  const data = fixture();
  data.specs[0].trackedPrintingKey = `${cards[0].id}|foil`;
  assert.throws(() => policy.planCorrection(data, cards), /conflicting finish/);
  const unavailable = cards.map(card => ({ ...card, prices: { usd: "999", usd_foil: null } }));
  const plan = policy.planCorrection(fixture(), unavailable);
  assert.equal(plan.data.specs[0].currentPrice, null);
  assert.equal(plan.data.specs[0].priceUpdatedAt, null);
  assert.equal(plan.data.specs[0].buyPrice, 100);
  assert.equal(plan.data.specs[0].finish, "foil");
});

test("unsupported legacy buy is blocked and etched trades preserve finish references", () => {
  const state = { cash: 500, specs: [], transactions: [], radar: [] };
  assert.throws(() => buyFromRadar(state, fixture().specs[0], 1, 10), /supported finish/);
  const etched = toTrackedCard({ id: "etch", finishes: ["etched"], prices: { usd_etched: "12" } });
  const bought = buyFromRadar(state, etched, 2, 10);
  assert.equal(bought.specs[0].id, "etch|etched");
  assert.equal(bought.transactions[0].finish, "etched");
  assert.equal(bought.transactions[0].trackedPrintingKey, "etch|etched");
});

test("wrong-finish historical quote labels are never promoted to verified foil history", () => {
  const data = fixture();
  data.priceSnapshots[0].price = data.specs[0].buyPrice;
  const before = clone(data.priceSnapshots);
  const plan = policy.planCorrection(data, cards, "2026-10-23T03:16:36Z");
  assert.deepEqual(plan.data.priceSnapshots, before);
  assert.equal(plan.changedKeys.includes("priceSnapshots"), false);
  assert.equal(plan.data.specs[0].currentPrice, 180.42);
  assert.equal(plan.data.specs[0].priceUpdatedAt, "2026-10-23T03:16:36Z");
});
