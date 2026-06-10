/*
====================================
TRANSACTIONS MODULE
====================================

Prototype ledger surface. Current Portfolio still mutates positions directly,
but this gives the future source-of-truth model a visible home.
====================================
*/

function renderTransactionsView() {
  document.getElementById("viewContainer").innerHTML = `
    <section class="module-view transaction-view">
      <div class="view-heading">
        <h3>Transactions</h3>
        <p>Compact ledger for buys, sells, backfills, corrections, and fees.</p>
      </div>

      <form class="transaction-form" id="transactionForm">
        <input id="txName" placeholder="Card name">
        <select id="txType">
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
        <input id="txQuantity" type="number" min="1" step="1" placeholder="Qty">
        <input id="txPrice" type="number" min="0" step="0.01" placeholder="Price">
        <button type="submit">Log</button>
      </form>

      <div class="ledger-filter-bar">
        <input id="txFilterText" placeholder="Filter card, set, notes...">
        <select id="txFilterType" aria-label="Transaction type">
          <option value="">All types</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
        <span id="txFilterCount">0 transactions</span>
      </div>

      <div class="module-list" id="transactionsList"></div>
    </section>
  `;

  document.getElementById("transactionForm").onsubmit = addTransactionFromForm;
  initTransactionFilters();
  renderTransactionsList();
}

function addTransactionFromForm(event) {
  event.preventDefault();

  const name = document.getElementById("txName").value.trim();
  const type = document.getElementById("txType").value;
  const quantity = Number(document.getElementById("txQuantity").value || 0);
  const price = Number(document.getElementById("txPrice").value || 0);

  if (!name || quantity <= 0 || price < 0) return;

  transactions.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    type,
    quantity,
    price,
    fees: 0,
    date: new Date().toISOString(),
    notes: "",
  });

  saveTransactionsState(transactions);
  renderTransactionsView();
}

function renderTransactionsList() {
  const container = document.getElementById("transactionsList");
  if (!container) return;

  const rows = getFilteredTransactions();
  updateTransactionFilterCount(rows.length);

  if (!transactions.length) {
    container.innerHTML = `<div class="empty-state">No transactions logged yet. This is a scaffold until buy/sell flows write ledger events.</div>`;
    return;
  }

  if (!rows.length) {
    container.innerHTML = `<div class="empty-state">No transactions match the current filters.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="transaction-table">
      <div class="transaction-row transaction-head">
        <span>Date</span>
        <span>Type</span>
        <span>Card</span>
        <span>Set / Version</span>
        <span>Meta</span>
        <span>Qty</span>
        <span>Price</span>
        <span>Total</span>
      </div>
      ${rows.map(renderTransactionRow).join("")}
    </div>
  `;
}

function initTransactionFilters() {
  ["txFilterText", "txFilterType"].forEach(id => {
    const control = document.getElementById(id);
    if (!control) return;
    control.addEventListener("input", renderTransactionsList);
    control.addEventListener("change", renderTransactionsList);
  });
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

function updateTransactionFilterCount(count) {
  const el = document.getElementById("txFilterCount");
  if (!el) return;
  el.innerText = `${count} of ${transactions.length} transactions`;
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

function renderTransactionRow(tx) {
  const total = Number(tx.quantity || 0) * Number(tx.price || 0);
  const signedTotal = tx.type === "SELL" ? `+${money(total)}` : `-${money(total)}`;

  return `
    <div class="transaction-row">
      <span>${formatTransactionDate(tx.date)}</span>
      <span><mark class="tx-pill ${tx.type === "SELL" ? "sell" : "buy"}">${tx.type}</mark></span>
      <span>
        <strong>${tx.name}</strong>
        <small>${formatTransactionIdentity(tx)}</small>
      </span>
      <span>
        <strong>${tx.set_name || "-"}</strong>
        <small>${formatTransactionVersion(tx)}</small>
      </span>
      <span>${formatTransactionMeta(tx)}</span>
      <span>${Number(tx.quantity || 0)}</span>
      <span>${money(tx.price)}</span>
      <span class="${tx.type === "SELL" ? "positive-money" : "negative-money"}">${signedTotal}</span>
    </div>
  `;
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

function formatTransactionMeta(tx) {
  const rarity = tx.rarity ? tx.rarity.slice(0, 1).toUpperCase() : "-";
  const type = tx.type_line ? getPrimaryType(tx) : "-";
  const color = typeof getColorLabel === "function" ? getColorLabel(tx) : "-";

  return `${color} / ${rarity} / ${type}`;
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
