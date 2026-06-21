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

function renderPortfolioView(options = {}) {
  document.getElementById("viewContainer").innerHTML = `
    <section class="portfolio-workflow">
      <div class="view-heading">
        <h3>Positions</h3>
        <p>Owned positions only. Radar is for watch ideas before buying.</p>
      </div>

      ${renderModuleContextBand(getPortfolioContextCards(), { label: "Positions context" })}

      ${renderCardFilterControls("portfolio", "Filter Positions", { metaId: "portfolioCount" })}

      <div id="portfolioTable" class="ms-table ms-table--positions"></div>
    </section>
  `;

  initCardFilters("portfolio", refreshPortfolioTable);
  if (options.filterToId) {
    setExactCardFilter("portfolio", options.filterToId, options.filterLabel || "");
  }
  refreshPortfolioTable();
}

function getPortfolioContextCards() {
  const positions = specs.filter(spec => Number(spec.qty || 0) > 0);
  const portfolioValue = positions.reduce((total, spec) => total + getPositionValue(spec), 0);
  const capitalDeployed = positions.reduce((total, spec) => total + (Number(spec.buyPrice || 0) * Number(spec.qty || 0)), 0);
  const notesCount = positions.reduce((total, spec) => total + getTrackedNoteCount(spec), 0);

  return [
    {
      label: "Portfolio Value",
      value: money(portfolioValue),
      detail: "Current marked value",
      preview: `${positions.length} owned rows`,
    },
    {
      label: "Capital Deployed",
      value: money(capitalDeployed),
      detail: "Open position cost basis",
      preview: "Owned portfolio state",
    },
    {
      label: "Open Positions",
      value: positions.length,
      detail: "Cards currently owned",
      preview: positions[0]?.name || "No open positions",
    },
    {
      label: "Notes",
      value: notesCount,
      detail: "Linked decision notes",
      preview: notesCount ? "Context attached" : "No notes yet",
    },
  ];
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
      if (action === "notes") openCardDetail(item.id, "portfolio", { focusNotes: true });
      if (action === "buy") buySpec(item);
      if (action === "sell") sellSpec(item);
      if (action === "delete") deleteSpec(item);
    },
    onInputChange: (field, item, value, event) => {
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
    { label: "Buy", sortKey: "buyPrice", align: "money", value: item => tableMoney(item.buyPrice) },
    { label: "Now", sortKey: "currentPrice", align: "money", value: item => tableMoney(item.currentPrice), title: formatPositionScryfallPriceTitle },
    { label: "Qty", sortKey: "qty", align: "center", value: item => Number(item.qty || 0) },
    { label: "Age", sortKey: "buyDate", align: "center", value: item => formatPositionAge(item.buyDate), title: item => item.buyDate ? `Buy Date ${formatTableDate(item.buyDate)}` : "" },
    { label: "Value", sortKey: "positionValue", align: "money", value: item => tableMoney(getPositionValue(item)) },
    { label: "P/L", sortKey: "pl", align: "money", className: item => getGainLossClass(Number(item.pl || 0)), value: item => tableMoney(Number(item.pl || 0)) },
    { label: "P/L %", sortKey: "plPct", align: "money", className: item => getGainLossClass(getPositionPlPct(item)), value: item => formatPercent(getPositionPlPct(item)) },
    { label: "Target", sortKey: "exitTarget", align: "money", type: "editable", name: "exitTarget", inputAttrs: 'inputmode="decimal" pattern="[0-9$,.]*"', placeholder: "Set", value: item => formatPlanInputValue(item.exitTarget), displayValue: item => formatTargetDisplayValue(item.exitTarget) },
    { label: "Δ", sortKey: "exitDistance", align: "money", className: getPositionExitDistanceClass, value: formatPositionExitDistance, title: formatPositionExitDistanceTitle },
    { label: "Hold", sortKey: "holdTime", align: "center", type: "editableWithSuffix", name: "holdTime", inputAttrs: 'inputmode="numeric" pattern="[0-9-]*" title="Examples: 3, 6-12, 12-18 months"', placeholder: "Set", suffix: "mo", value: item => getHoldMonthsInputValue(item.holdTime) },
    { label: "Notes", align: "center", html: renderNotesTableControl },
    {
      label: "Actions",
      align: "actions",
      type: "actions",
      actions: [
        { label: "Buy", action: "buy" },
        { label: "Sell", action: "sell" },
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
  if (field === "exitDistance") return getPositionExitDistanceSort(item);
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
  if (filtered < total) {
    countEl.innerText = shown < filtered
      ? `Showing ${shown} of ${filtered} filtered / ${total} total`
      : `Showing ${filtered} filtered / ${total} total`;
    return;
  }

  countEl.innerText = shown < total
    ? `Showing ${shown} of ${total} positions`
    : `Showing ${total} ${total === 1 ? "position" : "positions"}`;
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

function getPositionExitDistanceValue(item) {
  const price = Number(item.currentPrice || 0);
  const target = Number(item.exitTarget || 0);
  if (!price || !target) return null;

  return {
    dollars: price - target,
    percent: ((price - target) / target) * 100,
  };
}

function formatPositionExitDistance(item) {
  const distance = getPositionExitDistanceValue(item);
  return distance ? formatPercent(distance.percent) : "-";
}

function formatPositionExitDistanceTitle(item) {
  const distance = getPositionExitDistanceValue(item);
  if (!distance) return "No exit target";
  return `${formatPortfolioSignedMoney(distance.dollars)} vs exit`;
}

function getPositionExitDistanceSort(item) {
  const distance = getPositionExitDistanceValue(item);
  return distance ? distance.percent : -9999;
}

function getPositionExitDistanceClass(item) {
  const distance = getPositionExitDistanceValue(item);
  if (!distance) return "target-distance neutral";
  return distance.percent >= 0 ? "target-distance good" : "target-distance bad";
}

function formatPortfolioSignedMoney(value) {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : "-"}${money(Math.abs(number))}`;
}

function formatPlanInputValue(value) {
  return typeof formatTargetInputNumber === "function"
    ? formatTargetInputNumber(value)
    : "";
}

function formatPositionScryfallPriceTitle(item) {
  const detail = item.priceUpdatedAt
    ? `updated ${new Date(item.priceUpdatedAt).toLocaleString()}`
    : "not refreshed this session";
  return `Scryfall price snapshot, ${detail}`;
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
    const exitTarget = typeof parseWholeDollarInput === "function"
      ? parseWholeDollarInput(value)
      : Number(value || 0);
    if (exitTarget === null) {
      if (typeof showAppNotice === "function") {
        showAppNotice("Use numbers, $, commas, or decimals for target.", "warning");
      }
      refreshPortfolioTable();
      return;
    }

    spec.exitTarget = exitTarget;
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
    showAppNotice(`${spec.name} ${field === "exitTarget" ? "target" : "hold"} saved.`, "save");
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
