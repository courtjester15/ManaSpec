/*
====================================
DASHBOARD MODULE
====================================

Fast scan view for portfolio, radar, signals, and notes state.
====================================
*/

function renderDashboardView() {
  const owned = getOwnedPositions();
  const totalValue = getPortfolioValue();
  const invested = getInvestedValue();
  const pl = totalValue - invested;
  const plPct = invested ? (pl / invested) * 100 : 0;
  const signalRows = getDashboardSignalRows();
  const workQueues = getDashboardWorkQueues(signalRows);

  document.getElementById("viewContainer").innerHTML = `
    <section class="dashboard-view">
      <div class="view-heading">
        <h3>Dashboard</h3>
        <p>What to inspect first today.</p>
      </div>

      <div class="metric-grid dashboard-state-grid">
        ${renderMetricTile("Cash", money(cash), { detail: "Available" })}
        ${renderMetricTile("Equity / Open P&L", `${money(cash + totalValue)} / ${formatSignedMoney(pl)}`, { tone: getDashboardValueTone(pl), detail: formatSignedPercent(plPct) })}
        ${renderMetricTile("Tracked Printings", `${owned.length + radar.length}`, { detail: `${owned.length} Positions, ${radar.length} Radar` })}
        ${renderMetricTile("Signals", `${signalRows.length} active`, { detail: "Open Signals", action: "signals" })}
      </div>

      <div class="scan-grid dashboard-work-grid">
        ${renderScanPanel("Exit Hits", workQueues.exitHits, "No exit hits.")}
        ${renderScanPanel("Entry Hits", workQueues.entryHits, "No entry hits.")}
        ${renderScanPanel("Exit Near", workQueues.exitNear, "Nothing near exit.")}
        ${renderScanPanel("Entry Near", workQueues.entryNear, "Nothing near entry.")}
        ${renderScanPanel("Market Checks Due", workQueues.marketDue, "No market checks due.")}
        ${renderScanPanel("Hold Reviews Due", workQueues.holdDue, "No hold reviews due.")}
        ${renderScanPanel("Missing Plans", workQueues.missingPlans, "Plans look filled in.")}
        ${renderScanPanel("Recent Notes", workQueues.recentNotes, "No recent notes.")}
      </div>
    </section>
  `;

  initDashboardStateActions();
  initDashboardQueueActions();
}

function renderMetricTile(label, value, options = {}) {
  const toneClass = options.tone ? ` metric-card--${options.tone}` : "";
  const tag = options.action ? "button" : "div";
  const actionAttribute = options.action ? ` type="button" data-dashboard-state-action="${escapeAttribute(options.action)}"` : "";
  return `
    <${tag}${actionAttribute} class="metric-card${toneClass}${options.action ? " metric-card--action" : ""}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${options.detail ? `<small>${escapeHtml(options.detail)}</small>` : ""}
    </${tag}>
  `;
}

function renderScanPanel(title, rows, emptyText = "No data yet") {
  const body = rows.length
    ? rows.map(row => row.action
      ? `
        <button type="button" class="scan-row dashboard-queue-row" data-dashboard-action="${escapeAttribute(row.action)}" data-dashboard-id="${escapeAttribute(row.id || "")}" data-dashboard-source="${escapeAttribute(row.source || "")}">
          <strong>${escapeHtml(row.title)}</strong>
          <span>${escapeHtml(row.detail)}</span>
        </button>
      `
      : `
        <div class="scan-row dashboard-queue-row dashboard-queue-row--static">
          <strong>${escapeHtml(row.title)}</strong>
          <span>${escapeHtml(row.detail)}</span>
        </div>
      `).join("")
    : `<div class="empty-state compact">${escapeHtml(emptyText)}</div>`;

  return `
    <section class="scan-panel">
      <h4>${escapeHtml(title)}</h4>
      ${body}
    </section>
  `;
}

function initDashboardStateActions() {
  document.querySelectorAll("[data-dashboard-state-action]").forEach(tile => {
    tile.addEventListener("click", () => {
      if (tile.dataset.dashboardStateAction === "signals" && typeof setActiveView === "function") {
        setActiveView("signals");
      }
    });
  });
}

function initDashboardQueueActions() {
  document.querySelectorAll("[data-dashboard-action]").forEach(row => {
    row.addEventListener("click", () => {
      const action = row.dataset.dashboardAction;
      const id = row.dataset.dashboardId;
      const source = row.dataset.dashboardSource;

      if (!id) return;

      if (action === "detail" && typeof openCardDetail === "function") {
        openCardDetail(id, source || "portfolio");
        return;
      }

      if (action === "notes" && typeof openCardDetail === "function") {
        openCardDetail(id, source || "portfolio", { focusNotes: true });
        return;
      }

      if (action === "source" && typeof openTrackedSource === "function") {
        openTrackedSource(source, id);
      }
    });
  });
}

