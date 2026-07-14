const assert = require("node:assert/strict");
const memoryStorage = new Map();
global.localStorage = {
  getItem: key => memoryStorage.has(key) ? memoryStorage.get(key) : null,
  setItem: (key, value) => memoryStorage.set(key, String(value)),
};
const history = require("../js/modules/portfolio/snapshots.js");

function snapshot(overrides = {}) {
  return {
    date: "2026-07-13",
    printingKey: "card-a|nonfoil",
    scryfallId: "card-a",
    finish: "nonfoil",
    name: "Test Card",
    setCode: "TST",
    collectorNumber: "1",
    price: 10,
    source: "scryfall",
    savedAt: "2026-07-13T12:00:00.000Z",
    ...overrides,
  };
}

assert.equal(history.getSnapshotDate(new Date(2026, 6, 13, 22, 0)), "2026-07-13");

const legacy = history.normalizePriceSnapshot({
  date: "2026-07-12",
  cardId: "card-a|foil",
  name: "Legacy Card",
  set_code: "tst",
  set_name: "Test",
  collector_number: "7",
  foil: true,
  price: "12.50",
  source: "scryfall",
  savedAt: "2026-07-12T14:00:00Z",
});
assert.equal(legacy.printingKey, "card-a|foil");
assert.equal(legacy.price, 12.5);
assert.equal(legacy.setCode, "TST");

assert.equal(history.normalizePriceSnapshot(snapshot({ price: 0 })), null);
assert.equal(history.normalizePriceSnapshot(snapshot({ price: "nope" })), null);
assert.equal(history.normalizePriceSnapshot(snapshot({ date: "2026-02-31" })), null);
assert.equal(history.normalizePriceSnapshot(snapshot({ finish: "etched", printingKey: "card-a|etched" })), null);

const first = history.upsertDailyPriceSnapshot([], snapshot());
assert.equal(first.saved, 1);
assert.equal(first.snapshots.length, 1);

const later = history.upsertDailyPriceSnapshot(first.snapshots, snapshot({ price: 13, savedAt: "2026-07-13T23:00:00Z" }));
assert.equal(later.updated, 1);
assert.equal(later.snapshots.length, 1);
assert.equal(later.snapshots[0].price, 13);

const invalidLater = history.upsertDailyPriceSnapshot(later.snapshots, snapshot({ price: 0 }));
assert.equal(invalidLater.updated, 0);
assert.equal(invalidLater.snapshots[0].price, 13);

const anotherDay = history.upsertDailyPriceSnapshot(later.snapshots, snapshot({ date: "2026-07-14", price: 14 }));
assert.equal(anotherDay.snapshots.length, 2);

const foil = history.upsertDailyPriceSnapshot(anotherDay.snapshots, snapshot({ printingKey: "card-a|foil", finish: "foil", price: 20 }));
assert.equal(foil.snapshots.length, 3);
assert.equal(history.getPriceHistoryForPrinting("card-a|nonfoil", foil.snapshots).length, 2);
assert.equal(history.getPriceHistoryForPrinting("card-a|foil", foil.snapshots).length, 1);

const duplicateDay = history.normalizePriceSnapshots([
  snapshot({ price: 10, savedAt: "2026-07-13T10:00:00Z" }),
  snapshot({ price: 12, savedAt: "2026-07-13T20:00:00Z" }),
], { warn: false }).valid;
assert.equal(duplicateDay.length, 1);
assert.equal(duplicateDay[0].price, 12);

assert.equal(history.formatHistoryCoverageBadge([]), "0");
assert.equal(history.formatHistoryCoverageBadge([snapshot()]), "1d");
assert.equal(history.formatHistoryCoverageBadge([snapshot({ date: "2026-07-01" }), snapshot({ date: "2026-07-08" })]), "7d");
assert.equal(history.formatHistoryCoverageBadge([snapshot({ date: "2026-01-01" }), snapshot({ date: "2026-04-01" })]), "3m");
assert.equal(history.formatHistoryCoverageBadge([snapshot({ date: "2025-01-01" }), snapshot({ date: "2026-01-01" })]), "1y");
assert.equal(history.calculateHistoryMetrics([snapshot()]).change, null);

const ranged = [
  snapshot({ date: "2026-07-01", price: 8 }),
  snapshot({ date: "2026-07-08", price: 10 }),
  snapshot({ date: "2026-07-14", price: 15 }),
];
assert.deepEqual(history.filterHistoryByRange(ranged, "7d").map(item => item.date), ["2026-07-08", "2026-07-14"]);
assert.deepEqual(history.calculateHistoryMetrics(ranged), { current: 15, change: 87.5, high: 15, low: 8 });

const unionResult = history.saveDailyPriceSnapshots([
  { item: { id: "shared|nonfoil", name: "Shared", foil: false }, price: 11, savedAt: "2026-07-13T10:00:00Z" },
  { item: { id: "shared|nonfoil", name: "Shared", foil: false }, price: 12, savedAt: "2026-07-13T20:00:00Z" },
  { item: { id: "shared|foil", name: "Shared", foil: true }, price: 18, savedAt: "2026-07-13T20:00:00Z" },
  { item: { id: "failed|nonfoil", name: "Failed", foil: false }, price: 0, savedAt: "2026-07-13T20:00:00Z" },
]);
assert.equal(unionResult.saved, 2);
assert.equal(history.loadPriceSnapshots().length, 2);
assert.equal(history.getPriceHistoryForPrinting("shared|nonfoil")[0].price, 12);
assert.equal(history.getPriceHistoryForPrinting("shared|foil")[0].price, 18);

console.log("Price history foundation tests passed.");
