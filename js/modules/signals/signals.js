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
    id: "targetsHit",
    label: "Targets Hit",
    detail: "Immediate buy/sell review",
  },
  {
    id: "approaching",
    label: "Approaching",
    detail: "Within 5% of target",
  },
  {
    id: "noPlan",
    label: "No Plan",
    detail: "Missing target or hold",
  },
  {
    id: "staleChecks",
    label: "Stale Checks",
    detail: "Missing or 30+ days old",
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

      ${renderSignalActionBand(rows)}

      <div class="signal-table-header">
        <div class="signal-table-title">
          <h4>${escapeHtml(getSignalTableTitle())}</h4>
          <span>${escapeHtml(getSignalTableMeta())}</span>
        </div>
      </div>
      <div id="signalsTable"></div>
    </section>
  `;

  initSignalBucketCards();
  initSignalTableTools();
  initTablePageSizeControl("signals", renderSignalsTable);
  renderSignalsTable();
}

function renderSignalActionBand(rows) {
  return `
    <section class="signals-action-band" aria-label="Signals action center">
      <div class="signals-action-tiles">
        ${SIGNAL_BUCKETS.map(bucket => renderSignalActionTile(bucket, rows)).join("")}
        ${renderSignalUtilityTile(rows)}
      </div>
    </section>
  `;
}

function renderSignalActionTile(bucket, rows) {
  const bucketRows = getRowsForSignalBucket(rows, bucket.id);
  const previewRows = getSignalBucketPreviewRows(bucketRows, bucket.id);
  const classes = [
    "signals-action-tile",
    activeSignalBucket === bucket.id ? "active" : "",
  ].filter(Boolean).join(" ");

  return `
    <button type="button" class="${classes}" data-context-action="${escapeAttribute(bucket.id)}">
      <span class="signals-action-title">${escapeHtml(bucket.label)}</span>
      <strong>${bucketRows.length}</strong>
      <small>${escapeHtml(bucket.detail)}</small>
      <div class="signals-action-preview">
        ${previewRows.length
          ? previewRows.map(renderSignalPreviewRow).join("")
          : `<em>No cards</em>`}
      </div>
    </button>
  `;
}

function renderSignalUtilityTile(rows) {
  return `
    <article class="signals-action-utility">
      <span>All Attention Signals</span>
      <strong>${rows.length}</strong>
      <button type="button" class="filter-reset-btn" id="clearSignalFilter"${activeSignalBucket ? "" : " disabled"}>Show all</button>
      ${renderTablePageSizeControl("signals")}
    </article>
  `;
}

function getSignalBucketPreviewRows(rows, bucketId) {
  return [...rows]
    .sort((a, b) => compareSignalBucketPriority(a, b, bucketId))
    .slice(0, 3);
}

function renderSignalPreviewRow(row) {
  return `
    <span class="signals-action-preview-row">
      <b>${escapeHtml(row.name)}</b>
      <small>${escapeHtml(row.previewReason || row.reasonLabel || row.status)}</small>
    </span>
  `;
}

function initSignalBucketCards() {
  document.querySelectorAll("[data-context-action]").forEach(button => {
    button.addEventListener("click", () => {
      activeSignalBucket = button.dataset.contextAction;
      renderSignalsView();
    });
  });
}

function initSignalTableTools() {
  document.getElementById("clearSignalFilter")?.addEventListener("click", () => {
    activeSignalBucket = "";
    renderSignalsView();
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

function getSignalTableMeta() {
  const filtered = getFilteredSignalRows().length;
  const total = getSignalAttentionRows().length;
  if (activeSignalBucket) return `${filtered} of ${total} signals shown`;
  return `${total} active signals`;
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
    { label: "Set", sortKey: "set_code", align: "center", value: row => row.set_code || "-", title: row => row.set_name || "" },
    { label: "#", sortKey: "collector_number", align: "center", value: row => row.collector_number ? `#${String(row.collector_number).padStart(3, "0")}` : "-" },
    { label: "Fin", sortKey: "finishLabel", align: "center", value: row => row.finishLabel },
    { label: "Source", sortKey: "source", align: "center", value: row => row.sourceLabel },
    { label: "Action", sortKey: "actionLabel", align: "center", type: "badge", badgeClass: row => getSignalActionClass(row), value: row => row.actionLabel },
    { label: "Why", sortKey: "reasonLabel", value: row => row.reasonLabel, title: row => row.reasonDetail },
    { label: "Now", sortKey: "currentPrice", align: "money", value: row => row.currentPrice ? money(row.currentPrice) : "-" },
    { label: "Target", sortKey: "targetSort", align: "money", value: row => row.relevantTarget },
    { label: "Distance", sortKey: "distanceSort", align: "center", value: row => row.distance },
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
  const defaultDirection = ["name", "set_code", "collector_number", "finishLabel", "source", "actionLabel", "reasonLabel"].includes(field) ? "asc" : "desc";
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
  const targetSignal = getSignalTargetState(item);
  const market = getSignalMarketState(item);
  const plan = getSignalPlanState(item);
  const hasPlan = !plan.missing.length;
  const hasTarget = Boolean(getRelevantSignalTarget(item));
  const hasNotes = typeof getCardNotesForItem === "function"
    ? getCardNotesForItem(item).length > 0
    : false;
  const buckets = getSignalBuckets(item, targetSignal, {
    plan,
    market,
  });

  return {
    id: item.id,
    name: item.name,
    set_code: item.set_code || "",
    set_name: item.set_name || "",
    collector_number: item.collector_number || "",
    finishLabel: getSignalFinishLabel(item),
    source: item.owned ? "portfolio" : "radar",
    sourceLabel: item.owned ? "Position" : "Radar",
    status: getSignalStatusLabel(targetSignal.status, buckets),
    actionLabel: getSignalActionLabel(item, targetSignal.status, buckets, { hasPlan, hasTarget, hasNotes }),
    reasonLabel: getSignalReasonLabel(item, targetSignal.status, buckets, { hasPlan, hasTarget, hasNotes, market, plan }),
    reasonDetail: getSignalReasonDetail(item, targetSignal.status, buckets, { hasPlan, hasTarget, hasNotes, market, plan }),
    buckets,
    detail: formatSignalTargetDetail(item, targetSignal.status, buckets),
    currentPrice: Number(item.currentPrice || 0),
    relevantTarget: formatRelevantSignalTarget(item, targetSignal.status),
    targetSort: getRelevantSignalTargetSort(item),
    distance: formatSignalDistance(item, targetSignal.status),
    distanceSort: getSignalDistanceSort(item, targetSignal.status),
    marketFreshness: market.label,
    marketDetail: market.detail,
    marketAgeSort: market.ageDays,
    previewReason: getSignalPreviewReason(item, targetSignal, plan, market, buckets),
    bucketPriority: getSignalBucketPriority(item, targetSignal, plan, market),
    priority: getSignalPriority(buckets, item, targetSignal, market, plan),
  };
}