function getOwnedPositions() {
  return specs.filter(spec => getDashboardNumber(spec.qty) > 0);
}

function getInvestedValue() {
  return getOwnedPositions()
    .reduce((sum, spec) => sum + getDashboardNumber(spec.buyPrice) * getDashboardNumber(spec.qty), 0);
}

function getPortfolioValue() {
  return getOwnedPositions()
    .reduce((sum, spec) => sum + getDashboardNumber(spec.currentPrice) * getDashboardNumber(spec.qty), 0);
}

function getTopPositions(direction) {
  return getOwnedPositions()
    .map(spec => ({
      title: spec.name,
      value: getPositionGainLoss(spec),
      detail: formatPositionMove(spec)
    }))
    .filter(row => direction === "gain" ? row.value > 0 : row.value < 0)
    .sort((a, b) => direction === "gain" ? b.value - a.value : a.value - b.value)
    .slice(0, 6);
}

// Preserved for post-beta review if users expect gain/loss queues on Dashboard.

function getPositionGainLoss(spec) {
  return (getDashboardNumber(spec.currentPrice) - getDashboardNumber(spec.buyPrice)) * getDashboardNumber(spec.qty);
}

function formatPositionMove(spec) {
  const gainLoss = getPositionGainLoss(spec);
  const buy = getDashboardNumber(spec.buyPrice);
  const now = getDashboardNumber(spec.currentPrice);
  const pct = buy ? ((now - buy) / buy) * 100 : 0;

  return `${formatSignedMoney(gainLoss)} / ${formatSignedPercent(pct)} / Now ${money(now)}`;
}

function formatSignedMoney(value) {
  const number = getDashboardNumber(value);
  if (number === 0) return money(0);
  const sign = number > 0 ? "+" : "-";
  return `${sign}${money(Math.abs(number))}`;
}

function formatSignedPercent(value) {
  const number = getDashboardNumber(value);
  if (number === 0) return "0.0%";
  return `${number > 0 ? "+" : ""}${number.toFixed(1)}%`;
}

function getDashboardValueTone(value) {
  const number = getDashboardNumber(value);
  if (number > 0) return "positive";
  if (number < 0) return "negative";
  return "neutral";
}

function getTargetRows(kind) {
  const tracked = [
    ...radar.map(item => ({ ...item, owned: false })),
    ...getOwnedPositions().map(item => ({ ...item, owned: true })),
  ];

  return tracked
    .map(item => {
      const state = typeof getTargetState === "function"
        ? getTargetState(item, item.owned)
        : { label: "No target" };

      return {
        title: item.name,
        state: state.label,
        detail: formatTargetDetail(item, state.label),
      };
    })
    .filter(row => {
      if (kind === "hit") return row.state === "Exit hit";
      if (kind === "entry") return row.state === "Entry hit";
      if (kind === "near") return row.state === "Exit near" || row.state === "Entry near" || row.state === "Hold near" || row.state === "Hold due";
      return false;
    })
    .slice(0, 6);
}

function getDashboardWorkQueues(signalRows) {
  return {
    exitHits: getDashboardSignalQueue(signalRows, row => row.status === "Exit hit", "Exit hit"),
    entryHits: getDashboardSignalQueue(signalRows, row => row.status === "Entry hit", "Entry hit"),
    exitNear: getDashboardSignalQueue(signalRows, row => row.status === "Exit near", "Exit near"),
    entryNear: getDashboardSignalQueue(signalRows, row => row.status === "Entry near", "Entry near"),
    marketDue: getDashboardSignalQueue(signalRows, row => row.buckets?.includes("staleChecks"), "Market check due"),
    holdDue: getDashboardSignalQueue(signalRows, row => row.status === "Hold due" || row.status === "Hold near", "Hold review due"),
    missingPlans: getDashboardSignalQueue(signalRows, row => row.buckets?.includes("noPlan"), "Missing plan"),
    recentNotes: getDashboardRecentNoteRows(),
  };
}

function getDashboardSignalQueue(rows, predicate, reason) {
  return rows
    .filter(predicate)
    .slice(0, 5)
    .map(row => formatDashboardSignalRow(row, reason));
}

function formatTargetDetail(item, state) {
  const pieces = [
    state,
    item.currentPrice ? `Now ${money(item.currentPrice)}` : "",
    item.entryTarget ? `Entry ${money(item.entryTarget)}` : "",
    item.exitTarget ? `Exit ${money(item.exitTarget)}` : "",
    item.holdTime ? `Hold ${item.holdTime}` : "",
  ].filter(Boolean);

  return pieces.join(" / ");
}

