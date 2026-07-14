/* Runtime-only Scryfall printing research for Card Detail. */

const COMPARABLE_PRINTING_FINISHES = ["nonfoil", "foil", "etched"];
const COMPARABLE_PRINTINGS_INITIAL_ROWS = 10;
const comparablePrintingsCache = new Map();

function getSupportedFinishPrice(card, finish) {
  const field = { nonfoil: "usd", foil: "usd_foil", etched: "usd_etched" }[finish];
  const raw = field ? card?.prices?.[field] : null;
  if (raw === null || raw === undefined || raw === "") return null;
  const price = Number(raw);
  return Number.isFinite(price) ? price : null;
}

function isPaperPrinting(card) {
  return Boolean(card?.id) && Array.isArray(card.games) && card.games.includes("paper") && card.digital !== true;
}

function getTrackedPrintingFinish(item) {
  if (typeof ManaSpecDataFoundation?.normalizeFinish === "function") {
    return ManaSpecDataFoundation.normalizeFinish(item) || "nonfoil";
  }
  return item?.finish || (item?.foil ? "foil" : "nonfoil");
}

function getComparablePrintingFinishRows(cards) {
  const seen = new Set();
  const rows = [];
  (Array.isArray(cards) ? cards : []).filter(isPaperPrinting).forEach(card => {
    const finishes = Array.isArray(card.finishes) ? card.finishes : [];
    COMPARABLE_PRINTING_FINISHES.forEach(finish => {
      if (!finishes.includes(finish)) return;
      const key = `${card.id}|${finish}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push({
        key,
        id: card.id,
        finish,
        setCode: String(card.set || "").toUpperCase(),
        setName: card.set_name || "",
        collectorNumber: String(card.collector_number || ""),
        releasedAt: card.released_at || "",
        price: getSupportedFinishPrice(card, finish),
        scryfallUri: card.scryfall_uri || "",
        tcgplayerUri: card.purchase_uris?.tcgplayer || "",
        card,
      });
    });
  });
  return rows;
}

function isCurrentTrackedPrinting(row, trackedContext) {
  return row?.id === trackedContext?.scryfallId && row?.finish === trackedContext?.finish;
}

function sortComparablePrintingRows(rows, trackedContext, sortState = { field: "releasedAt", direction: "desc" }) {
  const direction = sortState.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const currentDifference = Number(isCurrentTrackedPrinting(b, trackedContext)) - Number(isCurrentTrackedPrinting(a, trackedContext));
    if (currentDifference) return currentDifference;

    if (sortState.field === "price") {
      if (a.price === null && b.price !== null) return 1;
      if (a.price !== null && b.price === null) return -1;
      if (a.price !== null && b.price !== null && a.price !== b.price) return (a.price - b.price) * direction;
    } else {
      const dateA = getComparableReleaseTimestamp(a.releasedAt);
      const dateB = getComparableReleaseTimestamp(b.releasedAt);
      if (dateA === null && dateB !== null) return 1;
      if (dateA !== null && dateB === null) return -1;
      if (dateA !== null && dateB !== null && dateA !== dateB) return (dateA - dateB) * direction;
    }

    return getComparableReleaseTieBreak(b) - getComparableReleaseTieBreak(a)
      || a.setCode.localeCompare(b.setCode)
      || a.collectorNumber.localeCompare(b.collectorNumber, undefined, { numeric: true })
      || a.finish.localeCompare(b.finish);
  });
}

function getComparableReleaseTimestamp(value) {
  const timestamp = value ? Date.parse(`${value}T00:00:00Z`) : NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getComparableReleaseTieBreak(row) {
  return getComparableReleaseTimestamp(row.releasedAt) ?? -Infinity;
}

function getComparableTrackedContext(item, currentCard) {
  return { scryfallId: currentCard?.id || getScryfallCardId(item), finish: getTrackedPrintingFinish(item) };
}

async function fetchAllComparablePrintings(printsSearchUri) {
  if (!printsSearchUri) throw new Error("Missing Scryfall prints URI.");
  if (comparablePrintingsCache.has(printsSearchUri)) return comparablePrintingsCache.get(printsSearchUri);
  const request = (async () => {
    const cards = [];
    let nextPage = printsSearchUri;
    while (nextPage) {
      const response = await fetch(nextPage);
      if (!response.ok) throw new Error(`Scryfall returned ${response.status}.`);
      const payload = await response.json();
      if (payload?.object === "error" || !Array.isArray(payload?.data)) throw new Error("Scryfall returned invalid printing data.");
      cards.push(...payload.data);
      nextPage = payload.has_more && payload.next_page ? payload.next_page : "";
    }
    return cards;
  })();
  comparablePrintingsCache.set(printsSearchUri, request);
  try {
    return await request;
  } catch (error) {
    comparablePrintingsCache.delete(printsSearchUri);
    throw error;
  }
}

function renderComparablePrintingsSection(state = {}) {
  const { status = "loading", rows = [], trackedContext = {}, visibleCount = COMPARABLE_PRINTINGS_INITIAL_ROWS } = state;
  if (status === "loading") return renderComparablePrintingsFrame('<p class="comparable-printings-status">Loading comparable printings&hellip;</p>');
  if (status === "error") return renderComparablePrintingsFrame(`
    <div class="comparable-printings-status comparable-printings-error"><span>Comparable printings could not be loaded.</span><button type="button" class="comparable-printings-retry" data-action="retry-comparable-printings">Retry</button></div>
  `);
  if (!rows.length || (rows.length === 1 && isCurrentTrackedPrinting(rows[0], trackedContext))) {
    return renderComparablePrintingsFrame('<p class="comparable-printings-status">No other supported paper printings found.</p>');
  }
  const shownCount = Math.min(visibleCount, rows.length);
  const hasMissingPrice = rows.some(row => row.price === null);
  return renderComparablePrintingsFrame(`
    <div id="comparablePrintingsTable"></div>
    ${renderComparablePrintingsControls(shownCount, rows.length)}
    ${hasMissingPrice ? '<p class="comparable-printings-note">Some printings do not currently have a supported Scryfall price.</p>' : ""}
  `, `${shownCount} of ${rows.length} finishes`);
}

function renderComparablePrintingsControls(shownCount, totalCount) {
  if (totalCount <= COMPARABLE_PRINTINGS_INITIAL_ROWS) return "";
  const expanded = shownCount > COMPARABLE_PRINTINGS_INITIAL_ROWS;
  return `<div class="comparable-printings-controls" aria-label="Comparable printing display controls">
    ${shownCount < totalCount ? '<button type="button" data-comparable-display="more">Show 10 More</button>' : ""}
    ${shownCount < totalCount ? `<button type="button" data-comparable-display="all">Show All (${totalCount})</button>` : ""}
    ${expanded ? '<button type="button" data-comparable-display="collapse">Collapse</button>' : ""}
  </div>`;
}

function renderComparablePrintingsFrame(content, meta = "Scryfall paper prices") {
  return `<section class="detail-command-section comparable-printings-section" id="comparablePrintingsSection">
    <div class="detail-section-heading"><h4>Comparable Printings</h4><span>${escapeHtml(meta)}</span></div>${content}
  </section>`;
}

function getComparablePrintingColumns(trackedContext, currentPrice) {
  return [
    {
      label: "Printing",
      html: (row, index) => `<button type="button" class="link-action comparable-card-helper" data-ms-action="art" data-ms-row="${index}" aria-label="Preview exact artwork for ${msEscapeAttr(row.card?.name || "card")}">${msEscapeHtml(row.card?.name || "Unknown card")}</button><span class="comparable-printing-identity">${msEscapeHtml(row.setCode || "-")} &middot; #${msEscapeHtml(row.collectorNumber || "-")}</span>${isCurrentTrackedPrinting(row, trackedContext) ? '<mark class="current-printing-badge">Current</mark>' : ""}`,
      title: row => row.setName,
    },
    { label: "Finish", value: row => formatComparableFinish(row.finish) },
    { label: "Released", value: row => formatComparableRelease(row.releasedAt), align: "center", sortKey: "releasedAt" },
    { label: "Price", value: row => row.price === null ? "—" : money(row.price), align: "money", sortKey: "price" },
    {
      label: "vs Current",
      value: row => formatComparablePriceDifference(
        !isCurrentTrackedPrinting(row, trackedContext) && row.price !== null && currentPrice !== null ? row.price - currentPrice : null,
        isCurrentTrackedPrinting(row, trackedContext)
      ),
      align: "money",
    },
    { label: "Actions", html: (row, index) => renderComparablePrintingActions(row, index), align: "actions", className: "comparable-actions-cell" },
  ];
}

function renderComparablePrintingActions(row, index) {
  const trackedState = getComparablePrintingTrackedState(row);
  return `<span class="comparable-row-actions">
    ${row.tcgplayerUri ? `<a class="comparable-action-slot comparable-action-slot--tcg" href="${msEscapeAttr(row.tcgplayerUri)}" target="_blank" rel="noopener">TCG</a>` : '<span class="comparable-action-slot comparable-action-slot--tcg is-unavailable" aria-label="TCGplayer unavailable">—</span>'}
    ${row.scryfallUri ? `<a class="comparable-action-slot comparable-action-slot--scryfall" href="${msEscapeAttr(row.scryfallUri)}" target="_blank" rel="noopener">Scryfall</a>` : '<span class="comparable-action-slot comparable-action-slot--scryfall is-unavailable" aria-label="Scryfall unavailable">—</span>'}
    ${trackedState ? `<span class="comparable-action-slot comparable-action-slot--state comparable-tracked-state">${msEscapeHtml(trackedState)}</span>` : `<button type="button" class="comparable-action-slot comparable-action-slot--state" data-ms-action="add-radar" data-ms-row="${index}">Add to Radar</button>`}
  </span>`;
}

function getComparablePrintingTrackedState(row) {
  if (specs.some(item => getScryfallCardId(item) === row.id && getTrackedPrintingFinish(item) === row.finish)) return "Owned";
  if (radar.some(item => getScryfallCardId(item) === row.id && getTrackedPrintingFinish(item) === row.finish)) return "In Radar";
  return "";
}

function formatComparableFinish(finish) {
  return finish === "nonfoil" ? "Nonfoil" : finish.charAt(0).toUpperCase() + finish.slice(1);
}

function formatComparableRelease(value) {
  const date = value ? new Date(`${value}T00:00:00`) : null;
  return !date || Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString([], { year: "numeric", month: "short" });
}

function formatComparablePriceDifference(difference, current) {
  if (current) return "—";
  if (difference === null || !Number.isFinite(difference)) return "-";
  if (Math.abs(difference) < 0.005) return "Same";
  return `${difference > 0 ? "+" : "-"}${money(Math.abs(difference))}`;
}

function showComparablePrintings(state) {
  const mount = document.getElementById("comparablePrintingsSection");
  if (!mount) return;
  mount.outerHTML = renderComparablePrintingsSection(state);
  if (state.status !== "ready") return;

  const shownRows = state.rows.slice(0, state.visibleCount);
  renderStandardTable(document.getElementById("comparablePrintingsTable"), {
    tableClass: "ms-table--comparable-printings",
    rows: shownRows,
    columns: getComparablePrintingColumns(state.trackedContext, state.currentPrice),
    getRowId: row => row.key,
    rowClass: row => isCurrentTrackedPrinting(row, state.trackedContext) ? "is-current" : "",
    sortState: state.sortState,
    onSort: field => {
      const sortState = { ...state.sortState };
      updateStandardSort(sortState, field, field === "releasedAt" ? "desc" : "asc");
      showComparablePrintings({
        ...state,
        rows: sortComparablePrintingRows(state.rows, state.trackedContext, sortState),
        sortState,
      });
    },
    onAction: async (action, row) => {
      if (action === "art") {
        openComparablePrintingArtPreview(row);
        return;
      }
      if (action !== "add-radar") return;
      const exactFinishCard = { ...row.card, finishes: [row.finish], finish: row.finish, foil: row.finish === "foil" };
      await addSpec(exactFinishCard);
      if (isActiveCardDetailRequest(state.requestToken, state.trackedContext.scryfallId)) showComparablePrintings(state);
    },
  });

  document.querySelectorAll("[data-comparable-display]").forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.comparableDisplay;
      const visibleCount = action === "collapse"
        ? COMPARABLE_PRINTINGS_INITIAL_ROWS
        : action === "all"
          ? state.rows.length
          : Math.min(state.rows.length, state.visibleCount + 10);
      showComparablePrintings({ ...state, visibleCount });
      document.getElementById("comparablePrintingsSection")?.scrollIntoView({ block: "nearest" });
    });
  });
}

