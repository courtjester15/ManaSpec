/*
====================================
TRANSACTIONS MODULE
====================================

Prototype ledger surface. Current Portfolio still mutates positions directly,
but this gives the future source-of-truth model a visible home.
====================================
*/

let transactionsSort = {
  field: "date",
  direction: "desc",
};

function renderTransactionsView() {
  document.getElementById("viewContainer").innerHTML = `
    <section class="module-view transaction-view">
      <div class="view-heading">
        <h3>Transactions</h3>
        <p>Compact ledger for buys, sells, backfills, corrections, and fees.</p>
      </div>

      ${renderModuleContextBand(getTransactionContextCards(), { label: "Transactions context" })}

      <section class="card-filter-panel transaction-filter-panel">
        <div class="panel-heading compact-heading">
          <h4>Filter Transactions</h4>
          <span class="filter-meta" id="txFilterCount">0 transactions</span>
        </div>

        <div class="ledger-filter-bar compact-filter-controls">
          <label class="filter-control">
            <span>Search</span>
            <input id="txFilterText" placeholder="Card, set, notes">
          </label>
          <label class="filter-control">
            <span>Type</span>
            <select id="txFilterType" aria-label="Transaction type">
              <option value="">All types</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </label>
          ${renderTablePageSizeControl("transactions")}
          <button type="button" class="filter-reset-btn" id="txFilterReset">Reset</button>
        </div>
      </section>

      <div id="transactionsList"></div>
    </section>
  `;

  initTransactionFilters();
  renderTransactionsList();
}

function getTransactionContextCards() {
  const buys = transactions.filter(tx => tx.type === "BUY");
  const sells = transactions.filter(tx => tx.type === "SELL");
  const buyTotal = buys.reduce((total, tx) => total + getTransactionTotal(tx), 0);
  const sellTotal = sells.reduce((total, tx) => total + getTransactionTotal(tx), 0);
  const latest = transactions[0];

  return [
    {
      label: "Buys",
      value: buys.length,
      detail: `${money(buyTotal)} deployed`,
      preview: "Acquisition events",
    },
    {
      label: "Sells",
      value: sells.length,
      detail: `${money(sellTotal)} returned`,
      preview: "Exit events",
    },
    {
      label: "Net Cash Flow",
      value: money(sellTotal - buyTotal),
      detail: "Sells minus buys",
      preview: "Ledger movement",
    },
    {
      label: "Recent Activity",
      value: latest ? formatTransactionDate(latest.date) : "-",
      detail: latest ? latest.type : "No transactions",
      preview: latest?.name || "No ledger rows yet",
    },
  ];
}

function getTransactionTotal(tx) {
  return Number(tx.quantity || 0) * Number(tx.price || 0);
}

function renderTransactionsList() {
  const container = document.getElementById("transactionsList");
  if (!container) return;

  const filteredRows = getSortedTransactionRows(getFilteredTransactions());
  const rows = paginateStandardRows(filteredRows, "transactions");
  updateTransactionFilterCount(getStandardTableShownCount(filteredRows, "transactions"), filteredRows.length);

  if (!transactions.length) {
    renderStandardTable(container, {
      tableClass: "ms-table--ledger",
      rows: [],
      columns: getTransactionTableColumns(),
      emptyText: "No transactions logged yet. This is a scaffold until buy/sell flows write ledger events.",
    });
    return;
  }

  if (!filteredRows.length) {
    renderStandardTable(container, {
      tableClass: "ms-table--ledger",
      rows: [],
      columns: getTransactionTableColumns(),
      emptyText: "No transactions match the current filters.",
    });
    return;
  }

  renderStandardTable(container, {
    tableClass: "ms-table--ledger",
    rows,
    columns: getTransactionTableColumns(),
    sortState: transactionsSort,
    emptyText: "No transactions match the current filters.",
    getRowId: tx => tx.id,
    onSort: setTransactionSort,
    onRowClick: tx => {
      const source = getTransactionCardSource(tx);
      if (source?.id) openCardDetail(source.id, "portfolio");
    },
    onAction: (action, tx) => {
      const source = getTransactionCardSource(tx);
      if (!source) return;
      if (action === "art" && typeof openCardArtPreview === "function") openCardArtPreview(source);
    },
  });
}

function initTransactionFilters() {
  ["txFilterText", "txFilterType"].forEach(id => {
    const control = document.getElementById(id);
    if (!control) return;
    control.addEventListener("input", renderTransactionsList);
    control.addEventListener("change", renderTransactionsList);
  });

  const reset = document.getElementById("txFilterReset");
  if (reset) {
    reset.addEventListener("click", () => {
      document.getElementById("txFilterText").value = "";
      document.getElementById("txFilterType").value = "";
      renderTransactionsList();
    });
  }

  initTablePageSizeControl("transactions", renderTransactionsList);
}

