import assert from "node:assert/strict";
import test from "node:test";
import { COMMIT_KEY } from "../persistence/commit.js";
import { createStorageAdapter } from "../persistence/storage.js";
import { buyFromRadar, sellPosition } from "../domain/trading.js";

function store(initial = {}) {
  const values = new Map(Object.entries(initial));
  let fault = () => false;
  return {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) {
      if (fault(key)) throw new Error("Synthetic quota failure");
      values.set(key, String(value));
    },
    removeItem: key => values.delete(key),
    snapshot: () => Object.fromEntries(values),
    fail: fn => { fault = fn; },
  };
}
const watched = { id: "single|foil", scryfall_id: "single", finish: "foil", foil: true, finishes: ["foil"], name: "Synthetic foil", currentPrice: null };
const initial = { cash: "100", radar: JSON.stringify([watched]), specs: "[]", transactions: "[]", unrelated: "retain" };

test("a quota failure at each trade write restores every prior raw value", () => {
  for (const failedKey of [COMMIT_KEY, "specs", "cash", "transactions"]) {
    const storage = store(initial);
    const adapter = createStorageAdapter(storage);
    const state = adapter.loadState();
    const next = buyFromRadar(state, state.radar[0], 2, 5, { source: "LGS", taxPaid: 1 });
    let failed = false;
    storage.fail(key => key === failedKey && !failed && (failed = true));
    assert.throws(() => adapter.saveSlices({ specs: next.specs, cash: next.cash, transactions: next.transactions }));
    assert.deepEqual(storage.snapshot(), initial, failedKey);
    assert.equal(adapter.loadState().cash, 100);
  }
});

test("interrupted writes at every crash boundary undo on a fresh adapter before loading", () => {
  const entries = [
    { key: "specs", before: "[]", after: JSON.stringify([{ ...watched, qty: 2, buyPrice: 5 }]) },
    { key: "cash", before: "100", after: "90" },
    { key: "transactions", before: "[]", after: JSON.stringify([{ id: "synthetic-buy", type: "BUY", quantity: 2, price: 5 }]) },
  ];
  for (let completed = 0; completed <= entries.length; completed++) {
    const raw = { ...initial, [COMMIT_KEY]: JSON.stringify({ version: 1, entries }) };
    for (const entry of entries.slice(0, completed)) raw[entry.key] = entry.after;
    const storage = store(raw);
    const loaded = createStorageAdapter(storage).loadState();
    assert.equal(loaded.cash, 100);
    assert.deepEqual(storage.snapshot(), initial);
  }
});

test("failed recovery keeps its durable undo record and blocks loading until repair succeeds", () => {
  const journal = JSON.stringify({ version: 1, entries: [{ key: "cash", before: "100", after: "90" }] });
  const storage = store({ ...initial, cash: "90", [COMMIT_KEY]: journal });
  storage.fail(key => key === "cash");
  assert.throws(() => createStorageAdapter(storage).loadState());
  assert.equal(storage.getItem(COMMIT_KEY), journal);
  storage.fail(() => false);
  assert.equal(createStorageAdapter(storage).loadState().cash, 100);
  assert.deepEqual(storage.snapshot(), initial);
});

test("recovery rejects conflicting or invalid journals without overwriting any value", () => {
  for (const journal of ["bad json", { version: 1, entries: [{ key: "unrelated", before: null, after: "x" }] }, { version: 1, entries: [{ key: "cash", before: "99", after: "90" }] }]) {
    const storage = store({ ...initial, [COMMIT_KEY]: typeof journal === "string" ? journal : JSON.stringify(journal) });
    const before = storage.snapshot();
    assert.throws(() => createStorageAdapter(storage).loadState());
    assert.deepEqual(storage.snapshot(), before);
  }
});

test("stale adapters cannot overwrite a newer trade or a vanilla tab's write", () => {
  const storage = store(initial);
  const first = createStorageAdapter(storage);
  const second = createStorageAdapter(storage);
  const state = first.loadState();
  second.loadState();
  first.saveSlices({ cash: 90, specs: buyFromRadar(state, watched, 2, 5).specs });
  const before = storage.snapshot();
  assert.throws(() => second.saveSlice("cash", 80), /another ManaSpec tab/);
  assert.deepEqual(storage.snapshot(), before);
  first.loadState();
  storage.setItem("transactions", "[{\"id\":\"vanilla-write\"}]");
  assert.throws(() => first.saveSlice("cardNotes", []), /another ManaSpec tab/);
});

test("successful buys, add-on buys and partial/full sales survive reload and backup restore", () => {
  const storage = store(initial);
  const adapter = createStorageAdapter(storage);
  let state = adapter.loadState();
  for (const operation of [
    current => buyFromRadar(current, watched, 2, 5),
    current => buyFromRadar(current, watched, 1, 7, { taxPaid: 1, source: "LGS", reference: "Synthetic-28" }),
    current => sellPosition(current, current.specs[0], 1, 10),
    current => sellPosition(current, current.specs[0], 2, 10),
  ]) {
    const next = operation(state);
    adapter.saveSlices({ specs: next.specs, cash: next.cash, transactions: next.transactions });
    state = adapter.loadState();
    assert.equal(storage.getItem(COMMIT_KEY), null);
  }
  assert.equal(state.cash, 112);
  assert.equal(state.transactions[2].trade.charges.taxPaid, 100);
  assert.equal(state.transactions[2].trade.reference, "Synthetic-28");
  assert.equal(state.specs.length, 0);
  assert.equal(state.transactions.length, 4);
  assert.equal(state.transactions.filter(row => row.type === "SELL").reduce((sum, row) => sum + row.realizedPL, 0), 12);
  const copy = createStorageAdapter(store());
  const restored = copy.restoreBackup(adapter.createBackup(state));
  assert.deepEqual(copy.createBackup(restored).data, adapter.createBackup(state).data);
});

test("restore failure preserves original raw keys and external pre-import recovery copy", () => {
  const storage = store(initial);
  const adapter = createStorageAdapter(storage);
  const backup = adapter.createBackup();
  backup.data.cash = 500;
  let failed = false;
  storage.fail(key => key === "cash" && !failed && (failed = true));
  assert.throws(() => adapter.restoreBackup(backup));
  const { manaspec_pre_import_backup: emergency, ...data } = storage.snapshot();
  assert.equal(JSON.parse(emergency).backup.data.cash, 100);
  assert.deepEqual(data, initial);
});

test("invalid stored arrays, JSON and cash fail closed without startup rewrite", () => {
  for (const invalid of [{ specs: "{}" }, { transactions: "bad json" }, { cash: "12oops" }]) {
    const storage = store({ ...initial, ...invalid });
    const before = storage.snapshot();
    assert.throws(() => createStorageAdapter(storage).loadState(), /Saved/);
    assert.deepEqual(storage.snapshot(), before);
  }
});
