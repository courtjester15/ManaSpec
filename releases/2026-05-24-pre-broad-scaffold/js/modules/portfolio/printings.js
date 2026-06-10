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
  key: "set",
  dir: "asc"
};

///////////////////////////////
// SORT ARROWS
///////////////////////////////

function getSortArrow(key) {
  if (printSortState.key !== key) return "";
  return printSortState.dir === "asc" ? " ▲" : " ▼";
}

///////////////////////////////
// SORT ENGINE
///////////////////////////////

function sortPrintings(list) {
  const { key, dir } = printSortState;

  const sorted = [...list];

  sorted.sort((a, b) => {
    let valA, valB;

    switch (key) {
      case "price":
        valA = parseFloat(a.prices.usd || 0);
        valB = parseFloat(b.prices.usd || 0);
        break;

      case "name":
        valA = a.name;
        valB = b.name;
        break;

      case "setname":
        valA = a.set_name;
        valB = b.set_name;
        break;

      case "number":
        valA = parseInt(a.collector_number || 0);
        valB = parseInt(b.collector_number || 0);
        break;

      default:
        valA = a.set_name;
        valB = b.set_name;
    }

    if (valA < valB) return dir === "asc" ? -1 : 1;
    if (valA > valB) return dir === "asc" ? 1 : -1;
    return 0;
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

  const res = await fetch(
    `https://api.scryfall.com/cards/search?q=oracleid:${fullCard.oracle_id}&unique=prints`
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
      <span data-sort="price">PRICE${getSortArrow("price")}</span>

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
      <span>${printing.name}</span>
      <span>${printing.set_name}</span>
      <span>$${printing.prices.usd || "?"}</span>
    `;

    div.onclick = () => addSpec(printing);

    container.appendChild(div);
  });

  ///////////////////////////////
  // HEADER CLICK EVENTS
  ///////////////////////////////

  document.querySelectorAll(".printing-header span").forEach(el => {
    el.style.cursor = "pointer";

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