import test from "node:test";
import assert from "node:assert/strict";
import { actualSaleDraft, compareExit, createExitResearch, emptyExitRoute } from "../domain/exitComparison.js";
import { tradeEconomics } from "../domain/tradeEconomics.js";
import { sellPosition } from "../domain/trading.js";
import { marketEvidence } from "../domain/marketIntelligence.js";

const position = { id: "test|nonfoil", scryfall_id: "test", finish: "nonfoil", foil: false, name: "Synthetic $10 card", qty: 3, buyPrice: 10, openBasisCents: 3000, buyDate: "2026-11-01", currentPrice: 10 };
const route = overrides => ({ ...emptyExitRoute(), price: "10", shippingPaid: "2", feePercent: "15", ...overrides });

test("$10 marketplace exit loses money after postage and fees; break-even uses receipt rounding", () => {
  const result = compareExit(position, 1, route());
  assert.equal(result.cashCents, 650);
  assert.equal(result.realizedCents, -350);
  assert.equal(result.breakEvenCents, 1412);
  const boundary = compareExit(position, 1, route({ price: (result.breakEvenCents / 100).toFixed(2) }));
  const below = compareExit(position, 1, route({ price: ((result.breakEvenCents - 1) / 100).toFixed(2) }));
  assert.ok(boundary.realizedCents >= 0);
  assert.ok(below.realizedCents < 0);
});

test("$500 premium partial exit matches actual #28 receipt and residual basis", () => {
  const premium = { ...position, id: "premium|foil", scryfall_id: "premium", finish: "foil", foil: true, buyPrice: 500, openBasisCents: 150001 };
  for (const offer of [route({ price: "620", shippingPaid: "12", feePercent: "12.5", commission: "3", otherCosts: "1.50" }), route({ name: "Private", price: "550", feePercent: "0", shippingPaid: "0" })]) {
    const result = compareExit(premium, 1, offer);
    const draft = actualSaleDraft(premium, 1, offer);
    const sold = sellPosition({ specs: [premium], sealedSpecs: [], radar: [], transactions: [], sealedTransactions: [], cash: 10000 }, premium, draft.defaultQuantity, draft.initialFields.price, draft.initialFields);
    assert.equal(sold.transactions[0].trade.cashCents, result.cashCents);
    assert.equal(sold.transactions[0].trade.basisCents, result.basisCents);
    assert.equal(sold.specs[0].openBasisCents, premium.openBasisCents - result.basisCents);
    assert.equal(sold.specs[0].qty, 2);
  }
});

test("24-copy buylist batch retains condition, allocates costs once and enforces valid quantity", () => {
  const batch = { ...position, qty: 24, openBasisCents: 24000 };
  const offer = route({ price: "11", quoteType: "offer", availableQty: "24", feePercent: "0", shippingPaid: "6", condition: "NM only" });
  const result = compareExit(batch, 24, offer);
  assert.equal(result.grossCents, 26400);
  assert.equal(result.cashCents, 25800);
  assert.equal(result.basisCents, 24000);
  assert.equal(compareExit(batch, 24, { ...offer, condition: "LP only", price: "9" }).cashCents, 21000);
  assert.throws(() => compareExit(batch, 24, { ...offer, availableQty: "12" }), /valid quantity/);
  assert.equal(createExitResearch(batch, 24, [offer]).routes[0].condition, "NM only");
});

test("unknown sealed quotes, store credit, stale and expired offers stay explicit", () => {
  const sealed = { assetType: "sealed", id: "sealed:d575bd23-ebd6-586e-af7b-04924db4f1c3", mtgjson_uuid: "d575bd23-ebd6-586e-af7b-04924db4f1c3", name: "Synthetic box", qty: 1, buyPrice: 120, currentPrice: null };
  assert.equal(compareExit(sealed, 1, emptyExitRoute()).unknown, true);
  const credit = route({ payout: "credit", checkedAt: "2020-01-01", expiresAt: "2020-02-01" });
  const result = compareExit(position, 1, credit);
  assert.equal(result.cash, false);
  assert.equal(result.age.stale, true);
  assert.equal(result.expired, true);
  assert.throws(() => actualSaleDraft(position, 1, credit), /cash quote/);
  const saved = createExitResearch(sealed, 1, [emptyExitRoute()]);
  assert.equal(marketEvidence([saved], sealed).market, null);
  assert.equal(saved.researchType, "exit");
});

test("cent rounding and unknown basis agree with shared calculator", () => {
  const odd = { ...position, qty: 3, openBasisCents: 298 };
  const offer = route({ price: "1.13", feePercent: "12.9", marketplaceFee: "0.30", shippingPaid: "0.01" });
  const result = compareExit(odd, 1, offer);
  assert.deepEqual(tradeEconomics("SELL", 1, offer.price, result.terms, odd).cashCents, result.cashCents);
  assert.equal(result.basisCents, 99);
  assert.equal(compareExit({ ...position, buyPrice: null, openBasisCents: null }, 1, offer).breakEvenCents, null);
  assert.throws(() => compareExit(position, 1, route({ feePercent: 100 })), /less than 100/);
  assert.throws(() => compareExit(position, 1, route({ shippingPaid: "0.001" })), /dollars and cents/);
});
