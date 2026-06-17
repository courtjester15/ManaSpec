/*
====================================
SIGNALS MODULE
====================================

Attention manager for tracked cards.
====================================
*/

let signalsSort = {
  field: "priority",
  direction: "asc",
};

let activeSignalBucket = "";

const SIGNAL_BUCKETS = [
  {
    id: "needsAction",
    label: "Needs Action",
    detail: "Plan says act now",
  },
  {
    id: "approaching",
    label: "Approaching",
    detail: "May need review soon",
  },
  {
    id: "needsReview",
    label: "Needs Review",
    detail: "Missing decision context",
  },
  {
    id: "marketData",
    label: "Market Data",
    detail: "Needs fresh market context",
  },
];

function renderSignalsView() {
  const rows = getSignalAttentionRows();
  document.getElementById("viewContainer").innerHTML = `
    <section class="module-view">
      <div class="view-heading">
        <h3>Signals</h3>
        <p>What needs attention today across Radar and Positions.</p>
      </div>

      ${renderModuleContextBand(getSignalContextCards(rows), { label: "Signals context" })}

      <div class="signal-table-header">
        <h4>${escapeHtml(getSignalTableTitle())}</h4>
        ${renderTablePageSizeControl("signals")}
      </div>
      <div id="signalsTable"></div>
    </section>
  `;

  initSignalBucketCards();
  initTablePageSizeControl("signals", renderSignalsTable);
  renderSignalsTable();
}

function getSignalContextCards(rows) {
  return SIGNAL_BUCKETS.map(bucket => renderSignalBucketCard(bucket, rows));
}

function renderSignalBucketCard(bucket, rows) {
  const bucketRows = getRowsForSignalBucket(rows, bucket.id);
  const first = bucketRows[0];
  const preview = first
    ? `${first.name} - ${first.status}`
    : "No cards";

  return {
    label: bucket.label,
    value: bucketRows.length,
    detail: bucket.detail,
    preview,
    action: bucket.id,
    active: activeSignalBucket === bucket.id,
  };
}

function initSignalBucketCards() {
  document.querySelectorAll("[data-context-action]").forEach(button => {
    button.addEventListener("click", () => {
      activeSignalBucket = activeSignalBucket === button.dataset.contextAction
        ? ""
        : button.dataset.contextAction;
      renderSignalsView();
    });
  });
}

function renderSignalsTable() {
  const rows = paginateStandardRows(getSortedSignalRows(getFilteredSignalRows()), "signals");

  renderStandardTable(document.getElementById("signalsTable"), {
    tableClass: "ms-table--signals signal-plan-table",
    rows,
    columns: getSignalTableColumns(),
    sortState: signalsSort,
    emptyText: "No Signals rows match this attention bucket.",
    getRowId: row => row.id,
    onSort: setSignalsSort,
    onRowClick: row => openCardDetail(row.id, row.source),
    onAction: (action, row) => {
      if (action === "art") openSignalArtPreview(row);
      if (action === "detail") openCardDetail(row.id, row.source);
      if (action === "view") openTrackedSource(row.source, row.id);
    },
  });
}

function getSignalTableTitle() {
  const bucket = SIGNAL_BUCKETS.find(item => item.id === activeSignalBucket);
  return bucket ? bucket.label : "All Attention Signals";
}

function getFilteredSignalRows() {
  const rows = getSignalAttentionRows();
  if (!activeSignalBucket) return rows;
  return getRowsForSignalBucket(rows, activeSignalBucket);
}

function getRowsForSignalBucket(rows, bucketId) {
  return rows.filter(row => row.buckets.includes(bucketId));
}

function getSignalTableColumns() {
  return [
    { label: "Card", sortKey: "name", type: "link", action: "art", value: row => row.name, title: row => row.detail },
    { label: "Source", sortKey: "source", align: "center", value: row => row.sourceLabel },
    { label: "Now", sortKey: "currentPrice", align: "money", value: row => row.currentPrice ? money(row.currentPrice) : "-" },
    { label: "Target", sortKey: "targetSort", align: "money", value: row => row.relevantTarget },
    { label: "Distance", sortKey: "distanceSort", align: "center", value: row => row.distance },
    { label: "Signal", sortKey: "status", align: "center", type: "badge", badgeClass: row => getSignalStatusClass(row), value: row => row.status },
    { label: "Market", sortKey: "marketAgeSort", align: "center", value: row => row.marketFreshness, title: row => row.marketDetail },
    {
      label: "Actions",
      align: "actions",
      type: "actions",
      actions: [
        { label: "Detail", action: "detail" },
        { label: "View", action: "view" },
      ],
    },
  ];
}

