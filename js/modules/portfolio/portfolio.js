/*
====================================
POSITIONS
====================================

Owned positions rendered with ManaSpec-native rows.

Handles:
- portfolio rendering
- local sorting
- inline target and hold edits
- buy/sell/delete button wiring
====================================
*/

let portfolioSort = {
  field: "name",
  direction: "asc",
};
let positionSellQtyById = {};

function renderPortfolioView() {
  document.getElementById("viewContainer").innerHTML = `
    <section class="portfolio-workflow">
      <div class="view-heading">
        <h3>Positions</h3>
        <p>Owned positions only. Radar is for watch ideas before buying.</p>
      </div>

      ${renderCardFilterControls("portfolio", "Filter Positions", { metaId: "portfolioCount" })}

      <div id="portfolioTable" class="ms-table ms-table--positions"></div>
    </section>
  `;

  initCardFilters("portfolio", refreshPortfolioTable);
  refreshPortfolioTable();
}

function refreshPortfolioTable() {
  renderPortfolioRows();
  updatePortfolioCount();
}

function renderPortfolioRows() {
  const container = document.getElementById("portfolioTable");
  if (!container) return;

  const filteredRows = getSortedPortfolioRows();
  const rows = paginateStandardRows(filteredRows, "portfolio");

  renderStandardTable(container, {
    tableClass: "ms-table--positions",
    rows,
    columns: getPortfolioTableColumns(),
    sortState: portfolioSort,
    emptyText: "No owned positions match the current filters.",
    getRowId: item => item.id,
    onSort: setPortfolioSort,
    onRowClick: item => openCardDetail(item.id, "portfolio"),
    onAction: (action, item) => {
      if (action === "art") openPositionArtPreview(item);
      if (action === "buy") buySpec(item);
      if (action === "sell") sellSpec(item, null, getPositionSellQty(item));
      if (action === "sellAll") sellSpec(item, null, Number(item.qty || 0));
      if (action === "delete") deleteSpec(item);
    },
    onInputChange: (field, item, value, event) => {
      if (field === "sellQty") {
        savePositionSellQty(item.id, value, event);
        return;
      }

      savePositionPlanEdit(item.id, field, value);
    },
  });
}

function getPortfolioTableColumns() {
  return [
    { label: "Card", sortKey: "name", type: "link", action: "art", value: item => item.name, title: item => [item.set_name, item.type_line].filter(Boolean).join(" / ") },
    { label: "Set", sortKey: "set_code", align: "center", value: item => item.set_code || "", title: item => item.set_name || "" },
    { label: "#", sortKey: "collector_number", align: "center", value: item => String(item.collector_number || "").padStart(3, "0") },
    { label: "Rarity", sortKey: "rarity", align: "center", value: formatRarityLabel },
    { label: "Color", sortKey: "color", align: "center", value: getColorLabel },
    { label: "Buy", sortKey: "buyPrice", align: "money", value: item => money(item.buyPrice) },
    { label: "Now", sortKey: "currentPrice", align: "money", value: item => money(item.currentPrice) },
    { label: "Qty", sortKey: "qty", align: "number", value: item => Number(item.qty || 0) },
    { label: "Age", sortKey: "buyDate", align: "center", value: item => formatPositionAge(item.buyDate), title: item => item.buyDate ? `Buy Date ${formatTableDate(item.buyDate)}` : "" },
    { label: "Value", sortKey: "positionValue", align: "money", value: item => money(getPositionValue(item)) },
    { label: "P/L", sortKey: "pl", align: "money", className: item => getGainLossClass(Number(item.pl || 0)), value: item => money(Number(item.pl || 0)) },
    { label: "P/L %", sortKey: "plPct", align: "money", className: item => getGainLossClass(getPositionPlPct(item)), value: item => formatPercent(getPositionPlPct(item)) },
    { label: "Target", sortKey: "exitTarget", align: "money", type: "input", name: "exitTarget", inputAttrs: 'inputmode="numeric" pattern="[0-9]*"', value: item => formatPlanInputValue(item.exitTarget) },
    { label: "Hold", sortKey: "holdTime", align: "center", type: "inputWithSuffix", name: "holdTime", inputAttrs: 'inputmode="numeric" pattern="[0-9]*"', suffix: "mo", value: item => getHoldMonthsInputValue(item.holdTime) },
    { label: "Sell Qty", align: "center", type: "stepper", name: "sellQty", min: 1, step: 1, value: getPositionSellQty },
    {
      label: "Actions",
      align: "actions",
      type: "actions",
      actions: [
        { label: "Buy", action: "buy" },
        { label: "Sell", action: "sell" },
        { label: "All", action: "sellAll" },
        { label: "Del", action: "delete", className: "danger" },
      ],
    },
  ];
}

function setPortfolioSort(field) {
  const defaultDirection = ["name", "set_code", "collector_number", "rarity", "color"].includes(field) ? "asc" : "desc";
  updateStandardSort(portfolioSort, field, defaultDirection);
  refreshPortfolioTable();
}

