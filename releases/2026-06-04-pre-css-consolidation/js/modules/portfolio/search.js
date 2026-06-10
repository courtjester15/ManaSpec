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

function initSearch(options = {}) {
  const searchBox = document.getElementById(options.inputId || "searchBox");
  if (!searchBox) return;

  searchBox.value = options.query || searchBox.value || "";
  searchBox.addEventListener("input", handleSearch);
  ["searchMode", "searchMinPrice", "searchMaxPrice", "searchFoilOnly", "searchIncludeDigital"].forEach(id => {
    const control = document.getElementById(id);
    if (control) control.addEventListener("change", () => runSearch(searchBox));
  });

  if (searchBox.value.trim()) {
    runSearch(searchBox, 0, options.limit || 8);
  }
}

async function handleSearch(e) {
  runSearch(e.target);
}

async function runSearch(searchInput, delay = 300, limit = 8) {
  clearTimeout(debounce);

  debounce = setTimeout(async () => {
    const q = searchInput.value.trim();

    const resultsBox = document.getElementById("searchResults");
    const printBox = document.getElementById("printingsView");
    const searchMode = document.getElementById("searchMode")?.value || "autocomplete";
    const setNumberQuery = parseSetNumberQuery(q);

    if (q.length < 2) {
      resultsBox.innerHTML = "";
      printBox.innerHTML = "";
      return;
    }

    resultsBox.innerHTML = "Searching...";
    printBox.innerHTML = "";

    try {
      if (searchMode === "setNumber" || (searchMode === "autocomplete" && setNumberQuery)) {
        await runSetNumberSearch(q, resultsBox);
        return;
      }

      if (searchMode !== "autocomplete" || hasSearchFilters()) {
        await runAdvancedSearch(q, resultsBox, limit);
        return;
      }

      await runForgivingNameSearch(q, resultsBox, limit);

    } catch (err) {
      console.error(err);
      resultsBox.innerHTML = "Error searching";
    }

  }, delay);
}

async function runForgivingNameSearch(query, resultsBox, limit) {
  const candidates = [];

  await addAutocompleteCandidates(query, candidates, limit);
  await addOrderedFragmentNameCandidates(query, candidates, limit);
  await addPartialNameCandidates(query, candidates, limit);
  await addFuzzyNameCandidate(query, candidates);

  resultsBox.innerHTML = "";

  if (!candidates.length) {
    resultsBox.innerHTML = "No matches. Try fewer words or a set number like FIN 123.";
    return;
  }

  candidates.slice(0, limit).forEach(candidate => {
    resultsBox.appendChild(renderNameSearchCandidate(candidate));
  });
}

async function addAutocompleteCandidates(query, candidates, limit) {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`
    );

    const data = await res.json();
    const names = data.data || [];

    names.slice(0, limit).forEach(name => {
      addSearchCandidate(candidates, {
        name,
        source: "Name match",
        detail: "",
      });
    });
  } catch (err) {
    console.warn("Autocomplete search failed", err);
  }
}

async function addPartialNameCandidates(query, candidates, limit) {
  const tokens = getNameSearchTokens(query);
  if (!tokens.length) return;

  try {
    const nameQuery = withPaperSearchDefault(tokens.map(token => `name:${token}`).join(" "));
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(nameQuery)}&unique=cards&order=edhrec`
    );

    const data = await res.json();
    if (data.object === "error") return;

    filterSearchCards(data.data || []).slice(0, limit).forEach(card => {
      addSearchCandidate(candidates, {
        name: card.name,
        card,
        source: "Partial name",
        detail: card.type_line || card.set_name || "",
      });
    });
  } catch (err) {
    console.warn("Partial name search failed", err);
  }
}

async function addOrderedFragmentNameCandidates(query, candidates, limit) {
  const tokens = getNameSearchTokens(query);
  if (tokens.length < 2) return;

  try {
    const fragmentPattern = tokens.map(escapeRegexFragment).join(".*");
    const nameQuery = withPaperSearchDefault(`name:/${fragmentPattern}/`);
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(nameQuery)}&unique=cards&order=edhrec`
    );

    const data = await res.json();
    if (data.object === "error") return;

    filterSearchCards(data.data || []).slice(0, limit).forEach(card => {
      addSearchCandidate(candidates, {
        name: card.name,
        card,
        source: "Abbrev match",
        detail: card.type_line || card.set_name || "",
      });
    });
  } catch (err) {
    console.warn("Ordered fragment name search failed", err);
  }
}

async function addFuzzyNameCandidate(query, candidates) {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(query)}`
    );

    const card = await res.json();
    if (card.object === "error") return;

    if (filterSearchCards([card]).length) {
      addSearchCandidate(candidates, {
        name: card.name,
        card,
        source: "Fuzzy match",
        detail: card.type_line || card.set_name || "",
      });
    }
  } catch (err) {
    console.warn("Fuzzy name search failed", err);
  }
}

