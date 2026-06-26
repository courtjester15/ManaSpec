/*
====================================
CARD DETAIL CHECK
====================================

Live item check panel for price, movement, and market signals.
====================================
*/

let activeCardDetail = null;

async function openCardDetail(cardId, source = "portfolio", options = {}) {
  const tracked = findTrackedCardSource(cardId, source);
  const item = tracked?.item;
  if (!item) return;

  activeCardDetail = { cardId, source: tracked.source, focusNotes: Boolean(options.focusNotes) };
  renderCardDetailShell(item);

  try {
    const res = await fetch(`https://api.scryfall.com/cards/${getScryfallCardId(item)}`);
    const card = await res.json();

    if (card.object === "error") {
      renderCardDetailError(item, "Could not load live card data.");
      return;
    }

    syncCardMetadata(item, card);
    syncTrackedCardPrice(item, card);
    renderCardDetail(item, card, tracked.source, options);
  } catch (err) {
    console.error(err);
    renderCardDetailError(item, "Live check failed.");
  }
}

function findTrackedCard(cardId, source) {
  return findTrackedCardSource(cardId, source)?.item || null;
}

function findTrackedCardSource(cardId, preferredSource) {
  const position = specs.find(spec => spec.id === cardId);
  const radarItem = radar.find(item => item.id === cardId);

  if (preferredSource === "radar" && radarItem) return { item: radarItem, source: "radar" };
  if (preferredSource === "portfolio" && position) return { item: position, source: "portfolio" };
  if (position) return { item: position, source: "portfolio" };
  if (radarItem) return { item: radarItem, source: "radar" };

  return null;
}

function getScryfallCardId(item) {
  return item.scryfall_id || String(item.id || "").replace(/\|(foil|nonfoil)$/i, "");
}

function renderCardDetailShell(item) {
  ensureCardDetailModal();
  document.getElementById("cardDetailBody").innerHTML = `
    <div class="detail-loading">
      <strong>${escapeHtml(item.name)}</strong>
      <span>Checking live card data...</span>
    </div>
  `;
}

