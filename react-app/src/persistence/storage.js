import { dataFoundation } from "../domain/dataFoundation.js";
import { normalizeSealedAsset } from "../domain/assetIdentity.js";
import { finishPolicy } from "../domain/finishPolicy.js";
import { COMMIT_KEY, commitRaw, recoverCommit } from "./commit.js";

export const BACKUP_SCHEMA = "manaspec-localstorage-backup";
export const BACKUP_SCHEMA_VERSION = 1;
export const DATA_SCHEMA_VERSION = 2;
export const APP_VERSION = "0.9.0-alpha.1-react-spike";
export const STARTING_CASH = 10_000;

export const ARRAY_KEYS = Object.freeze([
  "specs",
  "radar",
  "transactions",
  "cardNotes",
  "thesisNotes",
  "signals",
  "priceSnapshots",
  "marketObservations",
  "sealedSpecs",
  "sealedRadar",
  "sealedTransactions",
]);

const PRE_IMPORT_BACKUP_KEY = "manaspec_pre_import_backup";
const STATE_KEYS = [...ARRAY_KEYS, "cash", "priceRefreshStatus"];
const SEALED_SOURCE = Symbol("manaspecSealedCompatibility");

function loadSealedRecord(record, transaction = false) {
  const normalized = { ...normalizeSealedAsset(record), ...(transaction ? { id: record.id } : {}) };
  // Symbol metadata survives immutable object spreads but never JSON export.
  // Keep aliases/defaults available to selectors without rewriting old records.
  Object.defineProperty(normalized, SEALED_SOURCE, {
    value: { raw: { ...record }, baseline: { ...normalized } }, enumerable: true,
  });
  return normalized;
}

function serializeSealedRecords(records = []) {
  return records.map(record => {
    const source = record[SEALED_SOURCE];
    if (!source) return record;
    const saved = { ...source.raw };
    for (const key of Object.keys(saved)) if (!Object.hasOwn(record, key)) delete saved[key];
    for (const [key, value] of Object.entries(record)) {
      if (!Object.hasOwn(source.baseline, key) || value !== source.baseline[key]) saved[key] = value;
    }
    return saved;
  });
}

export function captureRawRecovery(storage = globalThis.localStorage) {
  return {
    app: "ManaSpec",
    schema: "manaspec-raw-recovery",
    exportedAt: new Date().toISOString(),
    // Raw strings are intentionally not parsed or normalized, including a
    // pending undo record. This is a recovery archive, not an Admin import.
    raw: Object.fromEntries([...STATE_KEYS, COMMIT_KEY, PRE_IMPORT_BACKUP_KEY, finishPolicy.BACKUP_KEY]
      .map(key => [key, storage.getItem(key)])),
  };
}

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

export function getBrowserStorage() {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return { storage: createMemoryStorage(), persistent: false };
    storage.getItem("__manaspec_storage_probe__");
    return { storage, persistent: true };
  } catch {
    return { storage: createMemoryStorage(), persistent: false };
  }
}

