/*
====================================
HISTORY MODULE
====================================

Learning and audit view over available app activity.
====================================
*/

function renderHistoryView() {
  document.getElementById("viewContainer").innerHTML = `
    <section class="module-view">
      <div class="view-heading">
        <h3>History</h3>
        <p>Recent activity and learning trail across transactions, radar, and thesis.</p>
      </div>

      <div class="ledger-filter-bar">
        <input id="historyFilterText" placeholder="Filter history...">
        <select id="historyFilterType" aria-label="History type">
          <option value="">All events</option>
          <option value="transaction">Transactions</option>
          <option value="radar">Radar</option>
          <option value="thesis">Thesis</option>
        </select>
        <span id="historyFilterCount">0 events</span>
      </div>

      <div class="module-list" id="historyList"></div>
    </section>
  `;

  initHistoryFilters();
  renderHistoryList();
}

function buildHistoryEvents() {
  const txEvents = transactions.map(tx => ({
    kind: "transaction",
    date: tx.date,
    title: `${tx.type} ${tx.name}`,
    detail: `${tx.quantity} @ ${money(tx.price)} / ${formatTransactionIdentity(tx) || "manual log"}`,
    badge: tx.type,
  }));

  const radarEvents = radar.map(item => ({
    kind: "radar",
    date: item.addedDate,
    title: `Radar: ${item.name}`,
    detail: `${item.set_code} #${item.collector_number}`,
    badge: "RADAR",
  }));

  const thesisEvents = thesisNotes.map(note => ({
    kind: "thesis",
    date: note.createdAt,
    title: `Thesis: ${note.cardName || "General"}`,
    detail: note.conviction,
    badge: "THESIS",
  }));

  return [...txEvents, ...radarEvents, ...thesisEvents]
    .filter(event => event.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 50);
}

function initHistoryFilters() {
  ["historyFilterText", "historyFilterType"].forEach(id => {
    const control = document.getElementById(id);
    if (!control) return;
    control.addEventListener("input", renderHistoryList);
    control.addEventListener("change", renderHistoryList);
  });
}

function renderHistoryList() {
  const container = document.getElementById("historyList");
  if (!container) return;

  const events = getFilteredHistoryEvents();
  updateHistoryFilterCount(events.length);

  if (!buildHistoryEvents().length) {
    container.innerHTML = `<div class="empty-state">No history yet.</div>`;
    return;
  }

  if (!events.length) {
    container.innerHTML = `<div class="empty-state">No history events match the current filters.</div>`;
    return;
  }

  container.innerHTML = events.map(renderHistoryEvent).join("");
}

function getFilteredHistoryEvents(filterState = getHistoryFilterState()) {
  return buildHistoryEvents().filter(event => {
    if (filterState.type && event.kind !== filterState.type) return false;

    const haystack = [
      event.title,
      event.detail,
      event.badge,
      event.kind,
    ].join(" ").toLowerCase();

    return !filterState.text || haystack.includes(filterState.text);
  });
}

function getHistoryFilterState() {
  return {
    text: document.getElementById("historyFilterText")?.value.trim().toLowerCase() || "",
    type: document.getElementById("historyFilterType")?.value || "",
  };
}

function updateHistoryFilterCount(count) {
  const el = document.getElementById("historyFilterCount");
  if (!el) return;
  el.innerText = `${count} of ${buildHistoryEvents().length} events`;
}

function renderHistoryEvent(event) {
  return `
    <div class="module-row">
      <div>
        <strong>${event.title}</strong>
        <span>${event.detail}</span>
      </div>
      <div class="history-event-meta">
        <span class="status-pill">${event.badge}</span>
        <span>${new Date(event.date).toLocaleDateString()}</span>
      </div>
    </div>
  `;
}