function renderCardDetailError(item, message) {
  document.getElementById("cardDetailBody").innerHTML = `
    <div class="detail-loading">
      <strong>${escapeHtml(item.name)}</strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}

function renderCardDetail(item, card, source, options = {}) {
  const movement = getCardMovement(item.id);
  const marketLinks = getMarketLinks(card, item);
  const owned = specs.find(spec => spec.id === item.id);
  const latestTcg = getLatestMarketObservation(item.id, "tcgplayer");
  const targetState = getTargetState(item, Boolean(owned));

  document.getElementById("cardDetailBody").innerHTML = `
    ${renderCardDetailHeader(item, card)}

    <div class="detail-main-stack">
      <div class="detail-primary-grid">
        ${renderPlanSection(item, targetState, source)}
        ${renderOverviewSection(item, movement, owned)}
      </div>
      <div class="detail-market-grid">
        ${renderMarketCheckSection(item, latestTcg, marketLinks)}
        ${renderMarketEvaluationSection(item, latestTcg, Boolean(owned))}
      </div>
      <div class="detail-main-grid detail-lower-grid">
        ${renderNotesSection(item)}
        ${renderOracleSection(card)}
      </div>
    </div>
  `;

  document.getElementById("closeCardDetail").onclick = closeCardDetail;
  document.getElementById("saveTcgObservation").onclick = () => saveTcgObservation(item, card, source);
  document.getElementById("tcgPricePaste").addEventListener("keydown", event => {
    event.stopPropagation();
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      saveTcgObservation(item, card, source);
    }
  });
  initTargetPlanForm(item, card, source);
  document.getElementById("cardNotesForm").onsubmit = event => saveCardNoteFromDetail(event, item, card, source);
  document.getElementById("showNoteHistory")?.addEventListener("toggle", event => {
    localStorage.setItem("cardDetailNotesExpanded", event.target.open ? "1" : "0");
  });

  if (options.focusNotes || activeCardDetail?.focusNotes) {
    focusCardDetailNotes();
    activeCardDetail.focusNotes = false;
  }

  if (source === "portfolio") {
    save();
  } else {
    saveRadarState(radar);
  }
}

function renderOverviewSection(item, movement, owned) {
  return `
    <section class="detail-command-section detail-overview-section">
      <div class="detail-section-heading">
        <h4>Status</h4>
        <span>${owned ? "Owned position" : "Radar idea"}</span>
      </div>
      <div class="detail-grid overview-grid">
        ${renderDetailMetric("Scryfall", money(item.currentPrice))}
        ${renderDetailMetric("Movement", movement.label)}
        ${renderDetailMetric("Qty", owned ? Number(owned.qty || 0) : "0")}
        ${renderDetailMetric("P/L", owned ? formatDetailMoney(Number(owned.pl || 0)) : "-")}
        ${renderDetailMetric("Buy", owned ? money(owned.buyPrice) : "-")}
        ${renderDetailMetric("Value", owned ? money(Number(owned.currentPrice || 0) * Number(owned.qty || 0)) : "-")}
      </div>
    </section>
  `;
}

function renderCardDetailHeader(item, card) {
  return `
    <header class="detail-header">
      <div class="detail-title-block">
        <div class="detail-title-line">
          <h3>${escapeHtml(item.name)}</h3>
          ${renderCardDataSection(item, card)}
        </div>
      </div>
      <button type="button" class="detail-close" id="closeCardDetail">Close</button>
    </header>
  `;
}

function renderPlanSection(item, targetState, source) {
  const sourceLabel = source === "radar" ? "Source: Radar" : "Source: Positions";
  return `
    <section class="detail-command-section detail-plan-section">
      <div class="detail-section-heading">
        <h4>Plan</h4>
        <span id="targetPlanStatus">${escapeHtml(sourceLabel)} / ${escapeHtml(formatCompactStatus(targetState.label))}</span>
      </div>
      <form class="target-plan-form" id="targetPlanForm">
        <label>
          Entry
          <input id="entryTargetInput" name="entryTarget" type="text" inputmode="decimal" pattern="[0-9$,.]*" value="${escapeDetailAttribute(formatTargetDisplayValue(item.entryTarget))}">
        </label>
        <label>
          Exit
          <input id="exitTargetInput" name="exitTarget" type="text" inputmode="decimal" pattern="[0-9$,.]*" value="${escapeDetailAttribute(formatTargetDisplayValue(item.exitTarget))}">
        </label>
        <label>
          Hold
          <input id="holdTimeInput" name="holdTime" type="text" inputmode="numeric" pattern="[0-9-]*" value="${escapeDetailAttribute(formatHoldInputValue(item.holdTime))}">
        </label>
        <span class="hold-time-helper">Examples: 3, 6-12, 12-18 months</span>
        <span class="plan-added-date">Added ${formatAddedDate(item.addedDate)}</span>
      </form>
    </section>
  `;
}

function renderNotesSection(item) {
  const notes = typeof getCardNotesForItem === "function"
    ? getCardNotesForItem(item)
    : [];
  const latest = notes[0];
  const expanded = localStorage.getItem("cardDetailNotesExpanded") === "1";

  return `
    <section class="detail-command-section card-notes-section" id="cardNotesSection">
      <div class="detail-section-heading">
        <h4>Notes</h4>
        <span>${notes.length ? `${notes.length} saved` : "-"}</span>
      </div>
      ${latest ? renderCardNoteEntry(latest, 0) : `<p class="card-note-preview muted">No notes yet.</p>`}
      <form class="card-notes-form" id="cardNotesForm">
        <input id="cardNoteText" placeholder="Add note">
        <button type="submit">Add Note</button>
      </form>
      ${notes.length ? `
        <details class="card-note-history" id="showNoteHistory" ${expanded ? "open" : ""}>
          <summary>Show Notes</summary>
          <div class="card-note-list">
            ${notes.slice(1).map((note, index) => renderCardNoteEntry(note, index + 1)).join("")}
          </div>
        </details>
      ` : ""}
    </section>
  `;
}

function renderCardNoteEntry(note, index) {
  const label = index === 0 ? "Latest note" : `Note ${index + 1}`;
  const timestamp = formatCardNoteTimestamp(note.createdAt);
  return `
    <article class="card-note-entry ${index === 0 ? "latest" : "older"}">
      <span class="card-note-meta">${escapeHtml(timestamp)}</span>
      <p><strong>${escapeHtml(label)}</strong><span>&mdash; ${escapeHtml(note.text)}</span></p>
    </article>
  `;
}

function formatCardNoteTimestamp(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Undated";
  return date.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function renderActionsSection(marketLinks) {
  return `
    <section class="detail-command-section">
      <div class="detail-section-heading">
        <h4>Actions</h4>
        <span>Open exact market and reference pages</span>
      </div>
      <div class="detail-actions">
        ${marketLinks.map(link => `<a href="${escapeDetailAttribute(link.href)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`).join("")}
      </div>
    </section>
  `;
}

function saveCardNoteFromDetail(event, item, card, source) {
  event.preventDefault();

  const text = document.getElementById("cardNoteText").value.trim();
  if (!text) return;

  addCardNote(item, text);

  if (typeof showAppNotice === "function") {
    showAppNotice(`${item.name} note saved.`, "save");
  }

  renderCardDetail(item, card, source, { focusNotes: true });
}

function focusCardDetailNotes() {
  window.requestAnimationFrame(() => {
    const section = document.getElementById("cardNotesSection");
    const input = document.getElementById("cardNoteText");
    section?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus();
  });
}

function renderMarketCheckSection(item, latestTcg, marketLinks = []) {
  const marketCheckCta = getMarketCheckCta(latestTcg);

  return `
    <section class="detail-command-section signal-section">
      <div class="detail-section-heading">
        <h4>Market Check</h4>
        <span>${latestTcg ? `Saved ${new Date(latestTcg.checkedAt).toLocaleString()}` : "TCG snapshot"}</span>
      </div>
      <div class="signal-grid">
        ${renderSignalSlot("TCG Qty", formatSellerQty(latestTcg))}
        ${renderSignalSlot("TCG Price", formatMarketRecent(latestTcg))}
        ${renderSignalSlot("CK Buylist", "-")}
        ${renderSignalSlot("Scryfall", item.priceUpdatedAt ? new Date(item.priceUpdatedAt).toLocaleDateString() : "-")}
      </div>
      <div class="market-paste-panel">
        <div class="detail-actions market-link-actions">
          ${marketLinks.map(link => `<a href="${escapeDetailAttribute(link.href)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`).join("")}
        </div>
        <details class="market-paste-details ${marketCheckCta.state}">
          <summary>${escapeHtml(marketCheckCta.label)}</summary>
          <textarea id="tcgPricePaste" placeholder="Paste the TCGplayer Price Points block here..."></textarea>
          <div class="market-paste-actions">
            <button type="button" id="saveTcgObservation">Save Check</button>
            <span id="tcgParseStatus">${latestTcg ? `Saved ${new Date(latestTcg.checkedAt).toLocaleString()}` : "-"}</span>
          </div>
        </details>
        <div class="market-observation-preview" id="tcgObservationPreview" hidden>
          ${latestTcg ? renderMarketObservation(latestTcg) : ""}
        </div>
      </div>
    </section>
  `;
}

function getMarketCheckCta(observation) {
  if (!observation?.checkedAt) {
    return { label: "⚡ Add Market Check", state: "needs-check" };
  }

  const checkedAt = new Date(observation.checkedAt);
  const ageDays = Number.isNaN(checkedAt.getTime())
    ? 999
    : Math.floor(Math.max(0, Date.now() - checkedAt.getTime()) / 86400000);

  if (ageDays <= 30) {
    return { label: "⚡ Market Check", state: "recent-check" };
  }

  if (ageDays <= 60) {
    return { label: "⚡ Refresh Market Check", state: "aging-check" };
  }

  return { label: "⚡ Refresh Market Check", state: "stale-check" };
}

function renderMarketEvaluationSection(item, observation, owned) {
  const evaluation = buildMarketEvaluation(item, observation, owned);

  return `
    <section class="detail-command-section">
      <div class="detail-section-heading">
        <h4>Market Evaluation</h4>
        <span>${escapeHtml(evaluation.summary === "-" ? "Data gaps" : evaluation.summary)}</span>
      </div>
      <div class="evaluation-grid">
        ${evaluation.items.map(renderEvaluationItem).join("")}
      </div>
    </section>
  `;
}

function renderEvaluationItem(item) {
  return `
    <div class="evaluation-item ${item.tone}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.value)}</strong>
      ${item.detail ? `<small>${escapeHtml(item.detail)}</small>` : ""}
    </div>
  `;
}

function renderCardDataSection(item, card) {
  const chips = [
    formatCompactPrintingIdentity(item),
    item.set_name || "",
    item.foil ? "Foil" : "Nonfoil",
    item.rarity || "",
    getColorLabel(item),
    getPrimaryType(item),
    item.released_at || "",
    item.buyDate ? `Bought ${formatAddedDate(item.buyDate)}` : "",
    item.reprint ? "Reprint" : "First print",
  ].filter(Boolean);

  return `
    <section class="card-data-strip">
      ${chips.map(chip => `<span>${escapeHtml(chip)}</span>`).join("")}
    </section>
  `;
}

function renderOracleSection(card) {
  return `
    <section class="detail-command-section oracle-section">
      <div class="detail-section-heading">
        <h4>Oracle</h4>
        <span>${escapeHtml(card.type_line || "Card text")}</span>
      </div>
      <details class="detail-copy">
        <summary>
          <span>Text</span>
          <strong>Show card text</strong>
        </summary>
        <p>${escapeHtml(card.oracle_text || "No oracle text available.")}</p>
      </details>
    </section>
  `;
}

function initTargetPlanForm(item, card, source) {
  const form = document.getElementById("targetPlanForm");
  if (!form) return;

  form.dataset.planSignature = getTargetPlanInputSignature();
  form.addEventListener("submit", event => saveTargetPlan(event, item, card, source));
  form.querySelectorAll("input").forEach(input => {
    if (input.name === "entryTarget" || input.name === "exitTarget") {
      input.addEventListener("focus", () => {
        input.value = formatTargetInputNumber(parseWholeDollarInput(input.value));
      });
    }

    input.addEventListener("keydown", event => {
      event.stopPropagation();
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      }
    });

    input.addEventListener("blur", () => {
      if (input.name === "entryTarget" || input.name === "exitTarget") {
        const parsed = parseWholeDollarInput(input.value);
        if (parsed !== null) input.value = formatTargetDisplayValue(parsed);
      }

      if (getTargetPlanInputSignature() === form.dataset.planSignature) return;
      saveTargetPlan(null, item, card, source);
    });
  });
}

function getTargetPlanInputSignature() {
  return [
    document.getElementById("entryTargetInput")?.value || "",
    document.getElementById("exitTargetInput")?.value || "",
    document.getElementById("holdTimeInput")?.value || "",
  ].join("|");
}

function saveTargetPlan(event, item, card, source) {
  event?.preventDefault();

  const entryTarget = parseWholeDollarInput(document.getElementById("entryTargetInput").value);
  const exitTarget = parseWholeDollarInput(document.getElementById("exitTargetInput").value);
  if (entryTarget === null || exitTarget === null) {
    if (typeof showAppNotice === "function") {
      showAppNotice("Use numbers, $, commas, or decimals for target prices.", "warning");
    }
    return;
  }

  savePlanForTrackedCard(
    item.id,
    {
      entryTarget,
      exitTarget,
      holdTime: formatHoldTime(parseHoldMonthsInput(document.getElementById("holdTimeInput").value)),
    },
    source
  );

  if (typeof showAppNotice === "function") {
    showAppNotice(`${item.name} plan saved.`, "save");
  }

  renderCardDetail(item, card, source);
}

function ensureCardDetailModal() {
  let modal = document.getElementById("cardDetailModal");
  if (modal) {
    modal.classList.add("open");
    return;
  }

  modal = document.createElement("div");
  modal.id = "cardDetailModal";
  modal.className = "card-detail-modal open";
  modal.innerHTML = `
    <div class="card-detail-backdrop" data-action="close-detail"></div>
    <section class="card-detail-panel" id="cardDetailBody"></section>
  `;

  document.body.appendChild(modal);
  modal.querySelector('[data-action="close-detail"]').onclick = closeCardDetail;
  ensureCardDetailEscapeHandler();
}

function closeCardDetail() {
  const modal = document.getElementById("cardDetailModal");
  if (modal) modal.classList.remove("open");
}

function ensureCardDetailEscapeHandler() {
  if (window.cardDetailEscapeHandlerInstalled) return;
  window.cardDetailEscapeHandlerInstalled = true;
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeCardDetail();
  });
}

function syncTrackedCardPrice(item, card) {
  const nextPrice = typeof getScryfallUsdPrice === "function"
    ? getScryfallUsdPrice(card, item)
    : Number(card.prices?.usd || item.currentPrice || 0);

  if (!nextPrice) return;

  item.currentPrice = nextPrice;
  item.priceUpdatedAt = new Date().toISOString();
  updatePL();
  updateTotals();
}

function getCardMovement(cardId) {
  if (typeof loadPriceSnapshots !== "function") {
    return { label: "No snapshots" };
  }

  const snapshots = loadPriceSnapshots()
    .filter(snapshot => snapshot.cardId === cardId)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (snapshots.length < 2) {
    return { label: "N/A" };
  }

  const previous = snapshots[snapshots.length - 2];
  const latest = snapshots[snapshots.length - 1];
  const delta = Number(latest.price || 0) - Number(previous.price || 0);
  const pct = previous.price ? (delta / Number(previous.price)) * 100 : 0;

  return {
    label: `${formatDetailMoney(delta)} / ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
  };
}

