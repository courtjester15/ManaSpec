/*
====================================
SEARCH SYSTEM
====================================

CUT FROM app.js:

- handleSearch()
- search input listener
- debounce logic

Handles:
- Scryfall search
- fuzzy card lookup
- rendering search results
- handing selected cards to printings.js
====================================
*/

let debounce;

function initSearch() {
  const searchBox = document.getElementById("searchBox");
  if (!searchBox) return;

  searchBox.addEventListener("input", handleSearch);
}

async function handleSearch(e) {
  clearTimeout(debounce);

  debounce = setTimeout(async () => {
    const q = e.target.value.trim();

    const resultsBox = document.getElementById("searchResults");
    const printBox = document.getElementById("printingsView");

    if (q.length < 2) {
      resultsBox.innerHTML = "";
      printBox.innerHTML = "";
      return;
    }

    resultsBox.innerHTML = "Searching...";
    printBox.innerHTML = "";

    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(q)}`
      );

      const data = await res.json();
      const names = data.data || [];

      resultsBox.innerHTML = "";

      if (!names.length) {
        resultsBox.innerHTML = "No matches";
        return;
      }

      names.slice(0, 8).forEach(name => {
        const div = document.createElement("div");
        div.innerText = name;

        div.onclick = () => selectSearchResult(name);

        resultsBox.appendChild(div);
      });

    } catch (err) {
      console.error(err);
      resultsBox.innerHTML = "Error searching";
    }

  }, 300);
}

async function selectSearchResult(name) {
  const searchInput = document.getElementById("searchBox");
  const resultsBox = document.getElementById("searchResults");
  const printBox = document.getElementById("printingsView");

  searchInput.value = name;
  resultsBox.innerHTML = "";
  printBox.innerHTML = "Loading printings...";

  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`
    );

    const card = await res.json();

    if (card.object === "error") {
      printBox.innerHTML = "Could not load card";
      return;
    }

    showPrintings(card);
  } catch (err) {
    console.error(err);
    printBox.innerHTML = "Error loading card";
  }
}
