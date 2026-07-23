import test from "node:test";
import assert from "node:assert/strict";
import { buyFromRadar, deletePosition, sellPosition } from "../domain/trading.js";
import { parseSetNumberQuery, toTrackedCard } from "../services/scryfall.js";

const watched = {
  id: "printing-1", scryfall_id: "printing-1", name: "Test Card", set_code: "TST",
  set_name: "Test Set", collector_number: "7", currentPrice: 12, plannedQty: 2,
};

function state(overrides = {}) {
  return { specs: [], radar: [watched], transactions: [], cardNotes: [], cash: 100, ...overrides };
}

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