function getDashboardRadarRows() {
  return [...radar]
    .map(item => ({
      item,
      score: getDashboardRadarScore(item),
      title: item.name,
      detail: formatDashboardRadarDetail(item),
    }))
    .sort((a, b) => b.score - a.score || getDashboardRecentTimestamp(b.item) - getDashboardRecentTimestamp(a.item))
    .slice(0, 5);
}

function getDashboardRadarScore(item) {
  const market = getDashboardMarketObservation(item);
  const entryDistance = getDashboardEntryDistance(item);
  let score = 0;

  if (market) score += 100;
  if (entryDistance !== null && entryDistance <= 0) score += 80;
  if (entryDistance !== null && entryDistance <= 10) score += 45;
  if (hasDashboardPlan(item)) score += 25;
  if (typeof getTrackedNoteCount === "function" && getTrackedNoteCount(item) > 0) score += 18;
  score += Math.max(0, 14 - getDashboardAgeDays(item));

  return score;
}

function formatDashboardRadarDetail(item) {
  const market = getDashboardMarketObservation(item);
  const notes = typeof getTrackedNoteCount === "function" ? getTrackedNoteCount(item) : 0;
  const pieces = [
    formatDashboardPrintingIdentity(item),
    item.entryTarget ? `Entry ${money(item.entryTarget)}` : "No entry",
    item.currentPrice ? `Now ${money(item.currentPrice)}` : "",
    market?.marketPrice ? `TCG ${money(market.marketPrice)}` : (market ? "Market checked" : ""),
    notes ? `${notes}n` : "",
  ].filter(Boolean);

  return pieces.join(" / ");
}

function getDashboardSignalRows() {
  if (typeof getSignalAttentionRows === "function") {
    return getSignalAttentionRows();
  }

  return signals.map(signal => ({
    name: signal.name,
    status: signal.status || "Signal",
    actionLabel: signal.type || "Review",
    detail: [signal.type, signal.status].filter(Boolean).join(" / "),
  }));
}

function formatDashboardSignalRow(row, reason) {
  return {
    title: row.name || "Attention item",
    detail: reason || row.reasonLabel || row.status || "Review",
    id: row.id || "",
    source: row.source || "",
    action: row.id ? "detail" : "",
  };
}

function getDashboardRecentNoteRows() {
  const seenKeys = new Set();

  return [...cardNotes]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .filter(note => {
      const key = note.cardKey || note.cardId || `${note.cardName || ""}|${note.set_code || ""}|${note.collector_number || ""}`;
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    })
    .slice(0, 5)
    .map(note => {
      const source = getDashboardNoteSource(note);

      return {
        title: note.cardName || "General note",
        detail: ["Recent note", formatDashboardDate(note.createdAt)].filter(Boolean).join(" / "),
        id: source?.id || "",
        source: source?.source || "",
        action: source?.id ? "notes" : "",
      };
    });
}

function formatDashboardPrintingIdentity(item) {
  const number = item.collector_number ? `#${item.collector_number}` : "";
  const finish = item.foil ? "F" : "";
  return [item.set_code || item.set?.toUpperCase() || "", number, finish].filter(Boolean).join(" ");
}

function getDashboardMarketObservation(item) {
  return typeof getLatestMarketObservation === "function"
    ? getLatestMarketObservation(item.id, "tcgplayer")
    : null;
}

function getDashboardNoteSource(note) {
  if (!note) return null;

  const tracked = typeof findTrackedCardByNote === "function"
    ? findTrackedCardByNote(note)
    : null;
  if (!tracked?.id) return null;

  const source = specs.some(spec => spec.id === tracked.id) ? "portfolio" : "radar";
  return {
    id: tracked.id,
    source,
    label: source === "portfolio" ? "Position" : "Radar",
  };
}

function getDashboardEntryDistance(item) {
  const price = getDashboardNumber(item.currentPrice);
  const target = getDashboardNumber(item.entryTarget);
  if (!price || !target) return null;
  return ((price - target) / target) * 100;
}

function hasDashboardPlan(item) {
  return Boolean(
    getDashboardNumber(item.entryTarget)
    || getDashboardNumber(item.exitTarget)
    || item.holdTime
    || getDashboardNumber(item.plannedQty) > 1
  );
}

function getDashboardAgeDays(item) {
  const timestamp = getDashboardRecentTimestamp(item);
  if (!timestamp) return 999;
  return Math.floor(Math.max(0, Date.now() - timestamp) / 86400000);
}

function getDashboardRecentTimestamp(item) {
  const dateValue = item.updatedAt || item.priceUpdatedAt || item.addedDate || item.createdAt || "";
  const date = dateValue ? new Date(dateValue) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

function formatDashboardDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
  });
}

function getDashboardNumber(value) {
  if (typeof toFiniteNumber === "function") return toFiniteNumber(value);

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