function setSignalsSort(field) {
  const defaultDirection = ["name", "source", "status"].includes(field) ? "asc" : "desc";
  updateStandardSort(signalsSort, field, defaultDirection);
  renderSignalsTable();
}

function getSortedSignalRows(rows) {
  return sortRowsByField(rows, signalsSort, row => row[signalsSort.field]);
}

function getSignalAttentionRows() {
  return getTrackedSignalCards()
    .map(buildSignalAttentionRow)
    .filter(row => row.buckets.length)
    .sort(compareSignalPriority);
}

function buildSignalAttentionRow(item) {
  const targetState = typeof getTargetState === "function"
    ? getTargetState(item, item.owned)
    : { label: "No target" };
  const market = getSignalMarketState(item);
  const hasPlan = hasSignalPlan(item);
  const hasTarget = hasSignalTarget(item);
  const hasThesis = typeof getThesisNotesForCard === "function"
    ? getThesisNotesForCard(item.id).length > 0
    : false;
  const buckets = getSignalBuckets(item, targetState.label, {
    hasPlan,
    hasTarget,
    hasThesis,
    market,
  });

  return {
    id: item.id,
    name: item.name,
    source: item.owned ? "portfolio" : "radar",
    sourceLabel: item.owned ? "Position" : "Radar",
    status: getSignalStatusLabel(targetState.label, buckets),
    buckets,
    detail: formatSignalTargetDetail(item),
    currentPrice: Number(item.currentPrice || 0),
    relevantTarget: formatRelevantSignalTarget(item, targetState.label),
    targetSort: getRelevantSignalTargetSort(item),
    distance: formatSignalDistance(item, targetState.label),
    distanceSort: getSignalDistanceSort(item, targetState.label),
    marketFreshness: market.label,
    marketDetail: market.detail,
    marketAgeSort: market.ageDays,
    priority: getSignalPriority(buckets, item, targetState.label, market),
  };
}

function getSignalBuckets(item, status, state) {
  const buckets = [];

  if (status === "Exit hit" || status === "Entry hit" || status === "Hold due") {
    buckets.push("needsAction");
  }

  if (status === "Exit near" || status === "Entry near" || status === "Hold near") {
    buckets.push("approaching");
  }

  if (!state.hasPlan || !state.hasTarget || !state.hasThesis) {
    buckets.push("needsReview");
  }

  if (state.market.state === "missing" || state.market.state === "stale" || state.market.priceState === "stale") {
    buckets.push("marketData");
  }

  return buckets;
}

function getSignalStatusLabel(status, buckets) {
  if (status && status !== "Watching") return status;
  if (buckets.includes("needsReview")) return "Needs review";
  if (buckets.includes("marketData")) return "Market check";
  return status || "Watching";
}

function getSignalPriority(buckets, item, status, market) {
  if (buckets.includes("needsAction")) return 0 + getSignalDistanceSort(item, status) / 1000;
  if (buckets.includes("approaching")) return 10 + getSignalDistanceSort(item, status) / 1000;
  if (buckets.includes("needsReview")) return 20;
  if (buckets.includes("marketData")) return 30 + Math.min(market.ageDays, 999) / 1000;
  return 99;
}

function compareSignalPriority(a, b) {
  return compareStandardSortValues(a.priority, b.priority)
    || String(a.name || "").localeCompare(String(b.name || ""), undefined, { numeric: true, sensitivity: "base" });
}

function getTrackedSignalCards() {
  return [
    ...specs
      .filter(spec => Number(spec.qty || 0) > 0)
      .map(spec => ({ ...spec, owned: true })),
    ...radar.map(item => ({ ...item, owned: false })),
  ];
}

function hasSignalPlan(item) {
  return Boolean(Number(item.entryTarget || 0) || Number(item.exitTarget || 0) || getSignalHoldMonths(item));
}

function hasSignalTarget(item) {
  return Boolean(Number(item.entryTarget || 0) || Number(item.exitTarget || 0));
}