function getSortedPortfolioRows() {
  const rows = getPortfolioRows();
  const direction = portfolioSort.direction === "asc" ? 1 : -1;

  return rows.sort((a, b) => comparePortfolioSortValue(a, b, portfolioSort.field) * direction);
}

function comparePortfolioSortValue(a, b, field) {
  const left = getPortfolioSortValue(a, field);
  const right = getPortfolioSortValue(b, field);

  if (typeof left === "number" || typeof right === "number") {
    return Number(left || 0) - Number(right || 0);
  }

  return String(left || "").localeCompare(String(right || ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getPortfolioSortValue(item, field) {
  if (field === "color") return getColorLabel(item);
  if (field === "positionValue") return getPositionValue(item);
  if (field === "plPct") return getPositionPlPct(item);
  if (field === "holdTime") return getHoldMonthsInputValue(item.holdTime);
  if (field === "buyDate") return item.buyDate || "";
  return item[field];
}

function updatePortfolioCount() {
  const countEl = document.getElementById("portfolioCount");
  if (!countEl) return;

  const filteredRows = getPortfolioRows();
  const shown = getStandardTableShownCount(filteredRows, "portfolio");
  const filtered = filteredRows.length;
  const total = specs.filter(spec => Number(spec.qty || 0) > 0).length;
  countEl.innerText = filtered > shown
    ? `${shown} shown / ${filtered} of ${total}`
    : `Showing ${filtered} of ${total}`;
}

function getPortfolioItem(id) {
  return specs.find(item => item.id === id);
}

function getPositionValue(spec) {
  return Number(spec.currentPrice || 0) * Number(spec.qty || 0);
}

function openPositionArtPreview(item) {
  if (typeof openCardArtPreview === "function") {
    openCardArtPreview(item);
    return;
  }

  openCardDetail(item.id, "portfolio");
}

function getPositionPlPct(spec) {
  const buy = Number(spec.buyPrice || 0);
  const now = Number(spec.currentPrice || 0);
  if (!buy) return 0;
  return ((now - buy) / buy) * 100;
}

function getPositionSellQty(spec) {
  const ownedQty = Math.max(1, Number(spec.qty || 0));
  const savedQty = Number(positionSellQtyById[spec.id] || 1);
  return Math.min(ownedQty, Math.max(1, savedQty));
}

function savePositionSellQty(id, value, event) {
  const spec = getPortfolioItem(id);
  if (!spec) return;

  const ownedQty = Math.max(1, Number(spec.qty || 0));
  const requestedQty = Number(String(value || "").replace(/[^\d]/g, "") || 1);
  const nextQty = Math.min(ownedQty, Math.max(1, requestedQty));
  positionSellQtyById[id] = nextQty;

  if (event?.target) {
    event.target.value = String(nextQty);
  }
}

function getPortfolioRows() {
  return applyCardFilters(
    specs.filter(spec => Number(spec.qty || 0) > 0),
    "portfolio"
  );
}

function formatRarityLabel(item) {
  if (!item.rarity) return "-";
  return item.rarity.slice(0, 1).toUpperCase();
}

function formatTableDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  });
}

function formatPositionAge(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "-";

  const ageDays = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (ageDays <= 30) return `${ageDays}d`;
  if (ageDays <= 84) return `${Math.ceil(ageDays / 7)}w`;
  return `${Math.ceil(ageDays / 28)}m`;
}

function formatPercent(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : ""}${number.toFixed(1)}%`;
}

function formatPlanInputValue(value) {
  const number = Number(value || 0);
  return number > 0 ? Math.round(number) : "";
}

function getHoldMonthsInputValue(value) {
  if (typeof getHoldMonths === "function") {
    const rawValue = String(value || "").trim();
    if (rawValue.includes("-")) return rawValue.replace(/\s*mo(?:nths?)?$/i, "");
    return getHoldMonths(value) || "";
  }

  const match = String(value || "").match(/\d+(?:\s*-\s*\d+)?/);
  return match ? match[0].replace(/\s+/g, "") : "";
}

function getGainLossClass(value) {
  return Number(value || 0) >= 0 ? "value-positive" : "value-negative";
}

function savePositionPlanEdit(id, field, value) {
  const spec = getPortfolioItem(id);
  if (!spec) return;

  if (field === "exitTarget") {
    spec.exitTarget = typeof parseWholeDollarInput === "function"
      ? parseWholeDollarInput(value)
      : Number(value || 0);
  } else {
    const rawValue = String(value || "").trim();
    if (/^\d+\s*-\s*\d+$/.test(rawValue)) {
      spec.holdTime = `${rawValue.replace(/\s+/g, "")} mo`;
    } else {
      const months = typeof parseHoldMonthsInput === "function"
        ? parseHoldMonthsInput(rawValue)
        : Number(rawValue || 0);
      spec.holdTime = typeof formatHoldTime === "function"
        ? formatHoldTime(months)
        : (months > 0 ? `${months} mo` : "");
    }
  }

  localStorage.setItem("specs", JSON.stringify(specs));
  refreshPortfolioTable();

  if (typeof showAppNotice === "function") {
    showAppNotice(`${spec.name} ${field === "exitTarget" ? "target" : "hold"} saved.`);
  }
}

function escapeAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