function readJson(storage, key, fallback) {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Saved data for "${key}" is invalid. Preserve browser storage before troubleshooting; no data was changed.`);
  }
}

function readArray(storage, key) {
  const value = readJson(storage, key, []);
  if (!Array.isArray(value)) throw new Error(`Saved data for "${key}" is not a list. Preserve browser storage before troubleshooting.`);
  return value;
}

function normalizeCoreArray(records, normalizer) {
  return records.map(record => dataFoundation[normalizer](record));
}

export function buildBackupCounts(data) {
  return {
    positions: data.specs.length,
    radar: data.radar.length,
    transactions: data.transactions.length,
    cardNotes: data.cardNotes.length,
    thesisNotes: data.thesisNotes.length,
    signals: data.signals.length,
    priceSnapshots: data.priceSnapshots.length,
    marketObservations: data.marketObservations.length,
    sealedPositions: data.sealedSpecs.length,
    sealedRadar: data.sealedRadar.length,
    sealedTransactions: data.sealedTransactions.length,
  };
}

export function migrateBackupData(data, sourceVersion) {
  // Optional sealed arrays have already defaulted to empty. Retain any supplied
  // records even in an older export rather than silently discarding them.
  return data;
}

export function normalizeBackup(backup, fallbackCash = STARTING_CASH) {
  if (!backup || typeof backup !== "object" || Array.isArray(backup)) {
    return { ok: false, message: "That file does not look like a ManaSpec backup." };
  }
  if (backup.app !== "ManaSpec" && backup.schema !== BACKUP_SCHEMA) {
    return { ok: false, message: "That file does not look like a ManaSpec backup." };
  }

  const schemaVersion = Number(backup.schemaVersion || BACKUP_SCHEMA_VERSION);
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1 || schemaVersion > BACKUP_SCHEMA_VERSION) {
    return { ok: false, message: "That backup uses an unsupported backup schema version. No data was changed." };
  }

  const dataSchemaVersion = backup.dataSchemaVersion === undefined
    ? DATA_SCHEMA_VERSION
    : Number(backup.dataSchemaVersion);
  if (!Number.isInteger(dataSchemaVersion) || dataSchemaVersion < 1 || dataSchemaVersion > DATA_SCHEMA_VERSION) {
    return { ok: false, message: "That backup uses an unsupported ManaSpec data schema version. No data was changed." };
  }

  if (!backup.data || typeof backup.data !== "object" || Array.isArray(backup.data)) {
    return { ok: false, message: "Backup could not be imported. No data was changed." };
  }

  const data = {};
  for (const key of ARRAY_KEYS) {
    const value = backup.data[key];
    if (value === undefined || value === null) data[key] = [];
    else if (!Array.isArray(value)) {
      return { ok: false, message: `Backup field "${key}" was not in the expected format. No data was changed.` };
    } else data[key] = value;
  }

  const cash = Number(backup.data.cash);
  data.cash = Number.isFinite(cash) ? cash : fallbackCash;
  const refreshStatus = backup.data.priceRefreshStatus;
  data.priceRefreshStatus = refreshStatus && typeof refreshStatus === "object" && !Array.isArray(refreshStatus)
    ? refreshStatus
    : {};
  const migratedData = migrateBackupData(data, dataSchemaVersion);

  const normalized = {
    app: "ManaSpec",
    schema: BACKUP_SCHEMA,
    schemaVersion,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    appVersion: backup.appVersion || "",
    exportedAt: backup.exportedAt || "",
    data: migratedData,
    counts: buildBackupCounts(migratedData),
  };
  return { ok: true, backup: normalized };
}

export function parseBackupText(text) {
  try {
    return normalizeBackup(JSON.parse(text));
  } catch (error) {
    return { ok: false, message: "That file is not valid JSON.", error };
  }
}

export function createStorageAdapter(storageInput) {
  const resolved = storageInput
    ? { storage: storageInput, persistent: true }
    : getBrowserStorage();
  const { storage, persistent } = resolved;
  let expected;
  const capture = () => Object.fromEntries(STATE_KEYS.map(key => [key, storage.getItem(key)]));

  function loadState() {
    recoverCommit(storage, STATE_KEYS);
    expected = capture();
    const rawCash = Number.parseFloat(storage.getItem("cash"));
    if (expected.cash !== null && (!expected.cash.trim() || !Number.isFinite(Number(expected.cash)))) {
      throw new Error("Saved cash is invalid. Preserve browser storage before troubleshooting; no data was changed.");
    }
    return {
      specs: normalizeCoreArray(readArray(storage, "specs"), "normalizeSpec"),
      radar: normalizeCoreArray(readArray(storage, "radar"), "normalizeRadarItem"),
      transactions: normalizeCoreArray(readArray(storage, "transactions"), "normalizeTransaction"),
      cardNotes: readArray(storage, "cardNotes"),
      thesisNotes: readArray(storage, "thesisNotes"),
      signals: readArray(storage, "signals"),
      cash: Number.isFinite(rawCash) ? rawCash : STARTING_CASH,
      priceSnapshots: readArray(storage, "priceSnapshots"),
      priceRefreshStatus: readJson(storage, "priceRefreshStatus", null),
      marketObservations: readArray(storage, "marketObservations"),
      sealedSpecs: readArray(storage, "sealedSpecs").map(record => loadSealedRecord(record)),
      sealedRadar: readArray(storage, "sealedRadar").map(record => loadSealedRecord(record)),
      sealedTransactions: readArray(storage, "sealedTransactions").map(record => loadSealedRecord(record, true)),
    };
  }

  function serializeState(state) {
    return {
      specs: dataFoundation.serializeCompatibleRecords(state.specs),
      radar: dataFoundation.serializeCompatibleRecords(state.radar),
      transactions: dataFoundation.serializeCompatibleRecords(state.transactions),
      cardNotes: Array.isArray(state.cardNotes) ? state.cardNotes : [],
      thesisNotes: Array.isArray(state.thesisNotes) ? state.thesisNotes : [],
      signals: Array.isArray(state.signals) ? state.signals : [],
      cash: Number.isFinite(Number(state.cash)) ? Number(state.cash) : STARTING_CASH,
      priceSnapshots: Array.isArray(state.priceSnapshots) ? state.priceSnapshots : [],
      priceRefreshStatus: state.priceRefreshStatus && typeof state.priceRefreshStatus === "object"
        ? state.priceRefreshStatus
        : {},
      marketObservations: Array.isArray(state.marketObservations) ? state.marketObservations : [],
      sealedSpecs: serializeSealedRecords(state.sealedSpecs),
      sealedRadar: serializeSealedRecords(state.sealedRadar),
      sealedTransactions: serializeSealedRecords(state.sealedTransactions),
    };
  }

  function createBackup(state = loadState()) {
    const data = serializeState(state);
    return {
      app: "ManaSpec",
      schema: BACKUP_SCHEMA,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      dataSchemaVersion: DATA_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      data,
      counts: buildBackupCounts(data),
    };
  }

  function encodeSlice(key, value) {
    if (key === "cash") return String(Number(value));
    if (key === "priceRefreshStatus") return JSON.stringify(value || {});
    if (["specs", "radar", "transactions"].includes(key)) return JSON.stringify(dataFoundation.serializeCompatibleRecords(value));
    if (["sealedSpecs", "sealedRadar", "sealedTransactions"].includes(key)) return JSON.stringify(serializeSealedRecords(value));
    return JSON.stringify(value);
  }

  function saveSlices(slices) {
    if (!expected) loadState();
    const values = Object.fromEntries(Object.entries(slices).map(([key, value]) => [key, encodeSlice(key, value)]));
    commitRaw(storage, values, expected, STATE_KEYS);
    expected = capture();
  }

  function saveSlice(key, value) { saveSlices({ [key]: value }); }

  function restoreBackup(backupInput) {
    const validation = normalizeBackup(backupInput, loadState().cash);
    if (!validation.ok) throw new Error(validation.message);
    const emergencyBackup = createBackup();
    storage.setItem(PRE_IMPORT_BACKUP_KEY, JSON.stringify({
      createdAt: new Date().toISOString(),
      reason: "pre-import",
      backup: emergencyBackup,
    }));
    saveSlices(validation.backup.data);
    return loadState();
  }

  function previewFinishCorrection(cards) {
    const captured = finishPolicy.capture(storage);
    return { raw: captured.raw, original: captured.data, plan: finishPolicy.planCorrection(captured.data, cards) };
  }
  function applyFinishCorrection(preview) {
    finishPolicy.commit(storage, preview, createBackup());
    return loadState();
  }

  return Object.freeze({
    persistent,
    loadState,
    saveSlice,
    saveSlices,
    createBackup,
    restoreBackup,
    previewFinishCorrection,
    applyFinishCorrection,
    correctionBackup: () => readJson(storage, finishPolicy.BACKUP_KEY, null)?.backup || null,
    parseBackupText,
    raw: storage,
  });
}
