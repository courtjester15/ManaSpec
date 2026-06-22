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
  const approachingRows = getTargetRows("near");

  document.getElementById("viewContainer").innerHTML = `
    <section class="dashboard-view">
      <div class="view-heading">
        <h3>Dashboard</h3>
        <p>Fast scan of positions, radar ideas, signals, and decision notes.</p>
      </div>

      <div class="metric-grid">
        ${renderMetricTile("Cash", money(cash), { detail: "Available capital" })}
        ${renderMetricTile("Positions Value", money(totalValue), { detail: `${owned.length} open ${owned.length === 1 ? "position" : "positions"}` })}
        ${renderMetricTile("Open P/L", `${formatSignedMoney(pl)} / ${formatSignedPercent(plPct)}`, { tone: getDashboardValueTone(pl), detail: "Unrealized positions" })}
        ${renderMetricTile("Radar Count", `${radar.length} ${radar.length === 1 ? "idea" : "ideas"}`, { detail: "Watched printings" })}
        ${renderMetricTile("Signals Attention", `${signalRows.length} active`, { detail: "Computed attention" })}
        ${renderMetricTile("Targets Approaching", `${approachingRows.length} near`, { detail: "Entry, exit, or hold" })}
        ${renderMetricTile("Notes Count", `${cardNotes.length} ${cardNotes.length === 1 ? "note" : "notes"}`, { detail: "Decision memory" })}
        ${renderMetricTile("Recent Activity", `${transactions.length} tx`, { detail: getDashboardLatestActivityLabel() })}
      </div>

      <div class="scan-grid">
        ${renderScanPanel("Position Gainers", getTopPositions("gain"), "No open gainers yet. Add positions or refresh prices.")}
        ${renderScanPanel("Position Losers", getTopPositions("loss"), "No open losers yet.")}
        ${renderScanPanel("Radar Watchlist", getDashboardRadarRows(), "No Radar ideas yet. Search Radar to add exact printings.")}
        ${renderScanPanel("Signals", signalRows.slice(0, 5).map(formatDashboardSignalRow), "No active attention signals. Add targets, notes, or market checks to create useful alerts.")}
        ${renderScanPanel("Targets Hit", getTargetRows("hit"), "No exit targets hit yet.")}
        ${renderScanPanel("Entry Hits / Downside Watch", getTargetRows("entry"), "No explicit stop/downside fields yet. Entry hits appear here for now.")}
        ${renderScanPanel("Targets Approaching", approachingRows, "No targets or hold windows are approaching.")}
        ${renderScanPanel("Recent Notes", getDashboardRecentNoteRows(), "No card notes yet. Add notes from Card Detail.")}
      </div>
    </section>
  `;
}

function renderMetricTile(label, value, options = {}) {
  const toneClass = options.tone ? ` metric-card--${options.tone}` : "";
  return `
    <div class="metric-card${toneClass}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${options.detail ? `<small>${escapeHtml(options.detail)}</small>` : ""}
    </div>
  `;
}

function renderScanPanel(title, rows, emptyText = "No data yet") {
  const body = rows.length
    ? rows.map(row => `
        <div class="scan-row">
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

function formatDashboardSignalRow(row) {
  return {
    title: row.name || "Attention item",
    detail: [
      row.actionLabel || row.status || "Review",
      row.detail || "",
      row.marketFreshness && row.marketFreshness !== "Recent" ? row.marketFreshness : "",
    ].filter(Boolean).join(" / "),
  };
}

function getDashboardRecentNoteRows() {
  return [...cardNotes]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6)
    .map(note => ({
      title: note.cardName || "General note",
      detail: [getCardNotePreview(note), formatDashboardDate(note.createdAt)].filter(Boolean).join(" / "),
    }));
}

function getDashboardLatestActivityLabel() {
  const latest = transactions
    .map(tx => tx.date || tx.createdAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];

  return latest ? `Latest ${formatDashboardDate(latest)}` : "No transactions yet";
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
