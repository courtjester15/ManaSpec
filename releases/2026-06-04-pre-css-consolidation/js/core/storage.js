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
function loadSpecs() {
  return JSON.parse(localStorage.getItem("specs") || "[]");
}

function loadRadar() {
  return JSON.parse(localStorage.getItem("radar") || "[]");
}

function loadSignals() {
  return JSON.parse(localStorage.getItem("signals") || "[]");
}

function loadThesisNotes() {
  return JSON.parse(localStorage.getItem("thesisNotes") || "[]");
}

function loadTransactions() {
  return JSON.parse(localStorage.getItem("transactions") || "[]");
}

function loadCash(startingCash) {
  return parseFloat(localStorage.getItem("cash") || startingCash);
}

function loadPriceRefreshStatus() {
  return JSON.parse(localStorage.getItem("priceRefreshStatus") || "null");
}

function loadMarketObservations() {
  return JSON.parse(localStorage.getItem("marketObservations") || "[]");
}

// Save state
function saveState(specs, cash, table, updateTotals) {
  localStorage.setItem("specs", JSON.stringify(specs));
  localStorage.setItem("cash", cash);

  if (table && document.getElementById("table")) {
    const tableData = typeof getPortfolioRows === "function"
      ? getPortfolioRows()
      : specs;

    table.replaceData(tableData);
  }

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
