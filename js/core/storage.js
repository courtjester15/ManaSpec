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
