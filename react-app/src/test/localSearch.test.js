import assert from "node:assert/strict";
import test from "node:test";
import { buildHistoryEvents, buildLocalSearchIndex, groupLocalSearchResults, normalizeLocalSearchText, searchLocalState } from "../domain/localSearch.js";

const position = {
  id: "shared-printing|nonfoil",
  scryfall_id: "shared-printing",
  trackedPrintingKey: "shared-printing|nonfoil",
  finish: "nonfoil",
  name: "Twin Search Card",
  set_code: "ONE",
  set_name: "First Set",
  collector_number: "1",
  qty: 2,
  buyPrice: 4,
  buyDate: "2026-01-01T12:00:00.000Z",
  currentPrice: 6,
};
const watchedFoil = {
  ...position,
  id: "shared-printing|foil",
  trackedPrintingKey: "shared-printing|foil",
  finish: "foil",
  foil: true,
  plannedQty: 3,
};
const watchedOther = {
  ...position,
  id: "other-printing|nonfoil",
  scryfall_id: "other-printing",
  trackedPrintingKey: "other-printing|nonfoil",
  set_code: "TWO",
  set_name: "Second Set",
  collector_number: "2",
  plannedQty: 1,
};

const state = {
  specs: [position],
  radar: [watchedFoil, watchedOther],
  transactions: [{
    id: "tx-foil",
    cardId: "shared-printing|foil",
    trackedPrintingKey: "shared-printing|foil",
    foil: true,
    name: "Twin Search Card",
    set_code: "ONE",
    collector_number: "1",
    type: "BUY",
    quantity: 3,
    price: 5,
    balanceAfter: 985,
    notes: "foil transaction",
    date: "2026-02-01T12:00:00.000Z",
  }],
  cardNotes: [{
    id: "note-foil",
    cardKey: "shared-printing|foil",
    cardName: "Twin Search Card",
    text: "Foil conviction remains strong",
    createdAt: "2026-02-02T12:00:00.000Z",
  }, {
    id: "note-ambiguous",
    cardName: "Twin Search Card",
    text: "Legacy ambiguous note",
    createdAt: "2026-02-03T12:00:00.000Z",
  }],
  thesisNotes: [{
    id: "general-thesis",
    cardName: "General",
    conviction: "Rotation thesis review",
    createdAt: "2026-02-04T12:00:00.000Z",
  }],
};

test("local search normalization supports accents, punctuation, and partial tokens", () => {
  assert.equal(normalizeLocalSearchText("  Étched — ONE #1  "), "etched one 1");
  const results = searchLocalState(state, "twin sea");
  assert.ok(results.some(result => result.category === "Positions"));
  assert.ok(results.some(result => result.category === "Radar"));
  assert.ok(results.some(result => result.category === "Transactions"));
  assert.ok(results.some(result => result.category === "History"));
  assert.ok(results.some(result => result.category === "Notes"));
});

test("same-name local results retain exact printing and source navigation", () => {
  const results = searchLocalState(state, "Twin Search Card", { perCategory: 10 });
  const positionResult = results.find(result => result.category === "Positions");
  const foilRadarResult = results.find(result => result.category === "Radar" && result.exactPrintingKey === "shared-printing|foil");
  const otherRadarResult = results.find(result => result.category === "Radar" && result.exactPrintingKey === "other-printing|nonfoil");
  assert.deepEqual(positionResult.destination, { pathname: "/positions", search: "?focus=shared-printing%7Cnonfoil&detail=1" });
  assert.deepEqual(foilRadarResult.destination, { pathname: "/radar", search: "?focus=shared-printing%7Cfoil&detail=1" });
  assert.deepEqual(otherRadarResult.destination, { pathname: "/radar", search: "?focus=other-printing%7Cnonfoil&detail=1" });
});

test("transaction, History, and note results focus the exact available context", () => {
  const index = buildLocalSearchIndex(state);
  const transaction = index.find(result => result.category === "Transactions");
  const history = index.find(result => result.category === "History" && result.record.id === "tx-foil");
  const exactNote = index.find(result => result.category === "Notes" && result.record.id === "note-foil");
  const ambiguousNote = index.find(result => result.category === "Notes" && result.record.id === "note-ambiguous");
  assert.deepEqual(transaction.destination, { pathname: "/transactions", search: "?focus=tx-foil" });
  assert.deepEqual(history.destination, { pathname: "/history", search: "?focus=tx-foil" });
  assert.equal(exactNote.exactPrintingKey, "shared-printing|foil");
  assert.deepEqual(exactNote.destination, { pathname: "/radar", search: "?focus=shared-printing%7Cfoil&detail=notes" });
  assert.deepEqual(ambiguousNote.destination, { pathname: "/history", search: "?focus=note-note-ambiguous" });
});

test("History events and grouped results preserve stable category contracts", () => {
  const events = buildHistoryEvents(state);
  assert.deepEqual(events.map(event => event.id), ["thesis-general-thesis", "note-note-ambiguous", "note-note-foil", "tx-foil"]);
  const grouped = groupLocalSearchResults(searchLocalState(state, "foil", { perCategory: 1 }));
  assert.ok(grouped.every(group => group.results.length === 1));
  assert.deepEqual(grouped.map(group => group.category), ["Radar", "Transactions", "History", "Notes"]);
});

test("short and missing queries do not expose the local index", () => {
  assert.deepEqual(searchLocalState(state, "t"), []);
  assert.deepEqual(searchLocalState(state, ""), []);
});