function getSignalFinishLabel(item) {
  return item.foil ? "Foil" : "Nonfoil";
}

function getSignalActionLabel(item, status, buckets, state) {
  if (status === "Exit hit") return "SELL / Position";
  if (status === "Entry hit") return "BUY / Radar";
  if (status === "Exit near") return "REVIEW / Exit";
  if (status === "Entry near") return "REVIEW / Entry";
  if (status === "Hold due") return "REVIEW / Hold due";
  if (status === "Hold near") return "REVIEW / Hold near";
  if (!state.hasPlan) return "ADD PLAN";
  if (!state.hasTarget) return "ADD TARGET";
  if (!state.hasNotes) return "ADD NOTE";
  if (buckets.includes("staleChecks")) return item.owned ? "MARKET / Position" : "MARKET / Radar";
  return item.owned ? "REVIEW / Position" : "WATCH / Radar";
}

function getSignalReasonLabel(item, status, buckets, state) {
  if (status === "Exit hit") return "At or above exit";
  if (status === "Entry hit") return "At or below entry";
  if (status === "Exit near") return "Near exit target";
  if (status === "Entry near") return "Near entry target";
  if (status === "Hold due") return "Hold window due";
  if (status === "Hold near") return "Hold window near";
  if (buckets.includes("noPlan")) return `${state.plan.missing.join(" + ")} missing`;
  if (!state.hasTarget) return "No target price";
  if (!state.hasNotes) return "No decision note";
  if (buckets.includes("staleChecks")) return state.market.state === "missing" ? "No market check" : "Stale market check";
  return item.owned ? "Position review" : "Radar watch";
}

