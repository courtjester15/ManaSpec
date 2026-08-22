import test from "node:test";
import assert from "node:assert/strict";
import { buyFromRadar, deletePosition, sellPosition } from "../domain/trading.js";
import { parseSetNumberQuery, toTrackedCard } from "../services/scryfall.js";

const watched = {
  id: "printing-1", scryfall_id: "printing-1", name: "Test Card", set_code: "TST",
  set_name: "Test Set", collector_number: "7", currentPrice: 12, plannedQty: 2,
};

function state(overrides = {}) {
  return { specs: [], radar: [watched], transactions: [], sealedSpecs: [], sealedRadar: [], sealedTransactions: [], cardNotes: [], cash: 100, ...overrides };
}

const sealed = {
  id: "sealed:d575bd23-ebd6-586e-af7b-04924db4f1c3",
  assetType: "sealed",
  assetKey: "sealed:d575bd23-ebd6-586e-af7b-04924db4f1c3",
  mtgjson_uuid: "d575bd23-ebd6-586e-af7b-04924db4f1c3",
  name: "Bloomburrow Play Booster Box",
  set_code: "BLB",
  set_name: "Bloomburrow",
  category: "booster_box",
  currentPrice: null,
};

test("Radar buy preserves watch item and creates cash/position/ledger atomically", () => {
  const result = buyFromRadar(state(), watched, 2, 10);
  assert.equal(result.radar.length, 1);
  assert.equal(result.specs[0].qty, 2);
  assert.equal(result.specs[0].buyPrice, 10);
  assert.equal(result.cash, 80);
  assert.equal(result.transactions[0].type, "BUY");
  assert.equal(result.transactions[0].balanceAfter, 80);
});

test("additional buy uses weighted average cost basis", () => {
  const current = { ...watched, qty: 2, buyPrice: 10 };
  const result = buyFromRadar(state({ specs: [current] }), watched, 1, 16);
  assert.equal(result.specs[0].qty, 3);
  assert.equal(result.specs[0].buyPrice, 12);
});

test("partial sale keeps position and records realized profit", () => {
  const current = { ...watched, qty: 3, buyPrice: 10 };
  const result = sellPosition(state({ specs: [current], cash: 50 }), current, 2, 15);
  assert.equal(result.specs[0].qty, 1);
  assert.equal(result.cash, 80);
  assert.equal(result.transactions[0].realizedPL, 10);
  assert.equal(result.transactions[0].costBasisPerUnit, 10);
});

test("full sale closes position without removing Radar", () => {
  const current = { ...watched, qty: 2, buyPrice: 10 };
  const result = sellPosition(state({ specs: [current] }), current, 2, 12);
  assert.equal(result.specs.length, 0);
  assert.equal(result.radar.length, 1);
});

test("safe Position deletion succeeds without creating a transaction", () => {
  const current = { ...watched, foil: false, qty: 2, buyPrice: 10 };
  const result = deletePosition(state({ specs: [current] }), current);
  assert.equal(result.specs.length, 0);
  assert.equal(result.transactions.length, 0);
});

test("unsafe Position deletion is blocked when the ledger projects an open holding", () => {
  const current = { ...watched, foil: false, qty: 2, buyPrice: 10 };
  const transaction = {
    id: "buy-1", cardId: current.id, scryfall_id: current.scryfall_id, foil: false,
    name: current.name, type: "BUY", quantity: 2, price: 10, date: "2026-07-01T00:00:00.000Z",
  };
  const currentState = state({ specs: [current], transactions: [transaction] });
  assert.throws(() => deletePosition(currentState, current), error => {
    assert.equal(error.code, "would_leave_open_transaction_projection");
    assert.match(error.message, /still projects an open holding/);
    return true;
  });
  assert.equal(currentState.specs.length, 1);
  assert.equal(currentState.transactions.length, 1);
});

test("foil tracked identity uses composite row id and base Scryfall id", () => {
  const tracked = toTrackedCard({ id: "abc", name: "Foil Card", set: "tst", set_name: "Test", collector_number: "1", finishes: ["foil"], prices: { usd_foil: "4.50" } }, { foil: true });
  assert.equal(tracked.id, "abc|foil");
  assert.equal(tracked.scryfall_id, "abc");
  assert.equal(tracked.currentPrice, 4.5);
});

test("set-number parser does not misclassify two-word card names", () => {
  assert.equal(parseSetNumberQuery("Sol Ring"), null);
  assert.deepEqual([...parseSetNumberQuery("MH3 123")].slice(1), ["MH3", "123"]);
  assert.deepEqual([...parseSetNumberQuery("sld #123a")].slice(1), ["sld", "123a"]);
});

test("sealed trading uses separate compatible stores with weighted cost and mixed cash", () => {
  const watchedState = state({ sealedRadar: [sealed], cash: 500 });
  const bought = buyFromRadar(watchedState, sealed, 2, 100);
  assert.equal(bought.radar.length, 1);
  assert.equal(bought.sealedRadar.length, 1);
  assert.equal(bought.specs.length, 0);
  assert.equal(bought.transactions.length, 0);
  assert.equal(bought.sealedSpecs[0].qty, 2);
  assert.equal(bought.sealedSpecs[0].currentPrice, null);
  assert.equal(bought.sealedSpecs[0].pl, null);
  assert.equal(bought.sealedTransactions[0].assetKey, sealed.assetKey);
  assert.equal(bought.sealedTransactions[0].scryfall_id, undefined);
  assert.equal(bought.cash, 300);

  const added = buyFromRadar(bought, sealed, 1, 130);
  assert.equal(added.sealedSpecs[0].qty, 3);
  assert.equal(added.sealedSpecs[0].buyPrice, 110);
  assert.equal(added.cash, 170);

  const partial = sellPosition(added, added.sealedSpecs[0], 1, 150);
  assert.equal(partial.sealedSpecs[0].qty, 2);
  assert.equal(partial.sealedTransactions[0].realizedPL, 40);
  assert.equal(partial.cash, 320);

  const closed = sellPosition(partial, partial.sealedSpecs[0], 2, 160);
  assert.equal(closed.sealedSpecs.length, 0);
  assert.equal(closed.sealedRadar.length, 1);
  assert.equal(closed.cash, 640);
});

test("sealed deletion guard uses sealed transactions without changing singles", () => {
  const current = { ...sealed, qty: 1, buyPrice: 100 };
  const currentState = state({
    sealedSpecs: [current],
    sealedTransactions: [{ assetType: "sealed", assetKey: sealed.assetKey, type: "BUY", quantity: 1 }],
  });
  assert.throws(() => deletePosition(currentState, current), /sealed transaction history still projects an open holding/);
  assert.equal(currentState.sealedSpecs.length, 1);
  assert.equal(currentState.specs.length, 0);
});
