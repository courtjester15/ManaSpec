/*
====================================
RADAR MODULE
====================================

Tracks spec ideas before money is committed.

Radar items are not positions. Buying from Radar
promotes the idea into an owned Portfolio position.
====================================
*/

let radarSort = {
  field: "name",
  direction: "asc",
};

function renderRadarView(options = {}) {
  document.getElementById("viewContainer").innerHTML = `
    <section class="radar-view">
      <div class="view-heading">
        <h3>Radar</h3>
        <p>Watch ideas before money is committed. Buying moves the planned quantity into Positions.</p>
      </div>

      <section class="radar-search-panel">
        <div class="panel-heading">
          <h4>Search</h4>
          <p>Find printings, then add candidates to Radar.</p>
        </div>

        <div class="radar-search-controls">
          <input id="searchBox" placeholder="Find card or set #, e.g. MH3 123">
          <select id="searchMode" aria-label="Search mode">
            <option value="autocomplete">Name</option>
            <option value="setNumber">Set #</option>
            <option value="oracle">Oracle</option>
            <option value="type">Type</option>
          </select>
          <label class="inline-check">
            <input id="searchFoilOnly" type="checkbox">
            Foil
          </label>
          <label class="inline-check">
            <input id="searchIncludeDigital" type="checkbox">
            Digital
          </label>
        </div>

        <div class="add-card-results">
          <div id="searchResults" class="panel-list"></div>
          <div id="printingsView" class="panel-list"></div>
        </div>
      </section>

      ${renderCardFilterControls("radar", "Filter Radar", { metaId: "radarCount" })}

      <div class="ms-table ms-table--radar" id="radarList"></div>
    </section>
  `;

  initSearch({
    query: options.searchQuery || options.query || "",
    limit: 5,
  });
  initCardFilters("radar", renderRadarItems);
  renderRadarItems();
}

function renderRadarItems() {
  const container = document.getElementById("radarList");
  if (!container) return;

  const filteredRadar = getSortedRadarRows(applyCardFilters(radar, "radar"));
  const rows = paginateStandardRows(filteredRadar, "radar");
  updateRadarCount(getStandardTableShownCount(filteredRadar, "radar"), filteredRadar.length);

  if (!radar.length) {
    container.innerHTML = `
      <div class="empty-state">
        Search above and add exact printings to start tracking specs on Radar.
      </div>
    `;
    return;
  }

  if (!filteredRadar.length) {
    container.innerHTML = `
      <div class="empty-state">
        No Radar ideas match the current filters.
      </div>
    `;
    return;
  }

  renderStandardTable(container, {
    tableClass: "ms-table--radar",
    rows,
    columns: getRadarTableColumns(),
    sortState: radarSort,
    emptyText: "No Radar ideas match the current filters.",
    getRowId: item => item.id,
    onSort: setRadarSort,
    onRowClick: item => openCardDetail(item.id, "radar"),
    onAction: (action, item) => {
      if (action === "art") openRadarArtPreview(item);
      if (action === "buy") buyRadarItem(item.id);
      if (action === "remove") removeRadarItem(item.id);
    },
    onInputChange: (field, item, value) => {
      if (field === "plannedQty") saveRadarPlannedQty(item.id, value);
    },
  });
}

function getRadarTableColumns() {
  return [
    { label: "Card", sortKey: "name", type: "link", action: "art", value: item => item.name, title: item => `${item.set_name || ""} ${item.foil ? "Foil" : ""}` },
    { label: "Set", sortKey: "set_code", align: "center", value: item => item.set_code || "-", title: item => item.set_name || "" },
    { label: "#", sortKey: "collector_number", align: "center", value: item => `${String(item.collector_number || "").padStart(3, "0")}${item.foil ? " F" : ""}` },
    { label: "Rarity", sortKey: "rarity", align: "center", value: formatRarityLabel },
    { label: "Color", sortKey: "color", align: "center", value: getColorLabel },
    { label: "Price", sortKey: "currentPrice", align: "money", value: item => money(item.currentPrice), title: item => item.priceUpdatedAt ? `Updated ${new Date(item.priceUpdatedAt).toLocaleDateString()}` : "No refresh" },
    { label: "Added", sortKey: "addedDate", align: "center", value: item => formatRadarAddedDate(item.addedDate), title: item => formatRadarAddedTitle(item.addedDate) },
    { label: "Want", sortKey: "plannedQty", align: "center", type: "stepper", name: "plannedQty", min: 1, step: 1, value: getRadarPlannedQty },
    { label: "Sellers", sortKey: "sellers", align: "center", value: item => getRadarMarketValue(item, "currentSellers") },
    { label: "Qty", sortKey: "marketQty", align: "center", value: item => getRadarMarketValue(item, "currentQuantity") },
    { label: "Market", sortKey: "marketPrice", align: "money", value: item => {
      const marketPrice = getRadarMarketValue(item, "marketPrice");
      return marketPrice === "-" ? "-" : formatOptionalMoney(marketPrice);
    } },
    {
      label: "Actions",
      align: "actions",
      type: "actions",
      actions: [
        { label: "Buy", action: "buy" },
        { label: "Remove", action: "remove" },
      ],
    },
  ];
}

