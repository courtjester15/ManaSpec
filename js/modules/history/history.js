/*
====================================
HISTORY MODULE
====================================

Learning and audit view over available app activity.
====================================
*/

let historySort = {
  field: "date",
  direction: "desc",
};

const HISTORY_EVENT_LIMIT = 50;

function renderHistoryView() {
  document.getElementById("viewContainer").innerHTML = `
    <section class="module-view">
      <div class="view-heading">
        <h3>History</h3>
        <p>Recent activity and learning trail across transactions, radar, and thesis.</p>
      </div>

      <section class="card-filter-panel history-filter-panel">
        <div class="panel-heading compact-heading">
          <h4>Filter History</h4>
          <span class="filter-meta" id="historyFilterCount">0 events</span>
        </div>

        <div class="ledger-filter-bar compact-filter-controls">
          <label class="filter-control">
            <span>Search</span>
            <input id="historyFilterText" placeholder="Event, card, detail">
          </label>
          <label class="filter-control">
            <span>Type</span>
            <select id="historyFilterType" aria-label="History type">
              <option value="">All events</option>
              <option value="transaction">Transactions</option>
              <option value="radar">Radar</option>
              <option value="thesis">Thesis</option>
            </select>
          </label>
          ${renderTablePageSizeControl("history")}
          <button type="button" class="filter-reset-btn" id="historyFilterReset">Reset</button>
        </div>
      </section>

      <div id="historyList"></div>
    </section>
  `;

  initHistoryFilters();
  renderHistoryList();
}

function buildHistoryEvents() {
  const txEvents = transactions.map(tx => ({
    kind: "transaction",
    date: tx.date,
    cardId: tx.cardId || "",
    card: tx.name,
    set: tx.set_code || "",
    number: tx.collector_number || "",
    rarity: tx.rarity || "",
    color: getColorLabel(tx),
    price: tx.price || 0,
    title: `${tx.type} ${tx.name}`,
    detail: `${tx.quantity || 0} qty / ${formatTransactionIdentity(tx) || "manual log"}`,
    badge: tx.type,
  }));

  const radarEvents = radar.map(item => ({
    kind: "radar",
    date: item.addedDate,
    cardId: item.id,
    card: item.name,
    set: item.set_code || "",
    number: item.collector_number || "",
    rarity: item.rarity || "",
    color: getColorLabel(item),
    price: item.currentPrice || 0,
    title: `Radar: ${item.name}`,
    detail: "Added to Radar",
    badge: "RADAR",
  }));

  const thesisEvents = thesisNotes.map(note => ({
    kind: "thesis",
    date: note.createdAt,
    cardId: note.cardId || "",
    card: note.cardName || "General",
    set: "",
    number: "",
    rarity: "",
    color: "",
    price: "",
    title: `Thesis: ${note.cardName || "General"}`,
    detail: note.conviction,
    badge: "THESIS",
  }));

  return [...txEvents, ...radarEvents, ...thesisEvents]
    .filter(event => event.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function initHistoryFilters() {
  ["historyFilterText", "historyFilterType"].forEach(id => {
    const control = document.getElementById(id);
    if (!control) return;
    control.addEventListener("input", renderHistoryList);
    control.addEventListener("change", renderHistoryList);
  });

  const reset = document.getElementById("historyFilterReset");
  if (reset) {
    reset.addEventListener("click", () => {
      document.getElementById("historyFilterText").value = "";
      document.getElementById("historyFilterType").value = "";
      renderHistoryList();
    });
  }

  initTablePageSizeControl("history", renderHistoryList);
}

function renderHistoryList() {
  const container = document.getElementById("historyList");
  if (!container) return;

  const matchingEvents = getSortedHistoryEvents(getFilteredHistoryEvents());
  const cappedEvents = matchingEvents.slice(0, HISTORY_EVENT_LIMIT);
  const events = paginateStandardRows(cappedEvents, "history");
  updateHistoryFilterCount(
    getStandardTableShownCount(cappedEvents, "history"),
    cappedEvents.length,
    matchingEvents.length
  );

  if (!buildHistoryEvents().length) {
    container.innerHTML = `<div class="empty-state">No history yet.</div>`;
    return;
  }

  if (!matchingEvents.length) {
    container.innerHTML = `<div class="empty-state">No history events match the current filters.</div>`;
    return;
  }

  renderStandardTable(container, {
    tableClass: "ms-table--history",
    rows: events,
    columns: getHistoryTableColumns(),
    sortState: historySort,
    emptyText: "No history events match the current filters.",
    getRowId: event => `${event.kind}-${event.cardId || event.title}-${event.date}`,
    onSort: setHistorySort,
    onRowClick: event => {
      const source = getHistoryCardSource(event);
      if (source?.id) openCardDetail(source.id, source.qty ? "portfolio" : "radar");
    },
    onAction: (action, event) => {
      const source = getHistoryCardSource(event);
      if (action === "art" && source && typeof openCardArtPreview === "function") openCardArtPreview(source);
    },
  });
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

function updateHistoryFilterCount(shownCount, filteredCount = shownCount, matchingCount = filteredCount) {
  const el = document.getElementById("historyFilterCount");
  if (!el) return;
  const total = buildHistoryEvents().length;
  const shownText = filteredCount > shownCount ? `${shownCount} shown / ` : "";
  const matchText = matchingCount > filteredCount
    ? `${filteredCount} of ${matchingCount} matching / ${total} events`
    : `${filteredCount} of ${total} events`;
  el.innerText = `${shownText}${matchText}`;
}

function getHistoryTableColumns() {
  return [
    { label: "Card", sortKey: "card", type: "link", action: "art", value: event => event.card || event.title, title: event => event.title },
    { label: "Set", sortKey: "set", align: "center", value: event => event.set || "-" },
    { label: "#", sortKey: "number", align: "center", value: event => event.number ? `#${String(event.number).padStart(3, "0")}` : "-" },
    { label: "Rarity", sortKey: "rarity", align: "center", value: formatRarityLabel },
    { label: "Color", sortKey: "color", align: "center", value: event => event.color || "-" },
    { label: "Price", sortKey: "price", align: "money", value: event => event.price ? money(event.price) : "-" },
    { label: "Date", sortKey: "date", align: "center", value: event => new Date(event.date).toLocaleDateString() },
    { label: "Type", sortKey: "badge", align: "center", type: "badge", value: event => event.badge },
    { label: "Detail", sortKey: "detail", value: event => event.detail || "-", title: event => event.detail || "" },
  ];
}

function setHistorySort(field) {
  const defaultDirection = ["card", "set", "number", "rarity", "color", "badge", "detail"].includes(field) ? "asc" : "desc";
  updateStandardSort(historySort, field, defaultDirection);
  renderHistoryList();
}

function getSortedHistoryEvents(events) {
  return sortRowsByField(events, historySort, getHistorySortValue);
}

function getHistorySortValue(event, field) {
  if (field === "number") return event.number || "";
  if (field === "price") return Number(event.price || 0);
  return event[field];
}

function getHistoryCardSource(event) {
  if (!event?.cardId) return null;
  return specs.find(item => item.id === event.cardId)
    || radar.find(item => item.id === event.cardId)
    || null;
}