function openComparablePrintingArtPreview(row) {
  if (typeof openCardArtPreview === "function") openCardArtPreview(row.card);
}

async function loadComparablePrintings(item, currentCard, requestToken) {
  const trackedContext = getComparableTrackedContext(item, currentCard);
  try {
    const cards = await fetchAllComparablePrintings(currentCard?.prints_search_uri);
    if (!isActiveCardDetailRequest(requestToken, trackedContext.scryfallId)) return;
    const sortState = { field: "releasedAt", direction: "desc" };
    const rows = sortComparablePrintingRows(getComparablePrintingFinishRows(cards), trackedContext, sortState);
    const currentRow = rows.find(row => isCurrentTrackedPrinting(row, trackedContext));
    const currentPrice = currentRow?.price ?? getSupportedFinishPrice(currentCard, trackedContext.finish);
    showComparablePrintings({ status: "ready", rows, trackedContext, currentPrice, visibleCount: COMPARABLE_PRINTINGS_INITIAL_ROWS, sortState, requestToken });
  } catch (error) {
    console.error(error);
    if (!isActiveCardDetailRequest(requestToken, trackedContext.scryfallId)) return;
    showComparablePrintings({ status: "error" });
    document.querySelector('[data-action="retry-comparable-printings"]')?.addEventListener("click", () => {
      document.getElementById("comparablePrintingsSection").outerHTML = renderComparablePrintingsSection({ status: "loading" });
      loadComparablePrintings(item, currentCard, requestToken);
    });
  }
}
