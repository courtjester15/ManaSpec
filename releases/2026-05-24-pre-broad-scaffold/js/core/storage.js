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

function loadCash(startingCash) {
  return parseFloat(localStorage.getItem("cash") || startingCash);
}

// Save state
function saveState(specs, cash, table, updateTotals) {
  localStorage.setItem("specs", JSON.stringify(specs));
  localStorage.setItem("cash", cash);

  if (table) {
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
