import assert from "node:assert/strict";
import test from "node:test";
import { buildPositionRow, buildSealedPositionRow, calculatePortfolioSummary, filterPositionRows, selectPositionRows } from "../domain/portfolio.js";
import { positionFixtures } from "./fixtures/positions.js";

test("canonical Position rows use only vanilla-compatible ownership fields", () => {
  const source = positionFixtures.valid;
  const row = buildPositionRow(source, { notesCount: 2, historyCount: 3 });

  assert.equal(row.quantity, source.qty);
  assert.equal(row.averageBuyPrice, source.buyPrice);
  assert.equal(row.acquiredAt, source.buyDate);
  assert.notEqual(row.acquiredAt, source.addedDate);
  assert.equal(row.notesCount, 2);
  assert.equal(row.historyCount, 3);
  assert.equal(row.sourceRecord, source);
  assert.equal(row.validation.valid, true);
  assert.equal(Object.hasOwn(source, "quantity"), false);
  assert.equal(Object.hasOwn(source, "averageBuyPrice"), false);
  assert.equal(Object.hasOwn(source, "acquiredAt"), false);
});

test("missing, zero, and invalid required Position values require reconciliation", () => {
  const cases = [
    [positionFixtures.missingQuantity, "invalid_quantity"],
    [positionFixtures.zeroQuantity, "invalid_quantity"],
    [positionFixtures.invalidQuantity, "invalid_quantity"],
    [positionFixtures.missingBuyPrice, "invalid_buy_price"],
    [positionFixtures.zeroBuyPrice, "invalid_buy_price"],
    [positionFixtures.invalidBuyPrice, "invalid_buy_price"],
    [positionFixtures.missingBuyDate, "invalid_buy_date"],
    [positionFixtures.invalidBuyDate, "invalid_buy_date"],
    [positionFixtures.invalidIdentity, "invalid_printing_identity"],
  ];

  for (const [fixture, issue] of cases) {
    const row = buildPositionRow(fixture);
    assert.equal(row.validation.valid, false, fixture.id);
    assert.equal(row.validation.calculationEligible, false, fixture.id);
    assert.ok(row.validation.requiredIssues.includes(issue), fixture.id);
  }
});

test("missing current price does not invalidate ownership but blocks marked-value calculations", () => {
  const row = buildPositionRow(positionFixtures.missingCurrentPrice);
  assert.equal(row.validation.valid, true);
  assert.equal(row.validation.calculationEligible, false);
  assert.deepEqual(row.validation.requiredIssues, []);
  assert.ok(row.validation.issues.includes("invalid_current_price"));
});

test("Position selectors attach related counts without mutating source records", () => {
  const rows = selectPositionRows([positionFixtures.valid], {
    getNotesCount: () => 4,
    getHistoryCount: () => 5,
  });
  assert.equal(rows[0].notesCount, 4);
  assert.equal(rows[0].historyCount, 5);
  assert.equal(Object.isFrozen(positionFixtures.valid), false);
  assert.equal(Object.hasOwn(positionFixtures.valid, "validation"), false);
});

test("Positions filtering preserves canonical rows and exact focus identity", () => {
  const rows = selectPositionRows([
    { ...positionFixtures.valid, name: "Alpha Position" },
    { ...positionFixtures.zeroBuyPrice, name: "Beta Position" },
    { ...positionFixtures.missingBuyDate, name: "Gamma Position" },
  ]);
  const focused = filterPositionRows(rows, { focusId: positionFixtures.zeroBuyPrice.id });
  const searched = filterPositionRows(rows, { query: "alpha position" });

  assert.equal(focused.length, 1);
  assert.strictEqual(focused[0], rows[1]);
  assert.deepEqual(focused[0].validation.requiredIssues, ["invalid_buy_price"]);
  assert.equal(searched.length, 1);
  assert.strictEqual(searched[0], rows[0]);
  assert.equal(searched[0].acquiredAt, positionFixtures.valid.buyDate);
  assert.equal(Object.hasOwn(searched[0], "qty"), false);
  assert.equal(Object.hasOwn(searched[0], "buyPrice"), false);
  assert.equal(Object.hasOwn(searched[0], "buyDate"), false);
});

test("portfolio summary excludes invalid Positions instead of converting them to zero", () => {
  const rows = [
    positionFixtures.valid,
    positionFixtures.zeroQuantity,
    positionFixtures.zeroBuyPrice,
    positionFixtures.missingBuyDate,
    positionFixtures.invalidIdentity,
  ];
  const summary = calculatePortfolioSummary(rows, 100);

  assert.equal(summary.cash, 100);
  assert.equal(summary.invested, 10);
  assert.equal(summary.pricedInvested, 10);
  assert.equal(summary.value, 16);
  assert.equal(summary.totalEquity, 116);
  assert.equal(summary.unrealizedProfitLoss, 6);
  assert.equal(summary.profitLossPercent, 60);
  assert.equal(summary.openPositionCount, 1);
  assert.equal(summary.invalidPositionCount, 4);
  assert.equal(summary.unpricedPositionCount, 0);
});