function getMarketLinks(card, item) {
  const tcgLink = card.purchase_uris?.tcgplayer
    || `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${encodeURIComponent(item.name)}`;
  const cardKingdomSearch = `https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=${encodeURIComponent(item.name)}`;
  const cardKingdomBuylist = `https://www.cardkingdom.com/purchasing/mtg_singles?filter%5Bname%5D=${encodeURIComponent(item.name)}`;

  return [
    { label: "Open TCG", href: tcgLink },
    { label: "Open CK", href: cardKingdomSearch },
    { label: "Open Buylist", href: cardKingdomBuylist },
    { label: "Open Scryfall", href: card.scryfall_uri || `https://scryfall.com/search?q=${encodeURIComponent(item.name)}` },
  ];
}

function saveTcgObservation(item, card, source) {
  const input = document.getElementById("tcgPricePaste");
  const status = document.getElementById("tcgParseStatus");
  const rawText = input.value.trim();

  if (!rawText) {
    status.innerText = "Paste Price Points text first";
    return;
  }

  const parsed = parseTcgPricePoints(rawText);
  const observations = loadMarketObservations();
  const observation = {
    id: `${item.id}|tcgplayer|${Date.now()}`,
    cardId: item.id,
    name: item.name,
    source: "tcgplayer",
    checkedAt: new Date().toISOString(),
    url: card.purchase_uris?.tcgplayer || "",
    rawText,
    ...parsed,
  };

  observations.push(observation);
  saveMarketObservations(observations);

  input.value = "";
  status.innerText = `Saved ${new Date(observation.checkedAt).toLocaleString()}`;
  document.getElementById("tcgObservationPreview").innerHTML = renderMarketObservation(observation);
  renderCardDetail(item, card, source);
}

