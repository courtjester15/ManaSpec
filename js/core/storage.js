/*
====================================
STORAGE SYSTEM
====================================

Handles:
- saving specs + cash to localStorage
- loading persisted state
- future export/import support
====================================
*/

// Load state
function loadJsonValue(key, fallback) {
  const rawValue = localStorage.getItem(key);
  if (rawValue === null) return fallback;

  try {
    return JSON.parse(rawValue);
  } catch (err) {
    console.warn(`Could not parse localStorage key "${key}". Using fallback value.`, err);
    return fallback;
  }
}

function loadJsonArray(key) {
  const value = loadJsonValue(key, []);
  if (Array.isArray(value)) return value;

  console.warn(`localStorage key "${key}" was not an array. Using empty list.`);
  return [];
}

function loadSpecs() {
  return loadJsonArray("specs");
}

function loadRadar() {
  return loadJsonArray("radar");
}

function loadSignals() {
  return loadJsonArray("signals");
}

function loadThesisNotes() {
  return loadJsonArray("thesisNotes");
}

function loadTransactions() {
  return loadJsonArray("transactions");
}

function loadCash(startingCash) {
  const startingValue = Number(startingCash || 0);
  const fallback = Number.isFinite(startingValue) ? startingValue : 0;
  const value = parseFloat(localStorage.getItem("cash"));
  return Number.isFinite(value) ? value : fallback;
}

function loadPriceRefreshStatus() {
  const status = loadJsonValue("priceRefreshStatus", null);
  return status && typeof status === "object" ? status : null;
}

function loadMarketObservations() {
  return loadJsonArray("marketObservations");
}

const MANASPEC_BACKUP_SCHEMA = "manaspec-localstorage-backup";
const MANASPEC_BACKUP_SCHEMA_VERSION = 1;
const MANASPEC_BACKUP_APP_VERSION = "1.0.0-beta";
const MANASPEC_BACKUP_ARRAY_KEYS = [
  "specs",
  "radar",
  "transactions",
  "thesisNotes",
  "signals",
  "priceSnapshots",
  "marketObservations",
];
const MANASPEC_PRE_IMPORT_BACKUP_KEY = "manaspec_pre_import_backup";

function createManaSpecBackup() {
  const data = readManaSpecBackupData();

  return {
    app: "ManaSpec",
    schema: MANASPEC_BACKUP_SCHEMA,
    schemaVersion: MANASPEC_BACKUP_SCHEMA_VERSION,
    appVersion: MANASPEC_BACKUP_APP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
    counts: buildManaSpecBackupCounts(data),
  };
}

function readManaSpecBackupData() {
  return {
    specs: loadSpecs(),
    radar: loadRadar(),
    transactions: loadTransactions(),
    thesisNotes: loadThesisNotes(),
    signals: loadSignals(),
    cash: loadCash(typeof startingCash !== "undefined" ? startingCash : 10000),
    priceSnapshots: typeof loadPriceSnapshots === "function" ? loadPriceSnapshots() : loadJsonArray("priceSnapshots"),
    priceRefreshStatus: loadPriceRefreshStatus() || {},
    marketObservations: loadMarketObservations(),
  };
}

function buildManaSpecBackupCounts(data) {
  return {
    positions: data.specs.length,
    radar: data.radar.length,
    transactions: data.transactions.length,
    thesisNotes: data.thesisNotes.length,
    signals: data.signals.length,
    priceSnapshots: data.priceSnapshots.length,
    marketObservations: data.marketObservations.length,
  };
}

function parseManaSpecBackupText(text) {
  let backup;

  try {
    backup = JSON.parse(text);
  } catch (err) {
    return {
      ok: false,
      message: "That file is not valid JSON.",
      error: err,
    };
  }

  return normalizeManaSpecBackup(backup);
}

function normalizeManaSpecBackup(backup) {
  if (!backup || typeof backup !== "object") {
    return {
      ok: false,
      message: "That file does not look like a ManaSpec backup.",
    };
  }

  if (backup.app !== "ManaSpec" && backup.schema !== MANASPEC_BACKUP_SCHEMA) {
    return {
      ok: false,
      message: "That file does not look like a ManaSpec backup.",
    };
  }

  if (!backup.data || typeof backup.data !== "object" || Array.isArray(backup.data)) {
    return {
      ok: false,
      message: "Backup could not be imported. No data was changed.",
    };
  }

  const data = {};

  for (const key of MANASPEC_BACKUP_ARRAY_KEYS) {
    const value = backup.data[key];
    if (value === undefined || value === null) {
      data[key] = [];
      continue;
    }

    if (!Array.isArray(value)) {
      return {
        ok: false,
        message: `Backup field "${key}" was not in the expected format. No data was changed.`,
      };
    }

    data[key] = value;
  }

  const cash = Number(backup.data.cash);
  data.cash = Number.isFinite(cash)
    ? cash
    : loadCash(typeof startingCash !== "undefined" ? startingCash : 10000);

  const status = backup.data.priceRefreshStatus;
  data.priceRefreshStatus = status && typeof status === "object" && !Array.isArray(status)
    ? status
    : {};

  const normalized = {
    app: "ManaSpec",
    schema: MANASPEC_BACKUP_SCHEMA,
    schemaVersion: Number(backup.schemaVersion || MANASPEC_BACKUP_SCHEMA_VERSION),
    appVersion: backup.appVersion || "",
    exportedAt: backup.exportedAt || "",
    data,
    counts: buildManaSpecBackupCounts(data),
  };

  return {
    ok: true,
    backup: normalized,
  };
}

function restoreManaSpecBackup(normalizedBackup) {
  const validation = normalizeManaSpecBackup(normalizedBackup);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const data = validation.backup.data;
  const emergencyBackup = createManaSpecBackup();

  try {
    localStorage.setItem(MANASPEC_PRE_IMPORT_BACKUP_KEY, JSON.stringify({
      createdAt: new Date().toISOString(),
      reason: "pre-import",
      backup: emergencyBackup,
    }));

    MANASPEC_BACKUP_ARRAY_KEYS.forEach(key => {
      localStorage.setItem(key, JSON.stringify(data[key]));
    });
    localStorage.setItem("cash", String(data.cash));
    localStorage.setItem("priceRefreshStatus", JSON.stringify(data.priceRefreshStatus || {}));
  } catch (err) {
    restoreManaSpecBackupData(emergencyBackup.data);
    throw err;
  }
}

function restoreManaSpecBackupData(data) {
  MANASPEC_BACKUP_ARRAY_KEYS.forEach(key => {
    localStorage.setItem(key, JSON.stringify(Array.isArray(data[key]) ? data[key] : []));
  });
  localStorage.setItem("cash", String(Number.isFinite(Number(data.cash)) ? Number(data.cash) : 10000));
  localStorage.setItem("priceRefreshStatus", JSON.stringify(data.priceRefreshStatus || {}));
}

// Save state
function saveState(specs, cash, updateTotals) {
  localStorage.setItem("specs", JSON.stringify(specs));
  localStorage.setItem("cash", cash);

  updateTotals();
}

function saveRadarState(radar) {
  localStorage.setItem("radar", JSON.stringify(radar));

  if (typeof renderRadarItems === "function") {
    renderRadarItems();
  }
}

function saveSignalsState(signals) {
  localStorage.setItem("signals", JSON.stringify(signals));
}

function saveThesisState(thesisNotes) {
  localStorage.setItem("thesisNotes", JSON.stringify(thesisNotes));
}

function saveTransactionsState(transactions) {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function saveMarketObservations(observations) {
  localStorage.setItem("marketObservations", JSON.stringify(observations));
}
