/*
====================================
RADAR MODULE
====================================

Tracks spec ideas before money is committed.

Radar items are not positions. Buying from Radar
promotes the idea into an owned Portfolio position.
====================================
*/

function renderRadarView() {
  document.getElementById("viewContainer").innerHTML = `
    <section class="radar-view">
      <div class="view-heading">
        <h3>Radar</h3>
        <p>Spec ideas you are watching before committing cash.</p>
      </div>

      <div class="radar-list" id="radarList"></div>
    </section>
  `;

  renderRadarItems();
}

function renderRadarItems() {
  const container = document.getElementById("radarList");
  if (!container) return;

  if (!radar.length) {
    container.innerHTML = `
      <div class="empty-state">
        Add cards from Portfolio's Add Card panel to start tracking specs on Radar.
      </div>
    `;
    return;
  }

  container.innerHTML = "";

  radar.forEach(item => {
    const row = document.createElement("div");
    row.className = "radar-row";

    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <span>${item.set_code} #${String(item.collector_number || "").padStart(3, "0")}</span>
      </div>
      <div>${item.set_name}</div>
      <div>$${Number(item.currentPrice || 0).toFixed(2)}</div>
      <div class="row-actions">
        <button type="button" data-action="buy">Buy</button>
        <button type="button" data-action="remove">Remove</button>
      </div>
    `;

    row.querySelector('[data-action="buy"]').onclick = () => buyRadarItem(item.id);
    row.querySelector('[data-action="remove"]').onclick = () => removeRadarItem(item.id);

    container.appendChild(row);
  });
}

function addRadarItem(card) {
  const price = card.foil
    ? parseFloat(card.prices.usd_foil || card.prices.usd || 0)
    : parseFloat(card.prices.usd || 0);

  const existing = radar.find(item => item.id === card.id);
  if (existing) return;

  radar.push({
    id: card.id,
    name: card.name,
    set_code: card.set.toUpperCase(),
    set_name: card.set_name,
    collector_number: card.collector_number,
    foil: false,
    currentPrice: price,
    addedDate: new Date().toISOString(),
  });

  saveRadarState(radar);
}

function removeRadarItem(id) {
  radar = radar.filter(item => item.id !== id);
  saveRadarState(radar);
}

function buyRadarItem(id) {
  const item = radar.find(radarItem => radarItem.id === id);
  if (!item) return;

  const price = Number(item.currentPrice || 0);
  if (!price) return alert("Price not loaded yet");
  if (cash < price) return alert("Not enough cash");

  let position = specs.find(spec => spec.id === item.id);

  if (!position) {
    position = {
      id: item.id,
      name: item.name,
      set_code: item.set_code,
      set_name: item.set_name,
      collector_number: item.collector_number,
      foil: item.foil || false,
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

  radar = radar.filter(radarItem => radarItem.id !== id);

  updatePL();
  save();
  saveRadarState(radar);
}