function parseTcgPricePoints(text) {
  return {
    condition: parseTextValue(text, /^(Near Mint|Lightly Played|Moderately Played|Heavily Played|Damaged)$/im),
    marketPrice: parseMoneyValue(text, /Market Price\s*\$?([\d,.]+)/i),
    mostRecentSale: parseMoneyValue(text, /Most Recent Sale\s*\$?([\d,.]+)/i),
    listedMedian: parseMoneyValue(text, /Listed Median:\s*\$?([\d,.]+)/i),
    currentQuantity: parseNumberValue(text, /Current Quantity:\s*([\d,]+)/i),
    currentSellers: parseNumberValue(text, /Current Sellers:\s*([\d,]+)/i),
    lowSalePrice: parseMoneyValue(text, /Low Sale Price:\s*\$?([\d,.]+)/i),
    highSalePrice: parseMoneyValue(text, /High Sale Price:\s*\$?([\d,.]+)/i),
    totalSold: parseNumberValue(text, /Total Sold:\s*([\d,]+)/i),
    avgDailySold: parseNumberValue(text, /Avg\. Daily Sold:\s*([\d,.]+)/i),
    volatility: parseTextValue(text, /(Low|Medium|High) Volatility/i),
  };
}

function parseMoneyValue(text, pattern) {
  const match = text.match(pattern);
  return match ? Number(match[1].replace(/,/g, "")) : null;
}

