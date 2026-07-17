import { dataFoundation } from "../domain/dataFoundation.js";

export const BACKUP_SCHEMA = "manaspec-localstorage-backup";
export const BACKUP_SCHEMA_VERSION = 1;
export const DATA_SCHEMA_VERSION = 1;
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
]);

const PRE_IMPORT_BACKUP_KEY = "manaspec_pre_import_backup";

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
    return fallback;
  }
}

function readArray(storage, key) {
  const value = readJson(storage, key, []);
  return Array.isArray(value) ? value : [];
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
  };
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

  const normalized = {
    app: "ManaSpec",
    schema: BACKUP_SCHEMA,
    schemaVersion,
    dataSchemaVersion,
    appVersion: backup.appVersion || "",
    exportedAt: backup.exportedAt || "",
    data,
    counts: buildBackupCounts(data),
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

  function loadState() {
    const rawCash = Number.parseFloat(storage.getItem("cash"));
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

  function saveSlice(key, value) {
    if (key === "cash") storage.setItem(key, String(Number(value)));
    else if (key === "priceRefreshStatus") storage.setItem(key, JSON.stringify(value || {}));
    else if (["specs", "radar", "transactions"].includes(key)) {
      storage.setItem(key, JSON.stringify(dataFoundation.serializeCompatibleRecords(value)));
    } else storage.setItem(key, JSON.stringify(value));
  }

  function writeBackupData(data) {
    for (const key of ARRAY_KEYS) storage.setItem(key, JSON.stringify(data[key]));
    storage.setItem("cash", String(data.cash));
    storage.setItem("priceRefreshStatus", JSON.stringify(data.priceRefreshStatus || {}));
  }

  function restoreBackup(backupInput) {
    const validation = normalizeBackup(backupInput, loadState().cash);
    if (!validation.ok) throw new Error(validation.message);
    const emergencyBackup = createBackup();
    try {
      storage.setItem(PRE_IMPORT_BACKUP_KEY, JSON.stringify({
        createdAt: new Date().toISOString(),
        reason: "pre-import",
        backup: emergencyBackup,
      }));
      writeBackupData(validation.backup.data);
      return loadState();
    } catch (error) {
      writeBackupData(emergencyBackup.data);
      throw error;
    }
  }

  return Object.freeze({
    persistent,
    loadState,
    saveSlice,
    createBackup,
    restoreBackup,
    parseBackupText,
    raw: storage,
  });
}