test("unpriced valid Positions retain cost basis but do not fabricate marked value", () => {
  const summary = calculatePortfolioSummary([positionFixtures.valid, positionFixtures.missingCurrentPrice], 100);
  assert.equal(summary.openPositionCount, 2);
  assert.equal(summary.invalidPositionCount, 0);
  assert.equal(summary.unpricedPositionCount, 1);
  assert.equal(summary.invested, 20);
  assert.equal(summary.value, 16);
  assert.equal(summary.profitLoss, 6);
});

test("portfolio summary separates recorded realized P/L and reports missing SELL coverage", () => {
  const summary = calculatePortfolioSummary([positionFixtures.valid], 100, {
    transactions: [
      { type: "SELL", realizedPL: 7.5 },
      { type: "SELL", realizedPL: -2 },
      { type: "SELL" },
      { type: "BUY", realizedPL: 999 },
    ],
  });

  assert.equal(summary.unrealizedProfitLoss, 6);
  assert.equal(summary.realizedProfitLoss, 5.5);
  assert.equal(summary.realizedSellCount, 2);
  assert.equal(summary.sellTransactionCount, 3);
  assert.equal(summary.missingRealizedSellCount, 1);
});

test("portfolio summary computes only complete Radar plans and exact marked concentration", () => {
  const second = {
    ...positionFixtures.valid,
    id: "second-printing|nonfoil",
    scryfall_id: "second-printing",
    trackedPrintingKey: "second-printing|nonfoil",
    name: "Second Position",
    qty: 1,
    currentPrice: 4,
  };
  const summary = calculatePortfolioSummary([positionFixtures.valid, second], 100, {
    radar: [
      { plannedQty: 3, entryTarget: 4 },
      { targetQty: 2, entryTarget: 5 },
      { plannedQty: 4, entryTarget: 0 },
    ],
  });

  assert.equal(summary.plannedRadarCapital, 22);
  assert.equal(summary.computableRadarPlanCount, 2);
  assert.equal(summary.incompleteRadarPlanCount, 1);
  assert.equal(summary.profitablePositionCount, 1);
  assert.equal(summary.losingPositionCount, 1);
  assert.equal(summary.positionConcentration[0].trackedPrintingKey, positionFixtures.valid.trackedPrintingKey);
  assert.equal(summary.positionConcentration[0].sharePercent, 80);
});

test("sealed Positions require exact asset identity and explicit current valuation", () => {
  const base = {
    id: "sealed:d575bd23-ebd6-586e-af7b-04924db4f1c3",
    assetType: "sealed",
    assetKey: "sealed:d575bd23-ebd6-586e-af7b-04924db4f1c3",
    mtgjson_uuid: "d575bd23-ebd6-586e-af7b-04924db4f1c3",
    name: "Bloomburrow Play Booster Box",
    set_code: "BLB",
    category: "booster_box",
    qty: 2,
    buyPrice: 100,
    buyDate: "2026-08-18T00:00:00.000Z",
    currentPrice: null,
  };
  const unpriced = buildSealedPositionRow(base);
  assert.equal(unpriced.validation.valid, true);
  assert.equal(unpriced.validation.calculationEligible, false);
  assert.ok(unpriced.validation.issues.includes("invalid_current_price"));

  const priced = buildSealedPositionRow({ ...base, currentPrice: 140, valuationSource: "manual", priceUpdatedAt: "2026-08-18T12:00:00.000Z" });
  assert.equal(priced.validation.calculationEligible, true);
  assert.equal(priced.assetKey, base.assetKey);

  const invalid = buildSealedPositionRow({ ...base, assetKey: null, mtgjson_uuid: null });
  assert.equal(invalid.validation.valid, false);
  assert.ok(invalid.validation.requiredIssues.includes("invalid_asset_identity"));
});

test("portfolio summary includes only honestly priced sealed value and mixed realized coverage", () => {
  const sealedBase = {
    id: "sealed:d575bd23-ebd6-586e-af7b-04924db4f1c3",
    assetType: "sealed",
    assetKey: "sealed:d575bd23-ebd6-586e-af7b-04924db4f1c3",
    mtgjson_uuid: "d575bd23-ebd6-586e-af7b-04924db4f1c3",
    name: "Bloomburrow Play Booster Box",
    set_code: "BLB",
    qty: 2,
    buyPrice: 100,
    buyDate: "2026-08-18T00:00:00.000Z",
  };
  const summary = calculatePortfolioSummary([], 500, {
    sealedSpecs: [
      { ...sealedBase, currentPrice: 140 },
      { ...sealedBase, id: "sealed:8980dc25-6a0d-5288-b960-9335972e8669", assetKey: "sealed:8980dc25-6a0d-5288-b960-9335972e8669", mtgjson_uuid: "8980dc25-6a0d-5288-b960-9335972e8669", currentPrice: null },
    ],
    sealedTransactions: [{ type: "SELL", realizedPL: 25 }],
    sealedRadar: [{ plannedQty: 2, entryTarget: 90 }],
  });
  assert.equal(summary.invested, 400);
  assert.equal(summary.value, 280);
  assert.equal(summary.totalEquity, 780);
  assert.equal(summary.unrealizedProfitLoss, 80);
  assert.equal(summary.unpricedPositionCount, 1);
  assert.equal(summary.realizedProfitLoss, 25);
  assert.equal(summary.plannedRadarCapital, 180);
  assert.equal(summary.positionConcentration[0].assetType, "sealed");
});
