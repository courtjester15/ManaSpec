import assert from "node:assert/strict";
import test from "node:test";
import { applyPriceObservations, getCardPrice, refreshTrackedPrices, toTrackedCard } from "../services/scryfall.js";

test("exact quotes distinguish unknown, invalid and genuine zero", () => {
  for (const value of [null, undefined, "", " ", false, "invalid", "12oops", -1, Infinity]) {
    assert.equal(getCardPrice({ prices: { usd: value, usd_foil: "99" } }), null, String(value));
  }
  assert.equal(getCardPrice({ prices: { usd: "0.00" } }), 0);
  assert.equal(getCardPrice({ prices: { usd: "5", usd_etched: "7" } }, "etched"), 7);
  assert.equal(getCardPrice({ prices: { usd: "5" } }, true), null);
  assert.equal(getCardPrice({ prices: { usd: "5" } }, null), null);
  assert.equal(toTrackedCard({ id: "a", finishes: ["nonfoil"], prices: { usd: null } }).currentPrice, null);
  assert.equal(toTrackedCard({ id: "a", finishes: ["nonfoil"], prices: { usd: null } }).priceUpdatedAt, null);
});

test("audit applies only quotes across shared Radar/Position identity", () => {
  const position = { id: "a", qty: 4, buyPrice: 7, exitTarget: 20, custom: "keep" };
  const radar = { id: "a", plannedQty: 100, entryTarget: 3, currentPrice: 10, priceUpdatedAt: "today" };
  assert.deepEqual(applyPriceObservations([position], [radar])[0], {
    ...position, currentPrice: 10, priceUpdatedAt: "today", prices: undefined,
  });
  assert.strictEqual(applyPriceObservations([position], [])[0], position);
});

test("refresh retains stale exact quotes and timestamps; counts only successful observations", async () => {
  const originalFetch = globalThis.fetch;
  const items = [
    { id: "a", scryfall_id: "a", foil: false, currentPrice: 12, priceUpdatedAt: "2020-01-01" },
    { id: "a|foil", scryfall_id: "a", finish: "foil", foil: true, currentPrice: 20, priceUpdatedAt: "2020-01-01" },
    { id: "b|etched", finish: "etched", currentPrice: null },
  ];
  const before = JSON.stringify(items);
  globalThis.fetch = async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body).identifiers.map(row => row.id), ["a", "a", "b"]);
    return { ok: true, json: async () => ({ data: [
      { id: "a", prices: { usd: null, usd_foil: "0.00" } },
      { id: "b", prices: { usd: "100", usd_etched: null } },
    ] }) };
  };
  try {
    const result = await refreshTrackedPrices(items);
    assert.equal(result.updated, 1);
    assert.strictEqual(result.items[0], items[0]);
    assert.equal(result.items[1].currentPrice, 0);
    assert.strictEqual(result.items[2], items[2]);
    assert.equal(result.observations.length, 1);
    assert.equal(JSON.stringify(items), before);
    globalThis.fetch = async () => { throw new Error("offline"); };
    await assert.rejects(refreshTrackedPrices(items), /offline/);
    assert.equal(JSON.stringify(items), before);
  } finally { globalThis.fetch = originalFetch; }
});
