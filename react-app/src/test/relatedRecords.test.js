import assert from "node:assert/strict";
import test from "node:test";
import {
  getRelatedRecordsForPrinting,
  relatedRecordMatchesPrinting,
  resolveCardDetailPrinting,
  resolveTrackedPrinting,
} from "../domain/relatedRecords.js";

const nonfoil = {
  id: "printing-a",
  scryfall_id: "printing-a",
  foil: false,
  name: "Shared Name",
  set_code: "ONE",
  collector_number: "1",
};
const foil = { ...nonfoil, id: "printing-a|foil", foil: true };
const otherPrinting = {
  id: "printing-b",
  scryfall_id: "printing-b",
  foil: false,
  name: "Shared Name",
  set_code: "TWO",
  collector_number: "2",
};
const tracked = [nonfoil, foil, otherPrinting];

test("foil and nonfoil notes remain isolated", () => {
  const notes = [
    { id: "n1", cardKey: "printing-a|nonfoil", text: "Nonfoil note" },
    { id: "n2", cardKey: "printing-a|foil", text: "Foil note" },
    { id: "legacy", cardId: "printing-a", cardName: "Shared Name", text: "Ambiguous legacy note" },
  ];
  assert.deepEqual(getRelatedRecordsForPrinting(notes, nonfoil, tracked).map(note => note.id), ["n1"]);
  assert.deepEqual(getRelatedRecordsForPrinting(notes, foil, tracked).map(note => note.id), ["n2"]);
});

test("same-name tracked printings never cross-reference", () => {
  const exact = { cardKey: "printing-b|nonfoil", cardName: "Shared Name" };
  const nameOnly = { cardName: "Shared Name" };
  assert.equal(resolveTrackedPrinting(exact, tracked), otherPrinting);
  assert.equal(resolveTrackedPrinting(nameOnly, tracked), null);
  assert.equal(relatedRecordMatchesPrinting(exact, nonfoil, tracked), false);
});

test("price history resolves by exact printing and finish", () => {
  const snapshots = [
    { id: "p1", cardId: "printing-a", foil: false, price: 3 },
    { id: "p2", cardId: "printing-a", foil: true, price: 8 },
    { id: "p3", cardId: "printing-b", foil: false, price: 5 },
  ];
  assert.deepEqual(getRelatedRecordsForPrinting(snapshots, nonfoil, tracked).map(row => row.id), ["p1"]);
  assert.deepEqual(getRelatedRecordsForPrinting(snapshots, foil, tracked).map(row => row.id), ["p2"]);
  assert.deepEqual(getRelatedRecordsForPrinting(snapshots, otherPrinting, tracked).map(row => row.id), ["p3"]);
});

test("market observations remain isolated by exact printing", () => {
  const observations = [
    { id: "m1", cardKey: "printing-a|nonfoil", marketPrice: 4 },
    { id: "m2", cardKey: "printing-a|foil", marketPrice: 9 },
  ];
  assert.deepEqual(getRelatedRecordsForPrinting(observations, nonfoil, tracked).map(row => row.id), ["m1"]);
  assert.deepEqual(getRelatedRecordsForPrinting(observations, foil, tracked).map(row => row.id), ["m2"]);
});

test("transactions and History events resolve to the correct Card Detail printing", () => {
  const foilTransaction = { scryfall_id: "printing-a", foil: true, name: "Shared Name" };
  const otherHistoryEvent = { cardId: "printing-b", foil: false, name: "Shared Name" };
  assert.equal(resolveCardDetailPrinting(foilTransaction, tracked), foil);
  assert.equal(resolveCardDetailPrinting(otherHistoryEvent, tracked), otherPrinting);
  assert.equal(resolveCardDetailPrinting({ scryfall_id: "closed-printing", foil: false }, tracked)?.scryfall_id, "closed-printing");
  assert.equal(resolveCardDetailPrinting({ name: "Shared Name" }, tracked), null);
});

test("legacy fallback resolves only when one tracked printing is possible", () => {
  assert.equal(resolveTrackedPrinting({ cardId: "printing-a" }, tracked), null);
  assert.equal(resolveTrackedPrinting({ id: "legacy-note-id", cardName: "Only Card" }, [{ ...nonfoil, name: "Only Card" }])?.id, "printing-a");
});
