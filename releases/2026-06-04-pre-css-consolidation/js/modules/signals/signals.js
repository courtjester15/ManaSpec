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

      <form class="signal-add-form" id="signalForm">
        <input id="signalName" placeholder="Add manual signal...">
        <button type="submit">Add</button>
      </form>

      <div class="signal-scan-grid">
        ${renderTargetSignalPanel("Exit Hits", getSignalTargetRows("exitHit"))}
        ${renderTargetSignalPanel("Entry Hits", getSignalTargetRows("entryHit"))}
        ${renderTargetSignalPanel("Approaching", getSignalTargetRows("approaching"))}
        ${renderTargetSignalPanel("No Plan", getSignalTargetRows("unplanned"))}
      </div>

      <div class="module-list" id="signalsList"></div>
    </section>
  `;

  document.getElementById("signalForm").onsubmit = addSignalFromForm;
  renderSignalsList();
  initSignalActions();
}

function addSignalFromForm(event) {
  event.preventDefault();

  const name = document.getElementById("signalName").value.trim();
  const type = "Manual";
  const trigger = name;

  if (!name) return;

  signals.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    type,
    trigger,
    status: "Watching",
    createdAt: new Date().toISOString(),
  });

  saveSignalsState(signals);
  renderSignalsView();
}

function renderSignalsList() {
  const container = document.getElementById("signalsList");
  if (!container) return;

  if (!signals.length) {
    container.innerHTML = `<div class="empty-state">No signals yet. Add target, stop, movement, or catalyst triggers here.</div>`;
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
            ${title === "No Plan" ? "" : `<span>${row.detail}</span>`}
            ${title === "No Plan" ? renderQuickPlanForm(row) : ""}
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

function getSignalTargetRows(kind) {
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
      };
    })
    .filter(row => {
      if (kind === "exitHit") return row.status === "Exit hit";
      if (kind === "entryHit") return row.status === "Entry hit";
      if (kind === "approaching") return row.status === "Entry near" || row.status === "Exit near" || row.status === "Hold near" || row.status === "Hold due";
      if (kind === "unplanned") return !row.hasPlan;
      return false;
    })
    .slice(0, 8);
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

function renderQuickPlanForm(row) {
  return `
    <form class="quick-plan-form" data-quick-plan="${row.id}">
      <input class="signal-quick-input" name="entryTarget" type="text" inputmode="numeric" pattern="[0-9]*" aria-label="Entry target" title="Entry target" placeholder="Entry" value="${formatSignalPlanTarget(row.entryTarget)}">
      <input class="signal-quick-input" name="exitTarget" type="text" inputmode="numeric" pattern="[0-9]*" aria-label="Exit target" title="Exit target" placeholder="Exit" value="${formatSignalPlanTarget(row.exitTarget)}">
      <input class="signal-quick-input hold-input" name="holdMonths" type="text" inputmode="numeric" pattern="[0-9]*" aria-label="Hold months" title="Hold months" placeholder="Mo" value="${formatSignalHoldMonths(row.holdTime)}">
      <button type="submit">Save</button>
    </form>
  `;
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

  document.querySelectorAll("[data-quick-plan]").forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      saveQuickSignalPlan(form);
    });
  });
}

function saveQuickSignalPlan(form) {
  const cardId = form.dataset.quickPlan;
  if (!cardId || typeof savePlanForTrackedCard !== "function") return;

  const formData = new FormData(form);
  const item = getTrackedSignalCards().find(card => card.id === cardId);

  savePlanForTrackedCard(cardId, {
    entryTarget: parseWholeDollarInput(formData.get("entryTarget")),
    exitTarget: parseWholeDollarInput(formData.get("exitTarget")),
    holdTime: formatHoldTime(parseHoldMonthsInput(formData.get("holdMonths"))),
  });

  if (typeof showAppNotice === "function" && item) {
    showAppNotice(`${item.name} plan saved.`);
  }

  renderSignalsView();
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