function parseNumberValue(text, pattern) {
  const match = text.match(pattern);
  return match ? Number(match[1].replace(/,/g, "")) : null;
}

function parseTextValue(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1] : "";
}

function getLatestMarketObservation(cardId, source) {
  const observations = loadMarketObservations()
    .filter(observation => observation.cardId === cardId && observation.source === source)
    .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt));

  return observations[observations.length - 1] || null;
}

function getTargetState(item, owned) {
  const price = Number(item.currentPrice || 0);
  const entry = Number(item.entryTarget || 0);
  const exit = Number(item.exitTarget || 0);
  const holdState = getHoldTimeState(item);

  if (price && owned && exit) {
    if (price >= exit) return { label: "Exit hit" };
    if (price >= exit * 0.9) return { label: "Exit near" };
  }

  if (price && !owned && entry) {
    if (price <= entry) return { label: "Entry hit" };
    if (price <= entry * 1.1) return { label: "Entry near" };
  }

  if (holdState === "due") return { label: "Hold due" };
  if (holdState === "near") return { label: "Hold near" };

  if (!price) return { label: "No price" };

  if (entry || exit || getHoldMonths(item.holdTime)) return { label: "Plan saved" };
  return { label: "No target" };
}

function buildMarketEvaluation(item, observation, owned) {
  const supply = evaluateSupply(observation);
  const velocity = evaluateVelocity(observation);
  const price = evaluatePriceConfidence(observation);
  const edh = evaluateEdhPresence(item);
  const target = evaluateTargetMath(item, owned);
  const freshness = evaluateFreshness(observation);

  const summaryValues = [supply.value, velocity.value, price.value].filter(value => value !== "-");

  return {
    summary: summaryValues.length ? summaryValues.join(" / ") : "-",
    items: [
      supply,
      velocity,
      price,
      edh,
      target,
      freshness,
    ],
  };
}