function getFilteredTransactions() {
  const text = document.getElementById("txFilterText")?.value.trim().toLowerCase() || "";
  const type = document.getElementById("txFilterType")?.value || "";

  return transactions.filter(tx => {
    if (type && tx.type !== type) return false;

    const haystack = [
      tx.name,
      tx.set_code,
      tx.set_name,
      tx.collector_number,
      tx.notes,
      tx.type,
    ].join(" ").toLowerCase();

    return !text || haystack.includes(text);
  });
}

function updateTransactionFilterCount(shownCount, filteredCount = shownCount) {
  const el = document.getElementById("txFilterCount");
  if (!el) return;
  const shownText = filteredCount > shownCount ? `${shownCount} shown / ` : "";
  el.innerText = `${shownText}${filteredCount} of ${transactions.length} transactions`;
}

function logTransaction(position, type, quantity, price) {
  transactions.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    cardId: position.id,
    name: position.name,
    set_code: position.set_code,
    set_name: position.set_name,
    collector_number: position.collector_number,
    foil: position.foil || false,
    ...getTransactionMetadata(position),
    type,
    quantity,
    price,
    fees: 0,
    date: new Date().toISOString(),
    notes: "",
  });

  saveTransactionsState(transactions);
}

function getTransactionTableColumns() {
  return [
    { label: "Card", sortKey: "name", type: "link", action: "art", value: tx => tx.name || "-", title: tx => [tx.name, formatTransactionIdentity(tx)].filter(Boolean).join(" / ") },
    { label: "Set", sortKey: "set_code", align: "center", value: tx => tx.set_code || "-", title: tx => [tx.set_name, formatTransactionVersion(tx)].filter(Boolean).join(" / ") },
    { label: "#", sortKey: "collector_number", align: "center", value: tx => tx.collector_number ? `#${String(tx.collector_number).padStart(3, "0")}` : "-" },
    { label: "Rarity", sortKey: "rarity", align: "center", value: formatRarityLabel },
    { label: "Color", sortKey: "color", align: "center", value: getColorLabel },
    { label: "Price", sortKey: "price", align: "money", value: tx => money(tx.price) },
    { label: "Qty", sortKey: "quantity", align: "center", value: tx => Number(tx.quantity || 0) },
    { label: "Total", sortKey: "total", align: "money", className: tx => tx.type === "SELL" ? "positive-money" : "negative-money", value: formatTransactionSignedTotal },
    { label: "Date", sortKey: "date", align: "center", value: tx => formatTransactionDate(tx.date) },
    { label: "Type", sortKey: "type", align: "center", type: "badge", badgeClass: tx => `tx-pill ${tx.type === "SELL" ? "sell" : "buy"}`, value: tx => tx.type },
  ];
}

function setTransactionSort(field) {
  const defaultDirection = ["name", "set_code", "collector_number", "rarity", "color", "type"].includes(field) ? "asc" : "desc";
  updateStandardSort(transactionsSort, field, defaultDirection);
  renderTransactionsList();
}

function getSortedTransactionRows(rows) {
  return sortRowsByField(rows, transactionsSort, getTransactionSortValue);
}

function getTransactionSortValue(tx, field) {
  if (field === "color") return getColorLabel(tx);
  if (field === "total") return Number(tx.quantity || 0) * Number(tx.price || 0);
  if (field === "date") return tx.date || "";
  return tx[field];
}

function formatTransactionSignedTotal(tx) {
  const total = getTransactionTotal(tx);
  return tx.type === "SELL" ? `+${money(total)}` : `-${money(total)}`;
}

function getTransactionCardSource(tx) {
  if (!tx) return null;
  return specs.find(item => item.id === tx.cardId)
    || radar.find(item => item.id === tx.cardId)
    || null;
}

function formatTransactionDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

function formatTransactionIdentity(tx) {
  const setCode = tx.set_code || "";
  const number = tx.collector_number ? `#${String(tx.collector_number).padStart(3, "0")}` : "";
  return [setCode, number].filter(Boolean).join(" ");
}

function formatTransactionVersion(tx) {
  const pieces = [
    tx.foil ? "Foil" : "",
    tx.promo ? "Promo" : "",
    tx.frame && tx.frame !== "2015" ? `Frame ${tx.frame}` : "",
    tx.security_stamp ? `${tx.security_stamp} stamp` : "",
    tx.border_color && tx.border_color !== "black" ? `${tx.border_color} border` : "",
    tx.backfilledFromPositionId ? "Backfill" : "",
  ];

  return pieces.filter(Boolean).join(" / ") || "-";
}

function getTransactionMetadata(position) {
  return {
    rarity: position.rarity || "",
    released_at: position.released_at || "",
    type_line: position.type_line || "",
    colors: position.colors || [],
    color_identity: position.color_identity || [],
    mana_cost: position.mana_cost || "",
    cmc: Number(position.cmc || 0),
    edhrec_rank: position.edhrec_rank || null,
    reserved: Boolean(position.reserved),
    reprint: Boolean(position.reprint),
    set_type: position.set_type || "",
    artist: position.artist || "",
    promo: Boolean(position.promo),
    finishes: position.finishes || [],
    frame: position.frame || "",
    border_color: position.border_color || "",
    security_stamp: position.security_stamp || "",
  };
}
