import test from "node:test";
import assert from "node:assert/strict";
import { EMPTY_CARD_FILTERS, filterTrackedCards } from "../domain/cardFilters.js";

const cards = [
  { id: "near", name: "Near Entry", set_code: "ABC", rarity: "rare", type_line: "Instant", color_identity: ["U"], currentPrice: 10.5, entryTarget: 10, reserved: false, reprint: true },
  { id: "hit", name: "Entry Hit", set_code: "XYZ", rarity: "mythic", type_line: "Legendary Creature — Wizard", color_identity: ["U", "R"], currentPrice: 9, entryTarget: 10, reserved: true, reprint: false },
  { id: "empty", name: "No Plan", set_code: "ABC", rarity: "common", type_line: "Land", color_identity: [], currentPrice: 2, reserved: false, reprint: false },
];

test("card filters preserve vanilla text, metadata, price, and print semantics", () => {
  assert.deepEqual(filterTrackedCards(cards, { ...EMPTY_CARD_FILTERS, text: "wizard" }).map(card => card.id), ["hit"]);
  assert.deepEqual(filterTrackedCards(cards, { ...EMPTY_CARD_FILTERS, rarity: "rare", type: "Instant", color: "U", minPrice: "10", maxPrice: "11", reprint: "reprint" }).map(card => card.id), ["near"]);
  assert.deepEqual(filterTrackedCards(cards, { ...EMPTY_CARD_FILTERS, color: "C", reprint: "new" }).map(card => card.id), ["empty"]);
  assert.deepEqual(filterTrackedCards(cards, { ...EMPTY_CARD_FILTERS, reserved: true }).map(card => card.id), ["hit"]);
});

test("card plan filters use the shared five percent target boundary", () => {
  assert.deepEqual(filterTrackedCards(cards, { ...EMPTY_CARD_FILTERS, plan: "planned" }).map(card => card.id), ["near", "hit"]);
  assert.deepEqual(filterTrackedCards(cards, { ...EMPTY_CARD_FILTERS, plan: "unplanned" }).map(card => card.id), ["empty"]);
  assert.deepEqual(filterTrackedCards(cards, { ...EMPTY_CARD_FILTERS, plan: "entryHit" }).map(card => card.id), ["hit"]);
  assert.deepEqual(filterTrackedCards(cards, { ...EMPTY_CARD_FILTERS, plan: "approaching" }).map(card => card.id), ["near"]);
});