function evaluateSupply(observation) {
  if (!observation) {
    return buildEvaluationItem("Supply", "-", "", "muted");
  }

  const sellers = Number(observation.currentSellers || 0);
  const qty = Number(observation.currentQuantity || 0);
  const perSeller = sellers ? qty / sellers : 0;

  let value = "-";
  let tone = "muted";
  if (sellers && qty) {
    if (sellers <= 8 || qty <= 24) {
      value = "Thin";
      tone = "watch";
    } else if (sellers >= 30 || qty >= 120) {
      value = "Crowded";
      tone = "risk";
    } else {
      value = "Moderate";
      tone = "neutral";
    }
  }

  return buildEvaluationItem("Supply", value, value === "-" ? "" : `${sellers || 0}s / ${qty || 0}q / ${perSeller ? perSeller.toFixed(1) : "0"} ea`, tone);
}

function evaluateVelocity(observation) {
  if (!observation) {
    return buildEvaluationItem("Velocity", "-", "", "muted");
  }

  const daily = Number(observation.avgDailySold || 0);
  const total = Number(observation.totalSold || 0);

  let value = "-";
  let tone = "muted";
  if (daily >= 2) {
    value = "Active";
    tone = "good";
  } else if (daily > 0) {
    value = "Slow";
    tone = "neutral";
  }

  return buildEvaluationItem("Velocity", value, value === "-" ? "" : `${daily || 0}/day / ${total || 0} sold`, tone);
}

function evaluatePriceConfidence(observation) {
  if (!observation) {
    return buildEvaluationItem("Price", "-", "", "muted");
  }

  const market = Number(observation.marketPrice || 0);
  const recent = Number(observation.mostRecentSale || 0);
  const median = Number(observation.listedMedian || 0);
  const spread = market && recent ? Math.abs(market - recent) / market : 0;

  let value = "-";
  let tone = "muted";
  if (market && recent) {
    if (spread <= 0.1) {
      value = "Stable";
      tone = "good";
    } else if (spread <= 0.25) {
      value = "Noisy";
      tone = "watch";
    } else {
      value = "Thin/noisy";
      tone = "risk";
    }
  }

  return buildEvaluationItem("Price", value, value === "-" ? "" : `M ${formatOptionalMoney(market || null)} / R ${formatOptionalMoney(recent || null)} / Med ${formatOptionalMoney(median || null)}`, tone);
}

