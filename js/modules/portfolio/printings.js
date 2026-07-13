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

async function showPrintings(card, searchRequestId = null) {
  const container = document.getElementById("printingsView");
  const statusContainer = document.getElementById("searchResults") || container;

  if (container) {
    container.innerHTML = "";
    if (typeof setSearchBusy === "function") setSearchBusy(container, false);
  }

  if (statusContainer && typeof renderSearchStatus === "function") {
    renderSearchStatus(statusContainer, "Searching Scryfall...");
  } else if (statusContainer) {
    statusContainer.innerHTML = "Searching Scryfall...";
  }

  try {
    const full = await fetch(`https://api.scryfall.com/cards/${card.id}`);
    const fullCard = await full.json();

    const query = typeof withPaperSearchDefault === "function"
      ? withPaperSearchDefault(`oracleid:${fullCard.oracle_id}`)
      : `oracleid:${fullCard.oracle_id}`;

    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints`
    );

    const data = await res.json();

    if (searchRequestId && typeof isCurrentSearchRequest === "function" && !isCurrentSearchRequest(searchRequestId)) {
      return;
    }

    currentPrintings = data.data || [];

    if (typeof setSearchBusy === "function") setSearchBusy(statusContainer, false);
    if (statusContainer && statusContainer !== container) statusContainer.innerHTML = "";
    renderPrintings();
  } catch (err) {
    console.error(err);
    if (typeof setSearchBusy === "function") setSearchBusy(statusContainer, false);
    if (statusContainer && statusContainer !== container) statusContainer.innerHTML = "";
    if (container) container.innerHTML = "Error loading printings";
  }
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
    <div class="printing-picker-header">
      <span data-sort="set">Set${getSortArrow("set")}</span>
      <span data-sort="number">#${getSortArrow("number")}</span>
      <span data-sort="name">Card${getSortArrow("name")}</span>
      <span data-sort="setname">Set Name${getSortArrow("setname")}</span>
      <span data-sort="nonfoil">NF${getSortArrow("nonfoil")}</span>
      <span data-sort="foil">F${getSortArrow("foil")}</span>
      <span>Add</span>
    </div>
  `;

  ///////////////////////////////
  // ROWS
  ///////////////////////////////

  printings.forEach(printing => {
    const div = document.createElement("div");
    div.className = "printing-picker-row";

    const num = String(printing.collector_number || "").padStart(3, "0");

    div.innerHTML = `
      <span class="printing-picker-set">${printing.set.toUpperCase()}</span>
      <span class="printing-picker-number">${num}</span>
      <button type="button" class="printing-picker-card" data-action="preview">${printing.name}</button>
      <span class="printing-picker-set-name">${printing.set_name}</span>
      <span class="printing-picker-price">${renderPrintingPriceCell(printing, "nonfoil")}</span>
      <span class="printing-picker-price">${renderPrintingPriceCell(printing, "foil")}</span>
      <button type="button" class="search-row-action" data-action="select">Add</button>
    `;

    div.querySelector('[data-action="preview"]').onclick = () => {
      if (typeof openCardArtPreview === "function") {
        openCardArtPreview(printing);
      }
    };
    div.querySelector('[data-action="select"]').onclick = () => addSpec(printing);

    container.appendChild(div);
  });

  ///////////////////////////////
  // HEADER CLICK EVENTS
  ///////////////////////////////

  document.querySelectorAll(".printing-picker-header [data-sort]").forEach(el => {
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

function renderPrintingPriceCell(printing, finish) {
  const finishes = Array.isArray(printing.finishes) ? printing.finishes : [];
  const isFoil = finish === "foil";
  const available = isFoil
    ? finishes.includes("foil")
    : (!finishes.length || finishes.includes("nonfoil"));

  if (!available) return "-";

  const price = isFoil ? printing.prices?.usd_foil : printing.prices?.usd;
  return price ? money(price) : "?";
}

function buildPrintingFinishCard(printing, finish) {
  if (finish === "nonfoil") return { ...printing, finish, foil: false };

  return {
    ...printing,
    id: `${printing.id}|${finish}`,
    scryfall_id: printing.id,
    finish,
    foil: finish === "foil",
  };
}