function setRadarSort(field) {
  const defaultDirection = ["name", "set_code", "collector_number", "rarity", "color"].includes(field) ? "asc" : "desc";
  updateStandardSort(radarSort, field, defaultDirection);
  renderRadarItems();
}

function getSortedRadarRows(rows) {
  return sortRowsByField(rows, radarSort, getRadarSortValue);
}

function getRadarSortValue(item, field) {
  if (field === "color") return getColorLabel(item);
  if (field === "addedDate") return getRadarAddedTimestamp(item.addedDate);
  if (field === "plannedQty") return getRadarPlannedQty(item);
  if (field === "sellers") return getRadarMarketValue(item, "currentSellers", 0);
  if (field === "marketQty") return getRadarMarketValue(item, "currentQuantity", 0);
  if (field === "marketPrice") return getRadarMarketValue(item, "marketPrice", 0);
  return item[field];
}

function formatRadarAddedDate(value) {
  const date = parseRadarAddedDate(value);
  return date ? date.toLocaleDateString() : "-";
}

function formatRadarAddedTitle(value) {
  const date = parseRadarAddedDate(value);
  return date ? `Added to Radar ${date.toLocaleString()}` : "No added date";
}

function getRadarAddedTimestamp(value) {
  const date = parseRadarAddedDate(value);
  return date ? date.getTime() : 0;
}

function parseRadarAddedDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function getRadarMarketValue(item, field, fallback = "-") {
  const latestTcg = typeof getLatestMarketObservation === "function"
    ? getLatestMarketObservation(item.id, "tcgplayer")
    : null;
  return latestTcg ? (latestTcg[field] || fallback) : fallback;
}

function openRadarArtPreview(item) {
  if (typeof openCardArtPreview === "function") {
    openCardArtPreview(item);
    return;
  }

  openCardDetail(item.id, "radar");
}

function updateRadarCount(shownCount = 0, filteredCount = shownCount) {
  const count = document.getElementById("radarCount");
  if (!count) return;

  const shownText = filteredCount > shownCount ? `${shownCount} shown / ` : "";
  count.innerText = filteredCount === radar.length && filteredCount === shownCount
    ? `${radar.length} ${radar.length === 1 ? "idea" : "ideas"}`
    : `${shownText}${filteredCount} of ${radar.length} total`;
}

function addRadarItem(card) {
  const existing = radar.find(item => item.id === card.id);
  if (existing) return false;

  radar.push(buildTrackedCard(card, {
    addedDate: new Date().toISOString(),
  }));

  saveRadarState(radar);
  return true;
}

function getRadarPlannedQty(item) {
  return Math.max(1, Number(item.plannedQty || item.targetQty || 1));
}

function saveRadarPlannedQty(id, value) {
  const item = radar.find(radarItem => radarItem.id === id);
  if (!item) return;

  item.plannedQty = Math.max(1, Number(value || 1));
  saveRadarState(radar);
}

function removeRadarItem(id) {
  const item = radar.find(radarItem => radarItem.id === id);
  if (!item) return;

  if (!confirm(`Remove ${item.name} from Radar? This only removes the watched idea; it will not affect owned Positions.`)) {
    return;
  }

  radar = radar.filter(radarItem => radarItem.id !== id);
  saveRadarState(radar);

  if (typeof showAppNotice === "function") {
    showAppNotice(`${item.name} removed from Radar.`, "warning");
  }
}

function buyRadarItem(id) {
  const item = radar.find(radarItem => radarItem.id === id);
  if (!item) return;

  const price = Number(item.currentPrice || 0);
  const buyQty = getRadarPlannedQty(item);
  const totalCost = price * buyQty;
  if (!price) {
    alert("Price not loaded yet");
    return;
  }

  if (cash < totalCost) {
    alert("Not enough cash");
    return;
  }

  let position = specs.find(spec => spec.id === item.id);

  if (!position) {
    position = {
      ...item,
      qty: 0,
      buyPrice: 0,
      currentPrice: price,
      pl: 0,
      buyDate: null,
    };

    specs.push(position);
  }

  if (position.qty === 0) {
    position.buyDate = new Date().toISOString();
  }

  cash -= totalCost;
  position.qty += buyQty;
  position.buyPrice = ((position.buyPrice * (position.qty - buyQty)) + totalCost) / position.qty;

  if (typeof logTransaction === "function") {
    logTransaction(position, "BUY", buyQty, price);
  }

  radar = radar.filter(radarItem => radarItem.id !== id);

  updatePL();
  save();
  saveRadarState(radar);

  if (typeof showAppNotice === "function") {
    showAppNotice(`Bought ${buyQty} ${item.name} for ${money(totalCost)} and moved it to Positions.`);
  }
}
