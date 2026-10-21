import assert from "node:assert/strict";
import test from "node:test";
import { calculatePriceHistoryMetrics, choosePriceHistoryRange, filterPriceHistoryRange, getPriceHistoryCoverage, getPriceHistoryRangeState, normalizePriceHistory } from "../domain/priceHistory.js";

const sparseHistory = [
  { date: "2026-01-01", price: 10, source: "scryfall", savedAt: "2026-01-01T12:00:00Z" },
  { date: "2026-01-15", price: 12, source: "scryfall", savedAt: "2026-01-15T12:00:00Z" },
  { date: "2026-03-20", price: 9, source: "scryfall", savedAt: "2026-03-20T12:00:00Z" },
];

test("price history keeps only valid recorded daily observations without interpolation", () => {
  const rows = normalizePriceHistory([
    ...sparseHistory,
    { date: "not-a-date", price: 15 },
    { date: "2026-02-02", price: 0 },
  ]);

  assert.deepEqual(rows.map(row => row.date), ["2026-01-01", "2026-01-15", "2026-03-20"]);
  assert.equal(rows.length, 3);
  assert.equal(getPriceHistoryCoverage(rows).days, 78);
});

test("later same-day refresh replaces the earlier recorded point", () => {
  const rows = normalizePriceHistory([
    { date: "2026-02-01", price: 10, savedAt: "2026-02-01T09:00:00Z" },
    { date: "2026-02-01", price: 11, savedAt: "2026-02-01T15:00:00Z" },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].price, 11);
});

test("ranges use the newest recorded date and never fabricate missing dates", () => {
  assert.deepEqual(filterPriceHistoryRange(sparseHistory, "1w").map(row => row.date), ["2026-03-20"]);
  assert.deepEqual(filterPriceHistoryRange(sparseHistory, "3m").map(row => row.date), ["2026-01-01", "2026-01-15", "2026-03-20"]);
  const rangeState = getPriceHistoryRangeState(sparseHistory);
  assert.equal(rangeState.find(range => range.key === "1w").enabled, false);
  assert.equal(rangeState.find(range => range.key === "3m").enabled, true);
  assert.equal(choosePriceHistoryRange(sparseHistory), "all");
});

test("metrics compare the latest point only with the prior recorded observation", () => {
  const metrics = calculatePriceHistoryMetrics(sparseHistory);

  assert.equal(metrics.latest.date, "2026-03-20");
  assert.equal(metrics.latest.price, 9);
  assert.equal(metrics.prior.date, "2026-01-15");
  assert.equal(metrics.changeAmount, -3);
  assert.equal(metrics.changePercent, -25);
  assert.equal(metrics.high, 12);
  assert.equal(metrics.low, 9);
});
