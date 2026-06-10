/*
====================================
PORTFOLIO TABLE
====================================

CUT FROM app.js:

const table = new Tabulator(...)

Handles:
- portfolio rendering
- table columns
- row formatting
- buy/sell/delete button wiring
====================================
*/

let table;

function renderPortfolioView() {
  document.getElementById("viewContainer").innerHTML = `
    <section class="portfolio-workflow">
      <div class="view-heading">
        <h3>Portfolio</h3>
        <p>Review owned positions and manage active holdings.</p>
      </div>

      <section class="add-card-panel">
        <div class="panel-heading">
          <h4>Add Card</h4>
          <p>Find a Scryfall printing to add to Radar.</p>
        </div>

        <input id="searchBox" placeholder="Find card by name...">

        <div class="add-card-results">
          <div id="searchResults" class="panel-list"></div>
          <div id="printingsView" class="panel-list"></div>
        </div>
      </section>

      <hr>

      <div class="portfolio-controls">
        <div id="portfolioPager" class="portfolio-pager"></div>
        <span id="portfolioCount" class="portfolio-count">Showing 0 of 0</span>
      </div>

      <div id="table"></div>
    </section>
  `;

  initSearch();
  initPortfolioTable();
  updatePortfolioCount();
}

function initPortfolioTable() {
  if (typeof Tabulator === "undefined") {
    document.getElementById("table").innerHTML =
      "<p>Portfolio table library failed to load. Check your internet connection and refresh.</p>";
    return;
  }

  table = new Tabulator("#table", {
    data: getPortfolioRows(),
    layout: "fitColumns",
    responsiveLayout: false,
    pagination: "local",
    paginationSize: 25,
    paginationSizeSelector: [25, 50, 100],
    paginationCounter: "rows",
    paginationElement: document.getElementById("portfolioPager"),
    columnDefaults: {
      headerSort: true,
    },

    columns: [

    { title: "SET", field: "set_code", width: 60, hozAlign: "center" },

    {
      title: "#",
      field: "collector_number",
      width: 60,
      hozAlign: "center",
      formatter: (cell) => String(cell.getValue()).padStart(3, "0")
    },

    { title: "Card", field: "name", widthGrow: 2, minWidth: 180 },

    { title: "Set Name", field: "set_name", widthGrow: 2, minWidth: 200 },

    { title: "Qty", field: "qty", width: 60, hozAlign: "center" },

    {
      title: "Buy",
      field: "buyPrice",
      width: 75,
      formatter: (cell) => `$${Number(cell.getValue() || 0).toFixed(2)}`
    },

    {
      title: "Buy Date",
      field: "buyDate",
      width: 120,
      formatter: (cell) => {
        const v = cell.getValue();
        if (!v) return "";
        return new Date(v).toLocaleDateString();
      }
    },

    {
      title: "Now",
      field: "currentPrice",
      width: 75,
      formatter: (cell) => `$${Number(cell.getValue() || 0).toFixed(2)}`
    },

    {
      title: "Value",
      field: "positionValue",
      width: 85,
      sorter: (a, b, aRow, bRow) => {
        const left = getPositionValue(aRow.getData());
        const right = getPositionValue(bRow.getData());
        return left - right;
      },
      formatter: (cell) => `$${getPositionValue(cell.getRow().getData()).toFixed(2)}`
    },

    {
      title: "P/L",
      field: "pl",
      width: 75,
      formatter: (cell) => {
        const v = parseFloat(cell.getValue() || 0);
        return `<span style="color:${v >= 0 ? 'green' : 'red'}">$${v.toFixed(2)}</span>`;
      }
    },

    {
      title: "P/L %",
      width: 80,
      hozAlign: "center",
      formatter: (cell) => {
        const row = cell.getRow().getData();

        const buy = Number(row.buyPrice || 0);
        const now = Number(row.currentPrice || 0);

        if (!buy) return "0%";

        const pct = ((now - buy) / buy) * 100;

        return `<span style="color:${pct >= 0 ? 'green' : 'red'}">
          ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%
        </span>`;
      }
    },

    { title: "Buy", formatter: "buttonTick", width: 60, hozAlign: "center", cellClick: buySpec },

    { title: "Sell", formatter: "buttonCross", width: 60, hozAlign: "center", cellClick: sellSpec },

    { title: "Del", formatter: "buttonCross", width: 60, hozAlign: "center", cellClick: deleteSpec }
    ],
  });

  table.on("tableBuilt", updatePortfolioCount);
  table.on("dataProcessed", updatePortfolioCount);
  table.on("pageLoaded", updatePortfolioCount);
  table.on("dataSorted", updatePortfolioCount);
  table.on("dataFiltered", updatePortfolioCount);
}

function updatePortfolioCount() {
  const countEl = document.getElementById("portfolioCount");
  if (!countEl) return;

  let visibleCount = getPortfolioRows().length;
  let totalCount = getPortfolioRows().length;

  if (table) {
    try {
      const visibleRows = table.getRows("visible");
      visibleCount = visibleRows.length;
      totalCount = table.getDataCount("active");
    } catch (err) {
      visibleCount = getPortfolioRows().length;
      totalCount = getPortfolioRows().length;
    }
  }

  countEl.innerText = `Showing ${visibleCount} of ${totalCount}`;
}

function getPositionValue(spec) {
  return Number(spec.currentPrice || 0) * Number(spec.qty || 0);
}

function getPortfolioRows() {
  return specs.filter(spec => Number(spec.qty || 0) > 0);
}
