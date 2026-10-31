import test from "node:test";
import assert from "node:assert/strict";
import { compactDate, compactDateTime, compactHold, compactRarity, printingLabel } from "../domain/display.js";
import { EMPTY_CARD_FILTERS, filterTrackedCards } from "../domain/cardFilters.js";

test("compact displays preserve exact finish and invalid dates remain unavailable", () => {
  const value = new Date(2026, 9, 30, 23, 59).toISOString();
  assert.equal(compactDate(value), "10/30/26");
  assert.equal(compactDateTime(value), "10/30/26 23:59");
  for (const value of [null, "", "invalid"]) assert.equal(compactDateTime(value), "-");
  assert.equal(compactRarity("uncommon"), "U");
  assert.equal(compactHold("36 months"), "36 mo");
  assert.equal(compactHold("6"), "6 mo");
  assert.equal(compactHold("6-12 months"), "6-12 mo");
  assert.equal(printingLabel({ collector_number: "THS-223", finish: "etched" }), "THS-223 E");
  assert.equal(printingLabel({ collector_number: "533", foil: true }), "533 F");
});

test("local price filters distinguish missing quotes from genuine zero for all assets", () => {
  const records = [null, undefined, "", NaN, 0, 3].map((currentPrice, id) => ({ id, currentPrice, entryTarget: 5 }));
  const before = records.map(row => ({ ...row }));
  assert.deepEqual(filterTrackedCards(records, { ...EMPTY_CARD_FILTERS, maxPrice: "0" }).map(row => row.id), [4]);
  assert.deepEqual(filterTrackedCards(records, { ...EMPTY_CARD_FILTERS, maxPrice: "2" }).map(row => row.id), [4]);
  assert.deepEqual(filterTrackedCards(records, { ...EMPTY_CARD_FILTERS, plan: "entryHit" }, { source: "radar" }).map(row => row.id), [4, 5]);
  assert.deepEqual(records, before);
});

test("plan filters follow the route owner and use the same five percent boundary", () => {
  const row = { id: "same", qty: 2, currentPrice: 10.5, entryTarget: 10, exitTarget: 20 };
  assert.equal(filterTrackedCards([row], { ...EMPTY_CARD_FILTERS, plan: "approaching" }, { source: "radar" }).length, 1);
  assert.equal(filterTrackedCards([row], { ...EMPTY_CARD_FILTERS, plan: "approaching" }, { source: "positions" }).length, 0);
});