function getSignalMarketState(item) {
  const observation = typeof getLatestMarketObservation === "function"
    ? getLatestMarketObservation(item.id, "tcgplayer")
    : null;
  const checkedAt = observation?.checkedAt ? new Date(observation.checkedAt) : null;
  const ageDays = checkedAt && !Number.isNaN(checkedAt.getTime())
    ? Math.floor(Math.max(0, Date.now() - checkedAt.getTime()) / 86400000)
    : 9999;
  const priceAgeDays = getSignalPriceAgeDays(item);

  if (!observation?.checkedAt) {
    return {
      state: "missing",
      priceState: priceAgeDays > 14 ? "stale" : "ok",
      label: "No check",
      detail: "No saved TCGplayer Market Check",
      ageDays,
    };
  }

  if (ageDays > 60) {
    return {
      state: "stale",
      priceState: priceAgeDays > 14 ? "stale" : "ok",
      label: `${ageDays}d old`,
      detail: `Market Check saved ${ageDays} days ago`,
      ageDays,
    };
  }

  return {
    state: ageDays > 30 ? "aging" : "recent",
    priceState: priceAgeDays > 14 ? "stale" : "ok",
    label: ageDays <= 0 ? "Today" : `${ageDays}d old`,
    detail: `Market Check saved ${ageDays <= 0 ? "today" : `${ageDays} days ago`}`,
    ageDays,
  };
}

function getSignalPriceAgeDays(item) {
  if (!item.priceUpdatedAt) return 9999;
  const date = new Date(item.priceUpdatedAt);
  if (Number.isNaN(date.getTime())) return 9999;
  return Math.floor(Math.max(0, Date.now() - date.getTime()) / 86400000);
}

function formatRelevantSignalTarget(item, status) {
  if (status === "Hold due" || status === "Hold near") {
    const months = getSignalHoldMonths(item);
    return months ? `${months} mo` : "-";
  }

  const target = getRelevantSignalTarget(item);
  return target ? money(target) : "-";
}

function getRelevantSignalTargetSort(item) {
  if (item.owned) return Number(item.exitTarget || 0);
  return Number(item.entryTarget || 0);
}

function getRelevantSignalTarget(item) {
  if (item.owned) return Number(item.exitTarget || 0);
  return Number(item.entryTarget || 0);
}

function formatSignalDistance(item, status) {
  if (status === "Hold due" || status === "Hold near") {
    return formatSignalHoldDistance(item);
  }

  const price = Number(item.currentPrice || 0);
  const target = getRelevantSignalTarget(item);
  if (!price || !target) return "-";

  const pct = item.owned
    ? ((target - price) / target) * 100
    : ((price - target) / target) * 100;

  if (status === "Exit hit" || status === "Entry hit") return "Hit";
  return `${Math.max(0, pct).toFixed(1)}%`;
}

function getSignalDistanceSort(item, status) {
  if (status === "Hold due" || status === "Hold near") {
    return getSignalHoldDaysRemaining(item);
  }

  const price = Number(item.currentPrice || 0);
  const target = getRelevantSignalTarget(item);
  if (!price || !target) return 999;

  if (item.owned) return Math.max(0, ((target - price) / target) * 100);
  return Math.max(0, ((price - target) / target) * 100);
}

function formatSignalHoldDistance(item) {
  const days = getSignalHoldDaysRemaining(item);
  if (days === 999) return "-";
  if (days <= 0) return "Due";
  return `${days}d`;
}

function getSignalHoldDaysRemaining(item) {
  const months = getSignalHoldMonths(item);
  const startDate = typeof getPlanStartDate === "function" ? getPlanStartDate(item) : null;
  if (!months || !startDate) return 999;

  const targetMs = months * 30 * 86400000;
  const ageMs = Date.now() - startDate.getTime();
  return Math.ceil((targetMs - ageMs) / 86400000);
}

function getSignalHoldMonths(item) {
  if (typeof getHoldMonths === "function") return getHoldMonths(item.holdTime);
  const match = String(item.holdTime || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function formatSignalTargetDetail(item) {
  const pieces = [
    item.owned ? "Position" : "Radar",
    item.currentPrice ? `Now ${money(item.currentPrice)}` : "",
    item.entryTarget ? `Entry ${money(item.entryTarget)}` : "",
    item.exitTarget ? `Exit ${money(item.exitTarget)}` : "",
    item.holdTime ? `Hold ${item.holdTime}` : "",
  ].filter(Boolean);

  return pieces.join(" / ");
}

function getSignalStatusClass(row) {
  if (row.buckets.includes("needsAction")) return "signal-pill action";
  if (row.buckets.includes("approaching")) return "signal-pill approaching";
  if (row.buckets.includes("needsReview")) return "signal-pill review";
  if (row.buckets.includes("marketData")) return "signal-pill market";
  return "signal-pill";
}

function openSignalArtPreview(row) {
  const source = findTrackedCard(row.id, row.source);
  if (source && typeof openCardArtPreview === "function") {
    openCardArtPreview(source);
    return;
  }

  openCardDetail(row.id, row.source);
}
