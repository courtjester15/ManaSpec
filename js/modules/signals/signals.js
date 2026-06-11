/*
====================================
SIGNALS MODULE
====================================

Early target and alert tracking layer.
====================================
*/

function renderSignalsView() {
  document.getElementById("viewContainer").innerHTML = `
    <section class="module-view">
      <div class="view-heading">
        <h3>Signals</h3>
        <p>Targets, alerts, and movement flags for tracked specs.</p>
      </div>

      <div class="signal-scan-grid">
        ${renderTargetSignalPanel("Exit Hits", getSignalTargetRows("exitHit"))}
        ${renderTargetSignalPanel("Entry Hits", getSignalTargetRows("entryHit"))}
        ${renderTargetSignalPanel("Approaching", getSignalTargetRows("approaching"))}
        ${renderNoPlanSignalPanel()}
      </div>

      <div class="module-list" id="signalsList"></div>
    </section>
  `;

  renderNoPlanSignalTable();
  initTablePageSizeControl("signals", renderNoPlanSignalTable);
  renderSignalsList();
  initSignalActions();
}

function renderSignalsList() {
  const container = document.getElementById("signalsList");
  if (!container) return;

  if (!signals.length) {
    container.innerHTML = `<div class="empty-state">No manual signal records yet. Target alerts are generated from Radar and Positions plans.</div>`;
    return;
  }

  container.innerHTML = signals.map(signal => `
    <div class="module-row">
      <div>
        <strong>${signal.name}</strong>
        <span>${signal.type} - ${signal.trigger}</span>
      </div>
      <span>${signal.status}</span>
    </div>
  `).join("");
}

function renderTargetSignalPanel(title, rows) {
  const body = rows.length
    ? rows.map(row => `
        <div class="signal-row">
          <div>
            <strong>${row.name}</strong>
            <span>${row.detail}</span>
          </div>
          <div class="signal-actions">
            <span class="status-pill">${row.status}</span>
            <button type="button" data-signal-action="detail" data-card-id="${row.id}" data-source="${row.source}">Detail</button>
            <button type="button" data-signal-action="view" data-source="${row.source}">${row.source === "portfolio" ? "Positions" : "Radar"}</button>
          </div>
        </div>
      `).join("")
    : `<div class="empty-state compact">No cards here.</div>`;

  return `
    <section class="signal-panel">
      <h4>${title}</h4>
      ${body}
    </section>
  `;
}

function renderNoPlanSignalPanel() {
  return `
    <section class="signal-panel signal-panel--wide">
      <div class="signal-panel-header">
        <h4>No Plan</h4>
        ${renderTablePageSizeControl("signals")}
      </div>
      <div id="noPlanSignalTable"></div>
    </section>
  `;
}

function renderNoPlanSignalTable() {
  const rows = paginateStandardRows(getSignalTargetRows("unplanned", Infinity), "signals");

  renderStandardTable(document.getElementById("noPlanSignalTable"), {
    tableClass: "ms-table--plan signal-plan-table",
    rows,
    columns: getNoPlanSignalColumns(),
    emptyText: "No cards here.",
    getRowId: row => row.id,
    onRowClick: row => openCardDetail(row.id, row.source),
    onAction: (action, row, event) => {
      if (action === "art") openSignalArtPreview(row);
      if (action === "detail") openCardDetail(row.id, row.source);
      if (action === "view") setActiveView(row.source === "portfolio" ? "portfolio" : "radar");
    },
  });
}

function getNoPlanSignalColumns() {
  return [
    { label: "Card", type: "link", action: "art", value: row => row.name, title: row => row.name },
    { label: "Set", align: "center", value: row => row.setCode || "-", title: row => row.setName || "" },
    { label: "#", align: "center", value: row => row.collectorNumber ? `#${String(row.collectorNumber).padStart(3, "0")}` : "-" },
    { label: "Rarity", align: "center", value: row => row.rarity || "-" },
    { label: "Color", align: "center", value: row => row.color || "-" },
    { label: "Now", align: "money", value: row => row.currentPrice ? money(row.currentPrice) : "-" },
    { label: "Source", align: "center", value: row => row.source === "portfolio" ? "Positions" : "Radar" },
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

function openSignalArtPreview(row) {
  const source = findTrackedCard(row.id);
  if (source && typeof openCardArtPreview === "function") {
    openCardArtPreview(source);
    return;
  }

  openCardDetail(row.id, row.source);
}

function getSignalTargetRows(kind, limit = 8) {
  return getTrackedSignalCards()
    .map(item => {
      const state = typeof getTargetState === "function"
        ? getTargetState(item, item.owned)
        : { label: "No target" };

      return {
        id: item.id,
        name: item.name,
        source: item.owned ? "portfolio" : "radar",
        status: state.label,
        detail: formatSignalTargetDetail(item),
        hasPlan: Boolean(Number(item.entryTarget || 0) || Number(item.exitTarget || 0) || item.holdTime),
        entryTarget: item.entryTarget || "",
        exitTarget: item.exitTarget || "",
        holdTime: item.holdTime || "",
        currentPrice: Number(item.currentPrice || 0),
        setCode: item.set_code || "",
        setName: item.set_name || "",
        collectorNumber: item.collector_number || "",
        rarity: formatRarityLabel(item),
        color: getColorLabel(item),
      };
    })
    .filter(row => {
      if (kind === "exitHit") return row.status === "Exit hit";
      if (kind === "entryHit") return row.status === "Entry hit";
      if (kind === "approaching") return row.status === "Entry near" || row.status === "Exit near" || row.status === "Hold near" || row.status === "Hold due";
      if (kind === "unplanned") return !row.hasPlan;
      return false;
    })
    .slice(0, limit);
}

function getTrackedSignalCards() {
  return [
    ...radar.map(item => ({ ...item, owned: false })),
    ...specs
      .filter(spec => Number(spec.qty || 0) > 0)
      .map(spec => ({ ...spec, owned: true })),
  ];
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

function initSignalActions() {
  document.querySelectorAll("[data-signal-action]").forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.signalAction;
      const source = button.dataset.source;
      const cardId = button.dataset.cardId;

      if (action === "detail" && cardId) {
        openCardDetail(cardId, source);
        return;
      }

      if (action === "view") {
        setActiveView(source === "portfolio" ? "portfolio" : "radar");
      }
    });
  });

}

function formatSignalPlanTarget(value) {
  const number = Number(value || 0);
  return number > 0 ? String(Math.round(number)) : "";
}

function formatSignalHoldMonths(value) {
  if (typeof getHoldMonths === "function") {
    const months = getHoldMonths(value);
    return months > 0 ? String(months) : "";
  }

  const match = String(value || "").match(/\d+/);
  return match ? match[0] : "";
}