function evaluateEdhPresence(item) {
  const rank = Number(item.edhrec_rank || 0);

  if (!rank) {
    return buildEvaluationItem("EDH", "-", "", "muted");
  }

  if (rank <= 1000) {
    return buildEvaluationItem("EDH", "High", `Rank #${rank.toLocaleString()}`, "good");
  }

  if (rank <= 5000) {
    return buildEvaluationItem("EDH", "Med", `Rank #${rank.toLocaleString()}`, "neutral");
  }

  return buildEvaluationItem("EDH", "Low", `Rank #${rank.toLocaleString()}`, "muted");
}

function evaluateTargetMath(item, owned) {
  const price = Number(item.currentPrice || 0);
  const entry = Number(item.entryTarget || 0);
  const exit = Number(item.exitTarget || 0);
  const targetState = getTargetState(item, owned).label;

  if (!price || (!entry && !exit)) {
    return buildEvaluationItem("Target", "-", "", "muted");
  }

  const target = owned ? exit : entry;
  const pct = target && price ? ((target - price) / price) * 100 : 0;
  const detail = target
    ? `${owned ? "Exit" : "Entry"} ${money(target)} / ${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
    : targetState;

  return buildEvaluationItem("Target", targetState, detail, targetState.includes("hit") ? "good" : "neutral");
}

function evaluateFreshness(observation) {
  if (!observation?.checkedAt) {
    return buildEvaluationItem("Freshness", "-", "", "muted");
  }

  const ageMs = Date.now() - new Date(observation.checkedAt).getTime();
  const ageDays = Math.max(0, Math.floor(ageMs / 86400000));
  const label = formatFreshnessAgeLabel(ageDays);

  if (ageDays <= 1) {
    return buildEvaluationItem("Freshness", label, "", "good");
  }

  if (ageDays <= 7) {
    return buildEvaluationItem("Freshness", label, "", "neutral");
  }

  return buildEvaluationItem("Freshness", label, "", "watch");
}

function formatFreshnessAgeLabel(ageDays) {
  if (ageDays <= 0) return "Updated Today";
  if (ageDays === 1) return "1 Day Old";
  if (ageDays < 7) return `${ageDays} Days Old`;

  const weeks = Math.max(1, Math.round(ageDays / 7));
  return weeks === 1 ? "1 Week Old" : `${weeks} Weeks Old`;
}

function buildEvaluationItem(label, value, detail, tone) {
  return { label, value, detail, tone };
}

function savePlanForTrackedCard(cardId, plan, source = activeCardDetail?.source) {
  const normalized = {
    entryTarget: Number(plan.entryTarget || 0),
    exitTarget: Number(plan.exitTarget || 0),
    holdTime: plan.holdTime || "",
  };

  const pairedPosition = specs.find(spec => spec.id === cardId);
  const pairedRadar = radar.find(radarItem => radarItem.id === cardId);
  const targets = [];

  if (source === "portfolio" && pairedPosition) {
    targets.push(pairedPosition);
  } else if (source === "radar" && pairedRadar) {
    targets.push(pairedRadar);
  } else if (pairedPosition && !pairedRadar) {
    targets.push(pairedPosition);
  } else if (pairedRadar && !pairedPosition) {
    targets.push(pairedRadar);
  }

  targets.forEach(item => {
    item.entryTarget = normalized.entryTarget;
    item.exitTarget = normalized.exitTarget;
    item.holdTime = normalized.holdTime;
  });

  save();
  saveRadarState(radar);
  return normalized;
}

function parseWholeDollarInput(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) return 0;

  const normalized = rawValue.replace(/[$,\s]/g, "");
  if (!/^(?:\d+|\d*\.\d{1,2})$/.test(normalized)) return null;

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseHoldMonthsInput(value) {
  const normalized = String(value || "")
    .replace(/[^\d-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const match = normalized.match(/^(\d+)(?:-(\d+))?$/);
  if (!match) return "";

  const start = Number(match[1] || 0);
  const end = Number(match[2] || 0);
  if (!start) return "";
  if (match[2] && end > 0) return `${start}-${end}`;
  return String(start);
}

function formatHoldTime(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return `${normalized} months`;
}

function getHoldMonths(value) {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function getHoldTimeState(item) {
  const months = getHoldMonths(item.holdTime);
  if (!months) return "";

  const startDate = getPlanStartDate(item);
  if (!startDate) return "";

  const ageMs = Date.now() - startDate.getTime();
  if (ageMs < 0) return "";

  const targetMs = months * 30 * 86400000;
  if (ageMs >= targetMs) return "due";
  if (ageMs >= targetMs * 0.9) return "near";
  return "";
}

function getPlanStartDate(item) {
  const raw = item.buyDate || item.addedDate || item.priceUpdatedAt || "";
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function formatTargetInputNumber(value) {
  const number = Number(value || 0);
  if (number <= 0) return "";
  return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(2)));
}

function formatTargetDisplayValue(value) {
  const number = Number(value || 0);
  return number > 0 ? tableMoney(number) : "";
}

function formatHoldInputValue(value) {
  const match = String(value || "").match(/\d+(?:\s*-\s*\d+)?/);
  return match ? match[0].replace(/\s+/g, "") : "";
}

function formatAddedDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : "-";
}

function formatCompactStatus(value) {
  return String(value || "").startsWith("No ") ? "-" : value;
}

function formatCompactPrintingIdentity(item) {
  const setCode = item.set_code ? String(item.set_code).toUpperCase() : "";
  const number = item.collector_number ? `#${String(item.collector_number).padStart(3, "0")}` : "";
  return [setCode, number].filter(Boolean).join(" ");
}

