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
let latestSearchCandidates = [];
let activeSearchRequestId = 0;

function initSearch(options = {}) {
  const searchBox = document.getElementById(options.inputId || "searchBox");
  if (!searchBox) return;

  searchBox.value = options.query || searchBox.value || "";
  searchBox.addEventListener("input", handleSearch);
  searchBox.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      dismissRadarSearchSurface();
      return;
    }

    if (event.key !== "Enter") return;

    event.preventDefault();
    openCurrentSearchCandidate(searchBox.value);
  });
  installRadarSearchEscapeHandler();
  installRadarSearchOutsideDismissHandler();

  if (searchBox.value.trim()) {
    runSearch(searchBox, 0, options.limit || 8);
  }
}

function installRadarSearchEscapeHandler() {
  if (window.radarSearchEscapeHandlerInstalled) return;
  window.radarSearchEscapeHandlerInstalled = true;

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (!document.getElementById("searchBox")) return;
    if (document.getElementById("appConfirmDialog")?.classList.contains("open")) return;

    if (!hasActiveRadarSearchSurface()) return;

    dismissRadarSearchSurface();
  });
}

function installRadarSearchOutsideDismissHandler() {
  if (window.radarSearchOutsideDismissHandlerInstalled) return;
  window.radarSearchOutsideDismissHandlerInstalled = true;

  document.addEventListener("pointerdown", event => {
    if (!document.getElementById("searchBox")) return;
    if (!hasActiveRadarSearchSurface()) return;
    if (event.target.closest(".module-context-card--search")) return;
    if (event.target.closest(".card-detail-modal, .card-art-preview, .app-confirm-dialog")) return;

    dismissRadarSearchSurface();
  });
}

function hasActiveRadarSearchSurface() {
  return Boolean(
    document.getElementById("searchResults")?.textContent.trim() ||
    document.getElementById("printingsView")?.textContent.trim()
  );
}

function dismissRadarSearchSurface(options = {}) {
  clearTimeout(debounce);
  activeSearchRequestId += 1;
  latestSearchCandidates = [];
  if (typeof currentPrintings !== "undefined" && Array.isArray(currentPrintings)) currentPrintings = [];

  const resultsBox = document.getElementById("searchResults");
  const printBox = document.getElementById("printingsView");
  const searchBox = document.getElementById("searchBox");

  if (resultsBox) resultsBox.innerHTML = "";
  if (printBox) printBox.innerHTML = "";
  setSearchBusy(resultsBox, false);
  setSearchBusy(printBox, false);
  if (options.clearInput && searchBox) searchBox.value = "";
  if (options.blurInput && searchBox) searchBox.blur();
}

async function handleSearch(e) {
  runSearch(e.target);
}

async function runSearch(searchInput, delay = 300, limit = 8) {
  clearTimeout(debounce);

  debounce = setTimeout(async () => {
    const requestId = ++activeSearchRequestId;
    const q = searchInput.value.trim();

    const resultsBox = document.getElementById("searchResults");
    const printBox = document.getElementById("printingsView");
    const setNumberQuery = parseSetNumberQuery(q);

    if (q.length < 2) {
      resultsBox.innerHTML = "";
      printBox.innerHTML = "";
      setSearchBusy(resultsBox, false);
      setSearchBusy(printBox, false);
      latestSearchCandidates = [];
      return;
    }

    renderSearchStatus(resultsBox, setNumberQuery ? "Looking up exact printing..." : "Searching Scryfall...");
    printBox.innerHTML = "";
    setSearchBusy(printBox, false);

    try {
      if (setNumberQuery) {
        await runSetNumberSearch(q, resultsBox, requestId);
        return;
      }

      await runForgivingNameSearch(q, resultsBox, limit, requestId);

    } catch (err) {
      console.error(err);
      if (!isCurrentSearchRequest(requestId)) return;
      resultsBox.innerHTML = "Error searching";
      setSearchBusy(resultsBox, false);
    }

  }, delay);
}

