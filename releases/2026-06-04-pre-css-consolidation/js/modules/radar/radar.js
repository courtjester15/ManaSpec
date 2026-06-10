/*
====================================
RADAR MODULE
====================================

Tracks spec ideas before money is committed.

Radar items are not positions. Buying from Radar
promotes the idea into an owned Portfolio position.
====================================
*/

function renderRadarView(options = {}) {
  document.getElementById("viewContainer").innerHTML = `
    <section class="radar-view">
      <div class="view-heading">
        <h3>Radar</h3>
        <span class="view-heading-meta" id="radarCount">0 ideas</span>
      </div>

      <section class="radar-search-panel">
        <div class="panel-heading">
          <h4>Search</h4>
          <p>Find printings, check filters, then add candidates to Radar.</p>
        </div>

        <div class="radar-search-controls">
          <input id="searchBox" placeholder="Find card by name...">
          <select id="searchMode" aria-label="Search mode">
            <option value="autocomplete">Name match</option>
            <option value="setNumber">Set #</option>
            <option value="oracle">Oracle text</option>
            <option value="type">Type line</option>
          </select>
          <input id="searchMinPrice" class="money-input" type="number" min="0" step="1" placeholder="Min $">
          <input id="searchMaxPrice" class="money-input" type="number" min="0" step="1" placeholder="Max $">
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

      ${renderCardFilterControls("radar", "Filter Radar")}

      <div class="radar-list" id="radarList"></div>
    </section>
  `;

  initSearch({
    query: options.searchQuery || "",
    limit: 12,
  });
  initCardFilters("radar", renderRadarItems);
  renderRadarItems();
}

function renderRadarItems() {
  const container = document.getElementById("radarList");
  if (!container) return;

  const filteredRadar = applyCardFilters(radar, "radar");
  updateRadarCount(filteredRadar.length);

  if (!radar.length) {
    container.innerHTML = `
      <div class="empty-state">
        Add cards from Portfolio's Add Card panel to start tracking specs on Radar.
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

  container.innerHTML = "";

  filteredRadar.forEach(item => {
    const latestTcg = typeof getLatestMarketObservation === "function"
      ? getLatestMarketObservation(item.id, "tcgplayer")
      : null;
    const row = document.createElement("div");
    row.className = "radar-row";

    row.innerHTML = `
      <div class="radar-card-summary">
        <strong>${item.name}</strong>
        <span>${item.set_code} #${String(item.collector_number || "").padStart(3, "0")} ${item.foil ? "Foil" : ""}</span>
      </div>
      <div>${item.set_name}</div>
      <div>${money(item.currentPrice)} <span>${item.priceUpdatedAt ? new Date(item.priceUpdatedAt).toLocaleDateString() : "No refresh"}</span></div>
      <div class="radar-signal-summary">
        ${latestTcg ? `${latestTcg.currentSellers || 0}s / ${latestTcg.currentQuantity || 0}q / ${formatOptionalMoney(latestTcg.marketPrice)}` : "No TCG"}
      </div>
      <div class="row-actions">
        <button type="button" data-action="detail">Detail</button>
        <button type="button" data-action="buy">Buy</button>
        <button type="button" data-action="remove">Remove</button>
      </div>
    `;

    row.querySelector('[data-action="detail"]').onclick = () => openCardDetail(item.id, "radar");
    row.querySelector('[data-action="buy"]').onclick = () => buyRadarItem(item.id);
    row.querySelector('[data-action="remove"]').onclick = () => removeRadarItem(item.id);
    row.onclick = event => {
      if (event.target.closest("button")) return;
      openCardDetail(item.id, "radar");
    };

    container.appendChild(row);
  });
}

function updateRadarCount(shownCount = 0) {
  const count = document.getElementById("radarCount");
  if (!count) return;

  count.innerText = shownCount === radar.length
    ? `${radar.length} ${radar.length === 1 ? "idea" : "ideas"}`
    : `${shownCount} shown / ${radar.length} total`;
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
  if (!price) {
    alert("Price not loaded yet");
    return;
  }

  if (cash < price) {
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

  cash -= price;
  position.qty += 1;
  position.buyPrice = ((position.buyPrice * (position.qty - 1)) + price) / position.qty;

  if (typeof logTransaction === "function") {
    logTransaction(position, "BUY", 1, price);
  }

  radar = radar.filter(radarItem => radarItem.id !== id);

  updatePL();
  save();
  saveRadarState(radar);

  if (typeof showAppNotice === "function") {
    showAppNotice(`Bought 1 ${item.name} for ${money(price)} and moved it to Positions.`);
  }
}