function addSearchCandidate(candidates, candidate) {
  const key = normalizeNameKey(candidate.name);
  if (!key || candidates.some(item => normalizeNameKey(item.name) === key)) return;

  candidates.push(candidate);
}

function renderNameSearchCandidate(candidate) {
  if (candidate.card) {
    return renderCardSearchResult(candidate.card);
  }

  const div = document.createElement("div");
  div.className = "search-result-row";
  div.innerHTML = `
    <strong>${candidate.name}</strong>
    <span>Load printings</span>
    <button type="button" class="search-row-action" data-action="printings">Printings</button>
  `;

  div.querySelector('[data-action="printings"]').onclick = () => {
    selectSearchResult(candidate.name);
  };

  return div;
}

function getNameSearchTokens(query) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map(token => token.trim())
    .filter(token => token.length >= 2);
}

function escapeRegexFragment(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeNameKey(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
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

async function runAdvancedSearch(query, resultsBox, limit) {
  const mode = document.getElementById("searchMode")?.value || "autocomplete";
  const scryfallQuery = withPaperSearchDefault(buildAdvancedScryfallQuery(query, mode));

  const res = await fetch(
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(scryfallQuery)}&unique=cards&order=name`
  );

  const data = await res.json();
  const cards = filterSearchCards(data.data || []).slice(0, limit);

  resultsBox.innerHTML = "";

  if (!cards.length) {
    resultsBox.innerHTML = "No matches";
    return;
  }

  cards.forEach(card => {
      resultsBox.appendChild(renderCardSearchResult(card));
  });
}

function buildAdvancedScryfallQuery(query, mode) {
  if (mode === "oracle") return `o:${quoteSearchTerm(query)}`;
  if (mode === "type") return `t:${quoteSearchTerm(query)}`;
  return query;
}

async function runSetNumberSearch(query, resultsBox) {
  const parsed = parseSetNumberQuery(query);
  const printBox = document.getElementById("printingsView");

  resultsBox.innerHTML = "";
  printBox.innerHTML = "";

  if (!parsed) {
    resultsBox.innerHTML = renderSetNumberHelp(query);
    return;
  }

  resultsBox.innerHTML = `Looking up ${parsed.setCode.toUpperCase()} #${parsed.collectorNumber}...`;

  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/${encodeURIComponent(parsed.setCode)}/${encodeURIComponent(parsed.collectorNumber)}`
    );

    const card = await res.json();

    if (card.object === "error") {
      resultsBox.innerHTML = `No card found for ${parsed.setCode.toUpperCase()} #${parsed.collectorNumber}`;
      return;
    }

    renderSetNumberResult(card, resultsBox);
  } catch (err) {
    console.error(err);
    resultsBox.innerHTML = "Error looking up set number";
  }
}

function renderSetNumberResult(card, resultsBox) {
  const div = document.createElement("div");
  div.className = "search-result-row";
  div.innerHTML = `
    <button type="button" class="link-action search-card-name" data-action="preview">${card.name}</button>
    <span>${card.set?.toUpperCase() || ""} #${card.collector_number || ""} - ${card.set_name || ""} - ${money(getCardSearchPrice(card))}</span>
    <button type="button" class="search-row-action" data-action="add">Add</button>
  `;

  div.querySelector('[data-action="preview"]').onclick = () => openCardArtPreview(card);
  div.querySelector('[data-action="add"]').onclick = () => {
    addSpec(card);
    resultsBox.innerHTML = "";
  };

  resultsBox.innerHTML = "";
  resultsBox.appendChild(div);
}

