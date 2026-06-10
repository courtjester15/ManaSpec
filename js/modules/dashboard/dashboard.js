/*
====================================
DASHBOARD MODULE
====================================

Fast scan view for portfolio, radar, signals, and thesis state.
====================================
*/

function renderDashboardView() {
  const owned = getOwnedPositions();
  const totalValue = getPortfolioValue();
  const invested = getInvestedValue();
  const pl = totalValue - invested;

  document.getElementById("viewContainer").innerHTML = `
    <section class="dashboard-view">
      <div class="view-heading">
        <h3>Dashboard</h3>
        <p>Fast scan of positions, radar ideas, signals, and decision notes.</p>
      </div>

      <div class="metric-grid">
        ${renderMetricCard("Cash", money(cash))}
        ${renderMetricCard("Positions Value", money(totalValue))}
        ${renderMetricCard("Open P/L", `${pl >= 0 ? "+" : ""}${money(pl)}`)}
        ${renderMetricCard("Radar", `${radar.length} ideas`)}
        ${renderMetricCard("Positions", `${owned.length} owned`)}
        ${renderMetricCard("Signals", `${signals.length} active`)}
        ${renderMetricCard("Thesis", `${thesisNotes.length} notes`)}
        ${renderMetricCard("Transactions", `${transactions.length} logged`)}
      </div>

      <div class="scan-grid">
        ${renderScanPanel("Position Gainers", getTopPositions("gain"))}
        ${renderScanPanel("Position Losers", getTopPositions("loss"))}
        ${renderScanPanel("Radar", radar.slice(0, 6).map(item => ({
          title: item.name,
          detail: `${item.set_code} #${item.collector_number} - ${money(item.currentPrice)}`
        })))}
        ${renderScanPanel("Signals", signals.slice(0, 6).map(signal => ({
          title: signal.name,
          detail: `${signal.type} - ${signal.status}`
        })))}
        ${renderScanPanel("Targets Hit", getTargetRows("hit"))}
        ${renderScanPanel("Stops / Downside", getTargetRows("entry"))}
        ${renderScanPanel("Targets Approaching", getTargetRows("near"))}
        ${renderScanPanel("Recent Thesis", thesisNotes.slice(0, 6).map(note => ({
          title: note.cardName || "General note",
          detail: note.thesis
        })))}
      </div>
    </section>
  `;
}

function renderMetricCard(label, value) {
  return `
    <div class="metric-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function renderScanPanel(title, rows) {
  const body = rows.length
    ? rows.map(row => `
        <div class="scan-row">
          <strong>${row.title}</strong>
          <span>${row.detail}</span>
        </div>
      `).join("")
    : `<div class="empty-state compact">No data yet</div>`;

  return `
    <section class="scan-panel">
      <h4>${title}</h4>
      ${body}
    </section>
  `;
}

function getOwnedPositions() {
  return specs.filter(spec => Number(spec.qty || 0) > 0);
}

function getInvestedValue() {
  return getOwnedPositions()
    .reduce((sum, spec) => sum + Number(spec.buyPrice || 0) * Number(spec.qty || 0), 0);
}

function getPortfolioValue() {
  return getOwnedPositions()
    .reduce((sum, spec) => sum + Number(spec.currentPrice || 0) * Number(spec.qty || 0), 0);
}

function getTopPositions(direction) {
  return getOwnedPositions()
    .map(spec => ({
      title: spec.name,
      value: getPositionGainLoss(spec),
      detail: formatPositionMove(spec)
    }))
    .filter(row => direction === "gain" ? row.value >= 0 : row.value < 0)
    .sort((a, b) => direction === "gain" ? b.value - a.value : a.value - b.value)
    .slice(0, 6);
}

function getPositionGainLoss(spec) {
  return (Number(spec.currentPrice || 0) - Number(spec.buyPrice || 0)) * Number(spec.qty || 0);
}

function formatPositionMove(spec) {
  const gainLoss = getPositionGainLoss(spec);
  const buy = Number(spec.buyPrice || 0);
  const now = Number(spec.currentPrice || 0);
  const pct = buy ? ((now - buy) / buy) * 100 : 0;

  return `${gainLoss >= 0 ? "G" : "R"} ${formatSignedMoney(gainLoss)} / ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function formatSignedMoney(value) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${money(Math.abs(value))}`;
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
    item.entryTarget ? `Entry ${money(item.entryTarget)}` : "",
    item.exitTarget ? `Exit ${money(item.exitTarget)}` : "",
    item.holdTime ? `Hold ${item.holdTime}` : "",
  ].filter(Boolean);

  return pieces.join(" / ");
}
