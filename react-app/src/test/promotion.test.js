import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import { captureRawRecovery, createStorageAdapter, normalizeBackup } from "../persistence/storage.js";
import { buyFromRadar, sellPosition } from "../domain/trading.js";

function memoryStorage(initial) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    snapshot: () => Object.fromEntries(values),
  };
}

test("actual vanilla backup code reads React singles trades, exact finishes and notes without data loss", () => {
  const card = { id: "printing|foil", scryfall_id: "printing", finish: "foil", foil: true, finishes: ["nonfoil", "foil"], name: "Synthetic exact foil", currentPrice: null, ownerField: { keep: true } };
  const storage = memoryStorage({ cash: "100", radar: JSON.stringify([card]), originOtherApp: "do-not-export" });
  const adapter = createStorageAdapter(storage);
  let state = adapter.loadState();
  state = buyFromRadar(state, card, 2, 5);
  state = sellPosition(state, state.specs[0], 1, 8);
  state.cardNotes = [{ id: "note", cardId: card.id, scryfall_id: card.scryfall_id, finish: "foil", text: "Preserve this thesis" }];
  adapter.saveSlices({ specs: state.specs, cash: state.cash, transactions: state.transactions, cardNotes: state.cardNotes });
  const before = storage.snapshot();
  const context = vm.createContext({ localStorage: storage, console });
  for (const path of ["js/core/data-foundation.js", "js/core/storage.js"]) {
    vm.runInContext(readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8"), context);
  }
  const vanilla = JSON.parse(vm.runInContext("JSON.stringify(createManaSpecBackup())", context));
  assert.equal(vanilla.data.cash, 98);
  assert.equal(vanilla.data.specs[0].qty, 1);
  assert.equal(vanilla.data.specs[0].finish, "foil");
  assert.equal(vanilla.data.specs[0].currentPrice, null);
  assert.equal(vanilla.data.specs[0].ownerField.keep, true);
  assert.equal(vanilla.data.transactions.length, 2);
  assert.equal(vanilla.data.transactions[0].realizedPL, 3);
  assert.equal(vanilla.data.cardNotes[0].text, "Preserve this thesis");
  assert.deepEqual(storage.snapshot(), before);
  const roundTrip = createStorageAdapter(memoryStorage({}));
  const restored = roundTrip.restoreBackup(vanilla);
  assert.deepEqual(roundTrip.createBackup(restored).data, JSON.parse(JSON.stringify(adapter.createBackup(state).data)));
});

test("older backup metadata cannot silently discard supplied sealed records", () => {
  const result = normalizeBackup({ app: "ManaSpec", dataSchemaVersion: 1, data: { cash: 100, sealedSpecs: [{ id: "sealed:keep", ownerField: true }] } });
  assert.equal(result.ok, true);
  assert.deepEqual(result.backup.data.sealedSpecs, [{ id: "sealed:keep", ownerField: true }]);
});

test("raw recovery preserves corrupt and pending strings without exposing unrelated origin data", () => {
  const initial = { specs: "not-json", cash: "broken", manaspec_pending_commit_v1: "incomplete", anotherAppSecret: "never-export" };
  const storage = memoryStorage(initial);
  const recovery = captureRawRecovery(storage);
  assert.equal(recovery.schema, "manaspec-raw-recovery");
  assert.equal(recovery.raw.specs, initial.specs);
  assert.equal(recovery.raw.manaspec_pending_commit_v1, "incomplete");
  assert.equal(Object.hasOwn(recovery.raw, "anotherAppSecret"), false);
  assert.deepEqual(storage.snapshot(), initial);
});

test("guarded vanilla rollback starts only on compatible singles data and never writes", () => {
  const guard = readFileSync(new URL("../../../tools/vanilla-rollback-guard.js", import.meta.url), "utf8");
  for (const [initial, safe] of [
    [{ cash: "100", specs: "[]" }, true],
    [{ transactions: '[{"type":"BUY","trade":{"version":1}}]' }, false],
    [{ cash: "100", sealedSpecs: '[{"assetType":"sealed"}]' }, false],
    [{ sealedTransactions: '[{"type":"SELL"}]' }, false],
    [{ cardNotes: '[{"assetKey":"sealed:old-product"}]' }, false],
    [{ manaspec_pending_commit_v1: "pending" }, false],
    [{ specs: "corrupt" }, false],
    [{ cash: "NaN" }, false],
  ]) {
    const storage = memoryStorage(initial);
    const context = vm.createContext({ localStorage: storage, window: {}, document: { addEventListener() {} } });
    vm.runInContext(guard, context);
    assert.equal(context.window.manaspecVanillaSafe, safe);
    assert.deepEqual(storage.snapshot(), initial);
  }
});