async function runForgivingNameSearch(query, resultsBox, limit, requestId = activeSearchRequestId) {
  const candidates = [];

  await addAutocompleteCandidates(query, candidates, limit);
  if (!isCurrentSearchRequest(requestId)) return;
  await addOrderedFragmentNameCandidates(query, candidates, limit);
  if (!isCurrentSearchRequest(requestId)) return;
  await addPartialNameCandidates(query, candidates, limit);
  if (!isCurrentSearchRequest(requestId)) return;
  await addFuzzyNameCandidate(query, candidates);
  if (!isCurrentSearchRequest(requestId)) return;

  resultsBox.innerHTML = "";
  setSearchBusy(resultsBox, false);

  if (!candidates.length) {
    resultsBox.innerHTML = "No matches. Try fewer words or a set number like FIN 123.";
    latestSearchCandidates = [];
    return;
  }

  latestSearchCandidates = candidates.slice(0, limit);
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
  if (!key) return;

  const existing = candidates.find(item => normalizeNameKey(item.name) === key);
  if (existing) {
    if (!existing.card && candidate.card) {
      Object.assign(existing, candidate);
    }
    return;
  }

  candidates.push(candidate);
}

function renderNameSearchCandidate(candidate) {
  if (candidate.card) {
    return renderCardSearchResult(candidate.card);
  }

  const div = document.createElement("div");
  div.className = "search-result-row search-result-row--card search-result-row--clickable";
  div.tabIndex = 0;
  div.innerHTML = `
    <span class="search-result-identity">${candidate.name}</span>
  `;

  div.addEventListener("click", () => selectSearchResult(candidate.name));
  div.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectSearchResult(candidate.name);
    }
  });

  return div;
}

function openCurrentSearchCandidate(query) {
  const firstCandidate = latestSearchCandidates[0];

  if (firstCandidate?.card) {
    openCardSearchResult(firstCandidate.card);
    return;
  }

  selectSearchResult(firstCandidate?.name || query);
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
  const requestId = ++activeSearchRequestId;

  searchInput.value = name;
  resultsBox.innerHTML = "";
  setSearchBusy(resultsBox, false);

  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`
    );

    const card = await res.json();
    if (!isCurrentSearchRequest(requestId)) return;

    if (card.object === "error") {
      printBox.innerHTML = "Could not load card";
      setSearchBusy(printBox, false);
      return;
    }

    showPrintings(card, requestId);
  } catch (err) {
    console.error(err);
    if (!isCurrentSearchRequest(requestId)) return;
    printBox.innerHTML = "Error loading card";
    setSearchBusy(printBox, false);
  }
}

async function runAdvancedSearch(query, resultsBox, limit) {
  const scryfallQuery = withPaperSearchDefault(query);

  const res = await fetch(
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(scryfallQuery)}&unique=cards&order=name`
  );

  const data = await res.json();
  const cards = filterSearchCards(data.data || []).slice(0, limit);
  latestSearchCandidates = cards.map(card => ({ name: card.name, card }));

  resultsBox.innerHTML = "";

  if (!cards.length) {
    resultsBox.innerHTML = "No matches";
    latestSearchCandidates = [];
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

async function runSetNumberSearch(query, resultsBox, requestId = activeSearchRequestId) {
  const parsed = parseSetNumberQuery(query);
  const printBox = document.getElementById("printingsView");

  resultsBox.innerHTML = "";
  printBox.innerHTML = "";
  setSearchBusy(printBox, false);

  if (!parsed) {
    resultsBox.innerHTML = renderSetNumberHelp(query);
    setSearchBusy(resultsBox, false);
    return;
  }

  renderSearchStatus(resultsBox, `Looking up ${parsed.setCode.toUpperCase()} #${parsed.collectorNumber}...`);

  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/${encodeURIComponent(parsed.setCode)}/${encodeURIComponent(parsed.collectorNumber)}`
    );

    const card = await res.json();
    if (!isCurrentSearchRequest(requestId)) return;

    if (card.object === "error") {
      resultsBox.innerHTML = `No card found for ${parsed.setCode.toUpperCase()} #${parsed.collectorNumber}`;
      setSearchBusy(resultsBox, false);
      return;
    }

    setSearchBusy(resultsBox, false);
    renderSetNumberResult(card, resultsBox);
  } catch (err) {
    console.error(err);
    if (!isCurrentSearchRequest(requestId)) return;
    resultsBox.innerHTML = "Error looking up set number";
    setSearchBusy(resultsBox, false);
  }
}

