const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rawSpec = {
  id: "legacy-printing",
  scryfall_id: "legacy-printing",
  name: "Legacy Card",
  set_code: "TST",
  collector_number: "1a",
  foil: false,
  qty: "2",
  buyPrice: "4.50",
  entryTarget: 3,
  unknownFutureField: { preserved: true },
};
const rawRadar = [{ ...rawSpec, qty: undefined, buyPrice: undefined, plannedQty: "3" }];
delete rawRadar[0].qty;
delete rawRadar[0].buyPrice;
const rawTransaction = {
  id: "tx-1",
  cardId: "legacy-printing",
  foil: false,
  type: "BUY",
  quantity: "2",
  price: "4.50",
  fees: 0,
  date: "2026-01-01T00:00:00.000Z",
  backfilledFromPositionId: "legacy-printing",
  unknownTransactionField: "preserved",
};

const initial = new Map([
  ["specs", JSON.stringify([rawSpec])],
  ["radar", JSON.stringify(rawRadar)],
  ["transactions", JSON.stringify([rawTransaction])],
  ["cash", "10000"],
]);
const writes = [];
const localStorage = {
  getItem(key) { return initial.has(key) ? initial.get(key) : null; },
  setItem(key, value) { initial.set(key, String(value)); writes.push({ key, value: String(value) }); },
};
const context = vm.createContext({ console, localStorage, globalThis: null });
context.globalThis = context;

function runScript(relativePath) {
  const filename = path.resolve(__dirname, "..", relativePath);
  vm.runInContext(fs.readFileSync(filename, "utf8"), context, { filename });
}

runScript("js/core/data-foundation.js");
runScript("js/core/storage.js");

const beforeLoad = Object.fromEntries(initial);
const specs = context.loadSpecs();
const radar = context.loadRadar();
const transactions = context.loadTransactions();
assert.equal(writes.length, 0, "Loading core records must not write localStorage");
assert.deepEqual(Object.fromEntries(initial), beforeLoad, "Loading must preserve serialized storage byte-for-byte");
assert.equal(specs[0].lang, null);
assert.equal(transactions[0].backfilledFromPositionId, "legacy-printing");
const clonedRadarPosition = { ...radar[0], qty: 1, buyPrice: 4.5 };
assert.equal(Object.prototype.hasOwnProperty.call(clonedRadarPosition, "lang"), false);
assert.equal(Object.prototype.hasOwnProperty.call(clonedRadarPosition, "trackedPrintingKey"), false);
assert.equal(Object.prototype.hasOwnProperty.call(clonedRadarPosition, "plan"), false);

context.saveSpecsState(specs);
context.saveRadarState(radar);
context.saveTransactionsState(transactions);
assert.equal(initial.get("specs"), beforeLoad.specs);
assert.equal(initial.get("radar"), beforeLoad.radar);
assert.equal(initial.get("transactions"), beforeLoad.transactions);

specs[0].exitTarget = 12;
context.saveSpecsState(specs);
const savedSpec = JSON.parse(initial.get("specs"))[0];
assert.equal(savedSpec.exitTarget, 12);
assert.deepEqual(savedSpec.unknownFutureField, { preserved: true });
assert.equal(Object.prototype.hasOwnProperty.call(savedSpec, "lang"), false);
assert.equal(Object.prototype.hasOwnProperty.call(savedSpec, "trackedPrintingKey"), false);
assert.equal(Object.prototype.hasOwnProperty.call(savedSpec, "plan"), false);

context.saveCashState(9876.54);
assert.equal(initial.get("cash"), "9876.54");

const backup = context.createManaSpecBackup();
assert.equal(backup.schema, "manaspec-localstorage-backup");
assert.equal(JSON.stringify(backup.data.specs[0].unknownFutureField), JSON.stringify({ preserved: true }));
assert(Array.isArray(backup.data.radar));
assert(Array.isArray(backup.data.transactions));
assert(Object.prototype.hasOwnProperty.call(backup.data, "cash"));
const parsedBackup = context.parseManaSpecBackupText(JSON.stringify(backup));
assert.equal(parsedBackup.ok, true);
context.restoreManaSpecBackup(parsedBackup.backup);
assert(initial.has("manaspec_pre_import_backup"));
assert.equal(JSON.parse(initial.get("specs"))[0].exitTarget, 12);

process.stdout.write(`${JSON.stringify({
  status: "passed",
  loadOnlyWrites: 0,
  byteEquivalentUnchangedSaves: ["specs", "radar", "transactions"],
  unknownFieldPreserved: true,
  missingLanguageAddedToStorage: false,
  startupBackfillIdentificationPreserved: true,
  backupRoundTripPreserved: true,
  emergencyPreImportBackupCreated: true,
  actualEditPersisted: { exitTarget: savedSpec.exitTarget },
}, null, 2)}\n`);
