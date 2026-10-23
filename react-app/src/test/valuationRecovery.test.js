import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { calculatePortfolioSummary, getZeroValuationWarning } from "../domain/portfolio.js";
import { refreshTrackedPrices, applyPriceObservations } from "../services/scryfall.js";
import { dataFoundation } from "../domain/dataFoundation.js";

const evidence = JSON.parse(await readFile(new URL("../../../test-fixtures/browser/issue-20-live-unf-quotes.json", import.meta.url), "utf8"));
const position = (card, finish) => ({
  id: finish === "foil" ? `${card.id}|foil` : card.id, scryfall_id: card.id,
  trackedPrintingKey: `${card.id}|${finish}`, finish, foil: finish === "foil",
  name: card.name, set_code: "UNF", collector_number: card.collector_number,
  finishes: card.finishes, currentPrice: 0, qty: 1, buyPrice: 100,
  buyDate: "2026-07-01T12:00:00Z", priceUpdatedAt: "2020-01-01T00:00:00Z",
  futureField: { preserve: true },
});

test("recorded live UNF evidence has exact identity, foil-only support, and unavailable nonfoil", () => {
  assert.deepEqual(evidence.cards.map(card => [card.name, card.collector_number, card.id]), [
    ["Steam Vents", "534", "be874189-b715-4e7c-85d7-e887328b9d3f"],
    ["Godless Shrine", "533", "0f1296cc-59aa-412d-9115-99fdc9ada754"],
  ]);
  for (const card of evidence.cards) {
    assert.deepEqual(card.finishes, ["foil"]);
    assert.equal(card.prices.usd, null);
    assert.ok(Number(card.prices.usd_foil) > 0);
  }
});

test("nonfoil zeros cannot recover from foil quotes; correctly identified foil zeros recover marked P/L", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: evidence.cards }) });
  try {
    for (const finish of ["nonfoil", "foil"]) {
      const rows = evidence.cards.map(card => position(card, finish));
      const before = JSON.stringify(rows);
      const result = await refreshTrackedPrices(rows);
      const updated = applyPriceObservations(rows, result.observations);
      const summary = calculatePortfolioSummary(updated, 100);
      assert.equal(summary.invested, 200);
      assert.equal(JSON.stringify(rows), before);
      if (finish === "nonfoil") {
        assert.equal(result.updated, 0);
        assert.equal(JSON.stringify(updated), before);
        assert.equal(summary.value, 0);
        assert.equal(summary.profitLoss, -200);
        assert.ok(updated.every(row => getZeroValuationWarning(row).includes("not offered")));
      } else {
        const value = evidence.cards.reduce((total, card) => total + Number(card.prices.usd_foil), 0);
        assert.equal(result.updated, 2);
        assert.equal(summary.value, value);
        assert.equal(summary.profitLoss, value - 200);
        assert.equal(summary.totalEquity, 100 + value);
        assert.ok(updated.every(row => getZeroValuationWarning(row) === ""));
        assert.deepEqual(updated.map(row => [row.id, row.qty, row.buyPrice, row.buyDate, row.futureField]), rows.map(row => [row.id, row.qty, row.buyPrice, row.buyDate, row.futureField]));
      }
    }
  } finally { globalThis.fetch = originalFetch; }
});

test("warnings are read-only and genuine cached zero, sealed, closed, and nonzero holdings remain unaffected", () => {
  const base = position(evidence.cards[0], "foil");
  const cases = [
    [base, true],
    [{ ...base, prices: { usd_foil: "0.00" } }, false],
    [{ ...base, prices: { usd_foil: "180.42" } }, true],
    [{ ...base, prices: { usd: "0.00", usd_foil: null } }, true],
    [{ ...base, currentPrice: null }, false],
    [{ ...base, currentPrice: 1 }, false],
    [{ ...base, qty: 0 }, false],
    [{ ...base, assetType: "sealed" }, false],
  ];
  for (const [raw, expected] of cases) {
    const before = JSON.stringify(raw);
    const normalized = dataFoundation.normalizeSpec(raw);
    assert.equal(Boolean(getZeroValuationWarning(normalized)), expected);
    assert.equal(JSON.stringify(dataFoundation.serializeCompatibleRecord(normalized)), before);
  }
});