function renderSetNumberResult(card, resultsBox) {
  const div = document.createElement("div");
  div.className = "search-result-row search-result-row--action";
  div.innerHTML = `
    <button type="button" class="link-action search-card-name" data-action="preview">${card.name}</button>
    <span>${card.set?.toUpperCase() || ""} #${card.collector_number || ""} - ${card.set_name || ""} - ${money(getCardSearchPrice(card))}</span>
    <button type="button" class="search-row-action" data-action="add">Add</button>
  `;

  div.querySelector('[data-action="preview"]').onclick = () => openCardArtPreview(card);
  div.querySelector('[data-action="add"]').onclick = async () => {
    await addSpec(card);
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
  return false;
}

function filterSearchCards(cards) {
  return cards.filter(card => {
    return isPaperCard(card);
  });
}

function renderCardSearchResult(card) {
  const div = document.createElement("div");
  div.className = "search-result-row search-result-row--card search-result-row--clickable";
  div.tabIndex = 0;
  div.innerHTML = `
    <span class="search-result-identity">${formatCardSearchIdentity(card)}</span>
  `;

  div.addEventListener("click", () => openCardSearchResult(card));
  div.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCardSearchResult(card);
    }
  });

  return div;
}

function openCardSearchResult(card) {
  const resultsBox = document.getElementById("searchResults");
  const printBox = document.getElementById("printingsView");
  const searchInput = document.getElementById("searchBox");

  searchInput.value = card.name;
  resultsBox.innerHTML = "";
  const requestId = ++activeSearchRequestId;
  setSearchBusy(resultsBox, false);
  showPrintings(card, requestId);
}

function renderSearchStatus(container, message) {
  if (!container) return;

  container.innerHTML = `
    <div class="search-status-row" role="status">
      <span class="search-status-spinner" aria-hidden="true"></span>
      <span>${escapeSearchHtml(message)}</span>
    </div>
  `;
  setSearchBusy(container, true);
}

function setSearchBusy(container, isBusy) {
  if (!container) return;
  container.classList.toggle("is-loading", Boolean(isBusy));
  container.setAttribute("aria-busy", isBusy ? "true" : "false");
}

function isCurrentSearchRequest(requestId) {
  return requestId === activeSearchRequestId;
}

function formatCardSearchIdentity(card) {
  return [
    card.name || "",
    getSearchPrimaryType(card),
    getSearchColorLabel(card),
  ].filter(Boolean).join(" | ");
}

function getSearchPrimaryType(card) {
  if (typeof getPrimaryType === "function") return getPrimaryType(card);

  const typeLine = String(card.type_line || "");
  const primary = typeLine.split(/[—-]/)[0].trim().split(/\s+/).pop();
  return primary || "";
}

function getSearchColorLabel(card) {
  if (typeof getColorLabel === "function") return getColorLabel(card);

  const colors = card.color_identity || card.colors || [];
  if (!colors.length) return "C";
  if (colors.length > 1) return "M";
  return colors[0];
}

function isPaperCard(card) {
  return !Array.isArray(card.games) || card.games.includes("paper");
}

function withPaperSearchDefault(query) {
  return `${query} game:paper`;
}

async function openCardArtPreview(card) {
  let previewCard = card;
  let image = getCardPreviewImage(previewCard);

  if (!image) {
    previewCard = await loadCardPreviewSource(card);
    image = getCardPreviewImage(previewCard);
  }

  if (!image) {
    if (previewCard?.id && typeof openCardDetail === "function") {
      openCardDetail(previewCard.id, "portfolio");
    }
    return;
  }

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

  document.getElementById("cardArtPreviewTitle").innerText = previewCard.name || "Card preview";
  document.getElementById("cardArtPreviewImage").src = image;
  document.getElementById("cardArtPreviewImage").alt = previewCard.name || "Card preview";
  modal.classList.add("open");
  ensureCardArtEscapeHandler();
}

function closeCardArtPreview() {
  document.getElementById("cardArtPreview")?.classList.remove("open");
}

async function loadCardPreviewSource(card) {
  if (!card?.id && !card?.scryfall_id) return card;

  try {
    const res = await fetch(`https://api.scryfall.com/cards/${encodeURIComponent(card.scryfall_id || card.id)}`);
    const fetched = await res.json();
    if (fetched.object === "error") return card;
    return { ...card, ...fetched };
  } catch (err) {
    console.error(err);
    return card;
  }
}

function ensureCardArtEscapeHandler() {
  if (window.cardArtEscapeHandlerInstalled) return;
  window.cardArtEscapeHandlerInstalled = true;
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCardArtPreview();
  });
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