function getSignalReasonDetail(item, status, buckets, state) {
  const source = item.owned ? "Positions" : "Radar";
  const pieces = [
    `${source} row`,
    getSignalReasonLabel(item, status, buckets, state),
    formatSignalTargetDetail(item, status, buckets),
  ].filter(Boolean);

  if (state.market?.detail && buckets.includes("staleChecks")) {
    pieces.push(state.market.detail);
  }

  return pieces.join(" / ");
}

function getSignalBuckets(item, targetSignal, state) {
  const buckets = [];

  if (targetSignal.state === "hit") {
    buckets.push("targetsHit");
  }

  if (targetSignal.state === "approaching") {
    buckets.push("approaching");
  }

  if (state.plan.missing.length) {
    buckets.push("noPlan");
  }

  if (state.market.state === "missing" || state.market.state === "stale") {
    buckets.push("staleChecks");
  }

  return buckets;
}

function getSignalStatusLabel(status, buckets) {
  if (status && status !== "Watching") return status;
  if (buckets.includes("noPlan")) return "No plan";
  if (buckets.includes("staleChecks")) return "Market check";
  return status || "Watching";
}

function getSignalPriority(buckets, item, targetSignal, market, plan) {
  const rank = getSignalBucketPriority(item, targetSignal, plan, market);
  if (buckets.includes("targetsHit")) return rank.targetsHit;
  if (buckets.includes("approaching")) return 10 + rank.approaching / 1000;
  if (buckets.includes("noPlan")) return 20 + rank.noPlan / 1000;
  if (buckets.includes("staleChecks")) return 30 + rank.staleChecks / 1000;
  return 99;
}

