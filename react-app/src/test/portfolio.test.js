import assert from "node:assert/strict";
import test from "node:test";
import { buildPositionRow, calculatePortfolioSummary, selectPositionRows } from "../domain/portfolio.js";
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

test("portfolio summary excludes invalid Positions instead of converting them to zero", () => {
  const rows = [
    positionFixtures.valid,
    positionFixtures.zeroQuantity,
    positionFixtures.zeroBuyPrice,
    positionFixtures.missingBuyDate,
    positionFixtures.invalidIdentity,
  ];
  const summary = calculatePortfolioSummary(rows, 100);

  assert.deepEqual(summary, {
    cash: 100,
    invested: 10,
    value: 16,
    totalEquity: 116,
    profitLoss: 6,
    profitLossPercent: 60,
    openPositionCount: 1,
    invalidPositionCount: 4,
    unpricedPositionCount: 0,
  });
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
