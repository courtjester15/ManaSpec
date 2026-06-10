/*
====================================
PRINTINGS SYSTEM
====================================

Handles:
- loading card printings
- rendering printings list
- sorting + selection of versions/specs
====================================
*/

///////////////////////////////
// STATE
///////////////////////////////

let currentPrintings = [];

let printSortState = {
  key: "nonfoil",
  dir: "asc"
};

///////////////////////////////
// SORT ARROWS
///////////////////////////////

function getSortArrow(key) {
  if (printSortState.key !== key) return "";
  return printSortState.dir === "asc" ? " ^" : " v";
}

///////////////////////////////
// SORT ENGINE
///////////////////////////////

function sortPrintings(list) {
  const { key, dir } = printSortState;

  const sorted = [...list];

  sorted.sort((a, b) => {
    const valA = getPrintingSortValue(a, key);
    const valB = getPrintingSortValue(b, key);
    const primary = ["nonfoil", "foil"].includes(key)
      ? comparePrintingPrices(valA, valB, dir)
      : comparePrintingValues(valA, valB);

    if (primary) return dir === "asc" ? primary : -primary;

    return comparePrintingValues(a.name, b.name)
      || comparePrintingValues(a.set_name, b.set_name)
      || comparePrintingValues(a.collector_number, b.collector_number);
  });

  return sorted;
}

///////////////////////////////
// LOAD PRINTINGS
///////////////////////////////

async function showPrintings(card) {
  const container = document.getElementById("printingsView");

  container.innerHTML = "Loading printings...";

  const full = await fetch(`https://api.scryfall.com/cards/${card.id}`);
  const fullCard = await full.json();

  const query = typeof withPaperSearchDefault === "function"
    ? withPaperSearchDefault(`oracleid:${fullCard.oracle_id}`)
    : `oracleid:${fullCard.oracle_id}`;

  const res = await fetch(
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints`
  );

  const data = await res.json();

  currentPrintings = data.data || [];

  renderPrintings();
}

///////////////////////////////
// RENDER
///////////////////////////////

function renderPrintings() {
  const container = document.getElementById("printingsView");

  const printings = sortPrintings(currentPrintings);

  ///////////////////////////////
  // HEADER
  ///////////////////////////////

  container.innerHTML = `
    <div class="printing-row printing-header">

      <span data-sort="set">SET${getSortArrow("set")}</span>
      <span data-sort="number">#${getSortArrow("number")}</span>
      <span data-sort="name">NAME${getSortArrow("name")}</span>
      <span data-sort="setname">SET NAME${getSortArrow("setname")}</span>
      <span data-sort="nonfoil">NONFOIL${getSortArrow("nonfoil")}</span>
      <span data-sort="foil">FOIL${getSortArrow("foil")}</span>

    </div>
  `;

  ///////////////////////////////
  // ROWS
  ///////////////////////////////

  printings.forEach(printing => {
    const div = document.createElement("div");
    div.className = "printing-row";

    const num = String(printing.collector_number || "").padStart(3, "0");

    div.innerHTML = `
      <span>${printing.set.toUpperCase()}</span>
      <span>${num}</span>
      <button type="button" class="link-action search-card-name" data-action="preview">${printing.name}</button>
      <span>${printing.set_name}</span>
      ${renderFinishAction(printing, false)}
      ${renderFinishAction(printing, true)}
    `;

    div.querySelector('[data-action="preview"]').onclick = () => {
      if (typeof openCardArtPreview === "function") {
        openCardArtPreview(printing);
      }
    };
    div.querySelectorAll("[data-finish]").forEach(button => {
      button.onclick = () => addSpec(buildPrintingFinishCard(printing, button.dataset.finish));
    });

    container.appendChild(div);
  });

  ///////////////////////////////
  // HEADER CLICK EVENTS
  ///////////////////////////////

  document.querySelectorAll(".printing-header span").forEach(el => {
    if (el.dataset.sort) {
      el.style.cursor = "pointer";
    }

    el.onclick = () => {
      const key = el.dataset.sort;
      if (!key) return;

      if (printSortState.key === key) {
        printSortState.dir =
          printSortState.dir === "asc" ? "desc" : "asc";
      } else {
        printSortState.key = key;
        printSortState.dir = "asc";
      }

      renderPrintings();
    };
  });
}

function getPrintingSortValue(printing, key) {
  switch (key) {
    case "set":
      return printing.set || "";
    case "name":
      return printing.name || "";
    case "setname":
      return printing.set_name || "";
    case "number":
      return parseCollectorNumber(printing.collector_number);
    case "nonfoil":
      return getPrintingPriceSortValue(printing, "usd");
    case "foil":
      return getPrintingPriceSortValue(printing, "usd_foil");
    default:
      return printing.set_name || "";
  }
}

function getPrintingPriceSortValue(printing, priceKey) {
  const value = Number(printing.prices?.[priceKey] || 0);
  return value || null;
}

function parseCollectorNumber(value) {
  const number = String(value || "").match(/\d+/);
  return number ? Number(number[0]) : 0;
}

function comparePrintingValues(a, b) {
  if (typeof a === "number" || typeof b === "number") {
    return Number(a || 0) - Number(b || 0);
  }

  return String(a || "").localeCompare(String(b || ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function comparePrintingPrices(a, b, dir) {
  const missingA = !Number(a);
  const missingB = !Number(b);

  if (missingA && missingB) return 0;
  if (missingA) return dir === "asc" ? 1 : -1;
  if (missingB) return dir === "asc" ? -1 : 1;

  return Number(a) - Number(b);
}

function renderFinishAction(printing, foil) {
  const finish = foil ? "foil" : "nonfoil";
  const available = printing.finishes?.includes(finish);
  const price = foil ? printing.prices?.usd_foil : printing.prices?.usd;

  if (!available) {
    return `<span class="finish-action muted">-</span>`;
  }

  return `
    <span class="finish-action">
      <span>${price ? money(price) : "?"}</span>
      <button type="button" class="search-row-action" data-finish="${finish}">Add</button>
    </span>
  `;
}

function buildPrintingFinishCard(printing, finish) {
  if (finish !== "foil") return { ...printing, foil: false };

  return {
    ...printing,
    id: `${printing.id}|foil`,
    scryfall_id: printing.id,
    foil: true,
  };
}