function compareSignalBucketPriority(a, b, bucketId) {
  return compareStandardSortValues(a.bucketPriority?.[bucketId] ?? 9999, b.bucketPriority?.[bucketId] ?? 9999)
    || String(a.name || "").localeCompare(String(b.name || ""), undefined, { numeric: true, sensitivity: "base" });
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

function getSignalTargetState(item) {
  const price = Number(item.currentPrice || 0);
  const target = getRelevantSignalTarget(item);
  if (!price || !target) {
    return { state: "none", status: "", percent: 999, beyond: 0 };
  }

  if (item.owned) {
    if (price >= target) {
      return {
        state: "hit",
        status: "Exit hit",
        percent: 0,
        beyond: ((price - target) / target) * 100,
      };
    }

    const percent = ((target - price) / target) * 100;
    return {
      state: percent <= 5 ? "approaching" : "watching",
      status: percent <= 5 ? "Exit near" : "",
      percent,
      beyond: 0,
    };
  }

  if (price <= target) {
    return {
      state: "hit",
      status: "Entry hit",
      percent: 0,
      beyond: ((target - price) / target) * 100,
    };
  }

  const percent = ((price - target) / target) * 100;
  return {
    state: percent <= 5 ? "approaching" : "watching",
    status: percent <= 5 ? "Entry near" : "",
    percent,
    beyond: 0,
  };
}

function getSignalPlanState(item) {
  const missing = [];
  if (item.owned) {
    if (!Number(item.exitTarget || 0)) missing.push("Exit");
  } else if (!Number(item.entryTarget || 0)) {
    missing.push("Entry");
  }

  if (!getSignalHoldMonths(item)) missing.push("Hold");

  const date = getSignalPlanAgeDate(item);
  return {
    missing,
    ageSort: date ? date.getTime() : Number.MAX_SAFE_INTEGER,
  };
}

function getSignalPlanAgeDate(item) {
  const raw = item.buyDate || item.addedDate || item.priceUpdatedAt || "";
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function getSignalPreviewReason(item, targetSignal, plan, market, buckets) {
  if (buckets.includes("targetsHit")) {
    return item.owned
      ? `${targetSignal.beyond.toFixed(1)}% above exit`
      : `${targetSignal.beyond.toFixed(1)}% below entry`;
  }

  if (buckets.includes("approaching")) {
    return item.owned
      ? `${targetSignal.percent.toFixed(1)}% from exit`
      : `${targetSignal.percent.toFixed(1)}% from entry`;
  }

  if (buckets.includes("noPlan")) {
    return `${item.owned ? "Position" : "Radar"} missing ${plan.missing.join(" + ")}`;
  }

  if (buckets.includes("staleChecks")) {
    return market.state === "missing" ? "No market check" : `${market.ageDays}d since check`;
  }

  return item.owned ? "Position review" : "Radar watch";
}

function getSignalBucketPriority(item, targetSignal, plan, market) {
  return {
    targetsHit: targetSignal.state === "hit" ? -targetSignal.beyond : 9999,
    approaching: targetSignal.state === "approaching" ? targetSignal.percent : 9999,
    noPlan: plan.missing.length ? (item.owned ? 10000000000000 : 0) + plan.ageSort : 99999999999999,
    staleChecks: market.state === "missing" ? 0 : Math.min(market.ageDays, 999),
  };
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

  if (ageDays >= 30) {
    return {
      state: "stale",
      priceState: priceAgeDays > 14 ? "stale" : "ok",
      label: `${ageDays}d old`,
      detail: `Market Check saved ${ageDays} days ago`,
      ageDays,
    };
  }

  return {
    state: ageDays >= 7 ? "aging" : "fresh",
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

  if (status === "Exit hit") return "Above exit";
  if (status === "Entry hit") return "Below entry";
  return item.owned
    ? `${Math.max(0, pct).toFixed(1)}% below exit`
    : `${Math.max(0, pct).toFixed(1)}% above entry`;
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

function formatSignalTargetDetail(item, status = "", buckets = []) {
  const pieces = [
    item.owned ? "Position" : "Radar",
    status && status !== "Watching" ? status : "",
    buckets.includes("staleChecks") ? "Market check needed" : "",
    item.currentPrice ? `Now ${money(item.currentPrice)}` : "",
    item.entryTarget ? `Entry ${money(item.entryTarget)}` : "",
    item.exitTarget ? `Exit ${money(item.exitTarget)}` : "",
    item.holdTime ? `Hold ${item.holdTime}` : "",
  ].filter(Boolean);

  return pieces.join(" / ");
}

function getSignalStatusClass(row) {
  if (row.buckets.includes("targetsHit")) return "signal-pill action";
  if (row.buckets.includes("approaching")) return "signal-pill approaching";
  if (row.buckets.includes("noPlan")) return "signal-pill review";
  if (row.buckets.includes("staleChecks")) return "signal-pill market";
  return "signal-pill";
}

function getSignalActionClass(row) {
  if (row.actionLabel.startsWith("BUY") || row.actionLabel.startsWith("SELL")) return "signal-pill action";
  if (row.actionLabel.startsWith("WATCH")) return "signal-pill approaching";
  if (row.actionLabel.startsWith("MARKET")) return "signal-pill market";
  return "signal-pill review";
}

function openSignalArtPreview(row) {
  const source = findTrackedCard(row.id, row.source);
  if (source && typeof openCardArtPreview === "function") {
    openCardArtPreview(source);
    return;
  }

  openCardDetail(row.id, row.source);
}