function initBulkSetLookup() {
  const lookupButton = document.getElementById("bulkSetLookup");
  const clearButton = document.getElementById("bulkSetClear");
  const input = document.getElementById("bulkSetInput");
  const results = document.getElementById("bulkSetResults");
  const status = document.getElementById("bulkSetStatus");

  if (!lookupButton || !clearButton || !input || !results || !status) return;

  lookupButton.addEventListener("click", runBulkSetLookup);
  clearButton.addEventListener("click", () => {
    input.value = "";
    results.innerHTML = "";
    status.innerText = "No bulk lookup yet";
  });
}

async function runBulkSetLookup() {
  const input = document.getElementById("bulkSetInput");
  const results = document.getElementById("bulkSetResults");
  const status = document.getElementById("bulkSetStatus");
  const lines = getBulkSetLines(input.value);

  results.innerHTML = "";

  if (!lines.length) {
    status.innerText = "Paste set-number lines first";
    return;
  }

  status.innerText = `Looking up ${lines.length} lines...`;

  const rows = [];
  for (const line of lines) {
    rows.push(await lookupBulkSetLine(line));
  }

  renderBulkSetResults(rows, results);

  const found = rows.filter(row => row.card).length;
  status.innerText = `${found} of ${rows.length} printings found`;
}

function getBulkSetLines(value) {
  return value
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

async function lookupBulkSetLine(line) {
  const parsed = parseSetNumberQuery(line);

  if (!parsed) {
    return {
      line,
      message: renderSetNumberHelp(line),
      card: null,
    };
  }

  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/${encodeURIComponent(parsed.setCode)}/${encodeURIComponent(parsed.collectorNumber)}`
    );
    const card = await res.json();

    if (card.object === "error") {
      return {
        line,
        message: `No card found for ${parsed.setCode.toUpperCase()} #${parsed.collectorNumber}`,
        card: null,
      };
    }

    return {
      line,
      message: "Found",
      card,
    };
  } catch (err) {
    console.error(err);
    return {
      line,
      message: "Lookup failed",
      card: null,
    };
  }
}

function renderBulkSetResults(rows, container) {
  if (!rows.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = rows.map((row, index) => renderBulkSetRow(row, index)).join("");

  container.querySelectorAll("[data-bulk-add]").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.bulkAdd);
      const row = rows[index];
      if (!row?.card) return;

      addSpec(row.card);
      button.disabled = true;
      button.innerText = "Added";
    });
  });
}

function renderBulkSetRow(row, index) {
  if (!row.card) {
    return `
      <div class="bulk-set-row failed">
        <span>${escapeSearchHtml(row.line)}</span>
        <strong>${escapeSearchHtml(row.message)}</strong>
      </div>
    `;
  }

  const card = row.card;
  const alreadyTracked = radar.some(item => item.id === card.id);

  return `
    <div class="bulk-set-row">
      <span>${escapeSearchHtml(row.line)}</span>
      <div>
        <strong>${card.name}</strong>
        <small>${card.set?.toUpperCase() || ""} #${card.collector_number || ""} - ${card.set_name || ""} - ${money(getCardSearchPrice(card))}</small>
      </div>
      <button type="button" data-bulk-add="${index}" ${alreadyTracked ? "disabled" : ""}>${alreadyTracked ? "Tracked" : "Add"}</button>
    </div>
  `;
}

function escapeSearchHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseSetNumberQuery(query) {
  const raw = query.trim().toLowerCase();
  if (!raw) return null;

  const normalized = raw
    .replace(/#/g, " ")
    .replace(/[-_:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const spacedMatch = normalized.match(/^([a-z0-9]{2,6})\s+([0-9]+[a-z]?)$/i);
  if (spacedMatch) {
    return {
      setCode: spacedMatch[1].toLowerCase(),
      collectorNumber: normalizeCollectorNumber(spacedMatch[2]),
    };
  }

  const reversedMatch = normalized.match(/^([0-9]+[a-z]?)\s+([a-z0-9]{2,6})$/i);
  if (reversedMatch) {
    return {
      setCode: reversedMatch[2].toLowerCase(),
      collectorNumber: normalizeCollectorNumber(reversedMatch[1]),
    };
  }

  const compactMatch = raw.match(/^([a-z]{3,6})#?([0-9]+[a-z]?)$/i);
  if (compactMatch) {
    return {
      setCode: compactMatch[1].toLowerCase(),
      collectorNumber: normalizeCollectorNumber(compactMatch[2]),
    };
  }

  return null;
}

function normalizeCollectorNumber(value) {
  return String(value || "").replace(/^0+(?=\d)/, "");
}

function renderSetNumberHelp(query) {
  const hasNumberOnly = /^#?\d+[a-z]?$/i.test(query.trim());
  const hasLettersOnly = /^[a-z][a-z0-9]{1,5}$/i.test(query.trim());

  if (hasNumberOnly) {
    return "Add a set code too, like FIN 123.";
  }

  if (hasLettersOnly) {
    return "Add a collector number too, like FIN 123.";
  }

  return "Use set code plus collector number, like FIN 123, FIN #123, or FIN123.";
}

function quoteSearchTerm(query) {
  return `"${query.replace(/"/g, "")}"`;
}

function hasSearchFilters() {
  return Boolean(
    document.getElementById("searchMinPrice")?.value ||
    document.getElementById("searchMaxPrice")?.value ||
    document.getElementById("searchFoilOnly")?.checked
  );
}

function filterSearchCards(cards) {
  const min = Number(document.getElementById("searchMinPrice")?.value || 0);
  const max = Number(document.getElementById("searchMaxPrice")?.value || 0);
  const foilOnly = Boolean(document.getElementById("searchFoilOnly")?.checked);
  const includeDigital = Boolean(document.getElementById("searchIncludeDigital")?.checked);

  return cards.filter(card => {
    const price = getCardSearchPrice(card, foilOnly);
    if (!includeDigital && !isPaperCard(card)) return false;
    if (foilOnly && !card.prices?.usd_foil) return false;
    if (min && price < min) return false;
    if (max && price > max) return false;
    return true;
  });
}

function renderCardSearchResult(card) {
  const div = document.createElement("div");
  div.className = "search-result-row";
  div.innerHTML = `
    <strong>${card.name}</strong>
    <span>${formatSearchCardMeta(card)}</span>
    <button type="button" class="search-row-action" data-action="printings">Printings</button>
  `;

  div.querySelector('[data-action="printings"]').onclick = () => {
    const resultsBox = document.getElementById("searchResults");
    const printBox = document.getElementById("printingsView");
    const searchInput = document.getElementById("searchBox");

    searchInput.value = card.name;
    resultsBox.innerHTML = "";
    printBox.innerHTML = "Loading printings...";
    showPrintings(card);
  };

  return div;
}

function formatSearchCardMeta(card) {
  const pieces = [
    card.type_line || card.set_name || "",
    card.edhrec_rank ? `EDH #${Number(card.edhrec_rank).toLocaleString()}` : "",
    money(getCardSearchPrice(card)),
  ].filter(Boolean);

  return pieces.join(" - ");
}

function isPaperCard(card) {
  return !Array.isArray(card.games) || card.games.includes("paper");
}

function withPaperSearchDefault(query) {
  if (document.getElementById("searchIncludeDigital")?.checked) return query;
  return `${query} game:paper`;
}

function openCardArtPreview(card) {
  const image = getCardPreviewImage(card);
  if (!image) return;

  let modal = document.getElementById("cardArtPreview");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "cardArtPreview";
    modal.className = "card-art-preview";
    modal.innerHTML = `
      <div class="card-art-backdrop" data-art-close></div>
      <section class="card-art-panel">
        <header>
          <strong id="cardArtPreviewTitle"></strong>
          <button type="button" data-art-close>Close</button>
        </header>
        <img id="cardArtPreviewImage" alt="">
      </section>
    `;

    document.body.appendChild(modal);
    modal.querySelectorAll("[data-art-close]").forEach(button => {
      button.addEventListener("click", closeCardArtPreview);
    });
  }

  document.getElementById("cardArtPreviewTitle").innerText = card.name || "Card preview";
  document.getElementById("cardArtPreviewImage").src = image;
  document.getElementById("cardArtPreviewImage").alt = card.name || "Card preview";
  modal.classList.add("open");
}

function closeCardArtPreview() {
  document.getElementById("cardArtPreview")?.classList.remove("open");
}

function getCardPreviewImage(card) {
  return card.image_uris?.normal
    || card.image_uris?.large
    || card.card_faces?.[0]?.image_uris?.normal
    || card.card_faces?.[0]?.image_uris?.large
    || "";
}

function getCardSearchPrice(card, preferFoil = false) {
  const prices = card.prices || {};
  const rawPrice = preferFoil
    ? prices.usd_foil || prices.usd
    : prices.usd || prices.usd_foil;

  return Number(rawPrice || 0);
}