function formatDetailPrintingIdentity(item) {
  const setCode = item.set_code ? String(item.set_code).toUpperCase() : "";
  const number = item.collector_number ? `#${String(item.collector_number).padStart(3, "0")}` : "";
  const finish = item.foil ? "Foil" : "Nonfoil";
  return [setCode, number, item.set_name, finish].filter(Boolean).join(" - ");
}

function escapeDetailAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatSellerQty(observation) {
  if (!observation) return "-";
  return `${observation.currentSellers || 0}s / ${observation.currentQuantity || 0}q`;
}

function formatMarketRecent(observation) {
  if (!observation) return "-";
  return `${formatOptionalMoney(observation.marketPrice)} / ${formatOptionalMoney(observation.mostRecentSale)}`;
}

function renderMarketObservation(observation) {
  if (!observation) {
    return `<div class="empty-state compact">Paste and save a TCGplayer Price Points block to track seller count, quantity, and sales velocity.</div>`;
  }

  return `
    <div class="market-observation-grid">
      ${renderSignalSlot("Condition", observation.condition || "-")}
      ${renderSignalSlot("Market", formatOptionalMoney(observation.marketPrice))}
      ${renderSignalSlot("Recent Sale", formatOptionalMoney(observation.mostRecentSale))}
      ${renderSignalSlot("Listed Median", formatOptionalMoney(observation.listedMedian))}
      ${renderSignalSlot("Quantity", observation.currentQuantity ?? "-")}
      ${renderSignalSlot("Sellers", observation.currentSellers ?? "-")}
      ${renderSignalSlot("Low / High", `${formatOptionalMoney(observation.lowSalePrice)} / ${formatOptionalMoney(observation.highSalePrice)}`)}
      ${renderSignalSlot("Total Sold", observation.totalSold ?? "-")}
      ${renderSignalSlot("Avg Daily", observation.avgDailySold ?? "-")}
      ${renderSignalSlot("Volatility", observation.volatility || "-")}
    </div>
  `;
}

function formatOptionalMoney(value) {
  return value === null || value === undefined ? "-" : money(value);
}

function renderDetailMetric(label, value) {
  return `
    <div class="detail-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderSignalSlot(label, value) {
  return `
    <div class="signal-slot">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function formatDetailMoney(value) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${money(Math.abs(value))}`;
}
