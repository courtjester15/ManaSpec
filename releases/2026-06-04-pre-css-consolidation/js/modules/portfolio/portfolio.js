/*
====================================
POSITIONS TABLE
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
        <h3>Positions</h3>
        <p>Owned positions only. Radar is for watch ideas before buying.</p>
      </div>

      ${renderCardFilterControls("portfolio", "Filter Positions")}

      <div class="portfolio-controls">
        <div id="portfolioPager" class="portfolio-pager"></div>
        <span id="portfolioCount" class="portfolio-count">Showing 0 of 0</span>
      </div>

      <div id="table"></div>
    </section>
  `;

  initCardFilters("portfolio", refreshPortfolioTable);
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
    paginationSize: 15,
    paginationSizeSelector: [15, 25, 50, 100],
    paginationCounter: "rows",
    paginationElement: document.getElementById("portfolioPager"),
    columnDefaults: {
      headerSort: true,
    },

    columns: [

    { title: "Set", field: "set_code", width: 48, hozAlign: "center" },

    {
      title: "#",
      field: "collector_number",
      width: 50,
      hozAlign: "center",
      formatter: (cell) => String(cell.getValue()).padStart(3, "0")
    },

    {
      title: "Card",
      field: "name",
      widthGrow: 3,
      minWidth: 160,
      formatter: (cell) => {
        const row = cell.getRow().getData();
        const detail = [row.set_name, row.type_line].filter(Boolean).join(" / ");
        return `<button type="button" class="link-action" title="${escapeAttribute(detail)}">${cell.getValue()}</button>`;
      },
      cellClick: (e, cell) => openCardDetail(cell.getRow().getData().id, "portfolio")
    },

    {
      title: "Meta",
      width: 70,
      hozAlign: "center",
      formatter: (cell) => formatCardMeta(cell.getRow().getData())
    },

    { title: "Qty", field: "qty", width: 44, hozAlign: "center" },

    {
      title: "Buy",
      field: "buyPrice",
      width: 62,
      formatter: (cell) => `$${Number(cell.getValue() || 0).toFixed(2)}`
    },

    {
      title: "Buy Date",
      field: "buyDate",
      width: 78,
      formatter: (cell) => {
        const v = cell.getValue();
        if (!v) return "";
        return new Date(v).toLocaleDateString(undefined, {
          month: "numeric",
          day: "numeric",
          year: "2-digit"
        });
      }
    },

    {
      title: "Now",
      field: "currentPrice",
      width: 62,
      formatter: (cell) => `$${Number(cell.getValue() || 0).toFixed(2)}`
    },

    {
      title: "Value",
      field: "positionValue",
      width: 66,
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
      width: 62,
      formatter: (cell) => {
        const v = parseFloat(cell.getValue() || 0);
        return `<span style="color:${v >= 0 ? 'green' : 'red'}">$${v.toFixed(2)}</span>`;
      }
    },

    {
      title: "P/L %",
      width: 60,
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

    {
      title: "Target",
      field: "exitTarget",
      width: 64,
      editor: "number",
      editorParams: {
        min: 0,
        step: 1,
      },
      formatter: (cell) => formatOptionalTableMoney(cell.getValue()),
      cellEdited: (cell) => savePositionPlanEdit(cell, "exitTarget")
    },

    {
      title: "Hold",
      field: "holdTime",
      width: 68,
      editor: "number",
      editorParams: {
        min: 0,
        step: 1,
      },
      formatter: (cell) => formatHoldTableValue(cell.getValue()),
      cellEdited: (cell) => savePositionPlanEdit(cell, "holdTime")
    },

    { title: "+1", formatter: "buttonTick", width: 44, hozAlign: "center", cellClick: buySpec },

    { title: "Sell", formatter: "buttonCross", width: 50, hozAlign: "center", cellClick: sellSpec },

    { title: "Del", formatter: "buttonCross", width: 48, hozAlign: "center", cellClick: deleteSpec }
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

function refreshPortfolioTable() {
  if (table) {
    table.replaceData(getPortfolioRows());
  }

  updatePortfolioCount();
}

function getPositionValue(spec) {
  return Number(spec.currentPrice || 0) * Number(spec.qty || 0);
}

function getPortfolioRows() {
  return applyCardFilters(
    specs.filter(spec => Number(spec.qty || 0) > 0),
    "portfolio"
  );
}

function formatCardMeta(item) {
  const rarity = item.rarity ? item.rarity.slice(0, 1).toUpperCase() : "-";
  const color = getColorLabel(item);
  const flags = [
    item.reserved ? "RL" : "",
    item.reprint ? "RP" : "",
  ].filter(Boolean).join(" ");

  return `<span title="${item.rarity || "unknown"} ${getPrimaryType(item)}">${color} / ${rarity}${flags ? ` / ${flags}` : ""}</span>`;
}

function escapeAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatOptionalTableMoney(value) {
  const number = Number(value || 0);
  return number > 0 ? `$${Math.round(number)}` : "";
}

function formatHoldTableValue(value) {
  const months = typeof getHoldMonths === "function"
    ? getHoldMonths(value)
    : Number(String(value || "").match(/\d+/)?.[0] || 0);

  return months > 0 ? `${months} mo` : "";
}

function savePositionPlanEdit(cell, field) {
  const row = cell.getRow().getData();
  const spec = specs.find(item => item.id === row.id);
  if (!spec) return;

  if (field === "exitTarget") {
    spec.exitTarget = typeof parseWholeDollarInput === "function"
      ? parseWholeDollarInput(cell.getValue())
      : Number(cell.getValue() || 0);
  } else {
    const months = typeof parseHoldMonthsInput === "function"
      ? parseHoldMonthsInput(cell.getValue())
      : Number(cell.getValue() || 0);
    spec.holdTime = typeof formatHoldTime === "function"
      ? formatHoldTime(months)
      : (months > 0 ? `${months} mo` : "");
  }

  localStorage.setItem("specs", JSON.stringify(specs));

  if (typeof showAppNotice === "function") {
    showAppNotice(`${spec.name} ${field === "exitTarget" ? "target" : "hold time"} saved.`);
  }
}
