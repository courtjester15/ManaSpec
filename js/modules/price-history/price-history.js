/* Reusable exact-printing price history indicator and modal. */

let activePriceHistoryState = null;
let activePriceHistoryChart = null;
let priceHistoryReturnFocus = null;

const PRICE_HISTORY_RANGES = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "all", label: "All" },
];

function renderPriceHistoryTableControl(item, index) {
  const history = getPriceHistoryForPrinting(item);
  const coverage = getHistoryCoverage(history);
  const badge = formatHistoryCoverageBadge(history);
  const stateClass = history.length >= 2
    ? "history-control--active"
    : history.length === 1
      ? "history-control--limited"
      : "history-control--empty";
  const title = formatHistoryControlTitle(coverage);
  return `
    <button type="button" class="history-control ${stateClass}" data-ms-action="price-history" data-ms-row="${msEscapeAttr(index)}" title="${msEscapeAttr(title)}" aria-label="${msEscapeAttr(title)}">
      <svg class="history-control__icon" viewBox="0 0 18 16" aria-hidden="true">
        <path class="history-control__axis" d="M2.5 2v11.5H16"></path>
        <path class="history-control__trend" d="m4.5 10 3-3 2.4 2 4-5"></path>
      </svg>
      <span class="history-control__badge">${msEscapeHtml(badge)}</span>
    </button>
  `;
}

function formatHistoryControlTitle(coverage) {
  if (!coverage.snapshotCount) return "No price history saved yet";
  const noun = coverage.snapshotCount === 1 ? "snapshot" : "snapshots";
  const span = formatCoverageWords(coverage.days);
  return `${coverage.snapshotCount} ${noun} covering ${span}\nOldest: ${formatHistoryDate(coverage.oldest)}\nNewest: ${formatHistoryDate(coverage.newest)}`;
}

function formatCoverageWords(days) {
  if (days <= 30) return `${days} ${days === 1 ? "day" : "days"}`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? "month" : "months"}`;
  }
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"}`;
}

function openPriceHistoryModal(item, source = "") {
  ensurePriceHistoryModal();
  const history = getPriceHistoryForPrinting(item);
  const coverage = getHistoryCoverage(history);
  activePriceHistoryState = {
    item,
    source,
    history,
    coverage,
    range: chooseDefaultPriceHistoryRange(coverage),
    references: getPriceHistoryReferences(item),
  };
  priceHistoryReturnFocus = document.activeElement;
  const modal = document.getElementById("priceHistoryModal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  renderPriceHistoryModal();
  modal.querySelector("[data-price-history-close]")?.focus();
}

function ensurePriceHistoryModal() {
  if (document.getElementById("priceHistoryModal")) return;
  const modal = document.createElement("div");
  modal.id = "priceHistoryModal";
  modal.className = "price-history-modal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="price-history-backdrop" data-price-history-close></div>
    <section class="price-history-panel" role="dialog" aria-modal="true" aria-labelledby="priceHistoryTitle">
      <header class="price-history-header">
        <div><h3 id="priceHistoryTitle">Price History</h3><p id="priceHistoryIdentity"></p></div>
        <button type="button" class="price-history-close" data-price-history-close aria-label="Close price history">Close</button>
      </header>
      <nav class="price-history-ranges" id="priceHistoryRanges" aria-label="Price history range"></nav>
      <div id="priceHistoryContent"></div>
    </section>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", event => {
    if (event.target.closest("[data-price-history-close]")) closePriceHistoryModal();
    const rangeButton = event.target.closest("[data-price-history-range]");
    if (rangeButton && !rangeButton.disabled && activePriceHistoryState) {
      activePriceHistoryState.range = rangeButton.dataset.priceHistoryRange;
      renderPriceHistoryModal();
    }
  });
  document.addEventListener("keydown", handlePriceHistoryKeydown);
}

function handlePriceHistoryKeydown(event) {
  if (event.key === "Escape" && document.getElementById("priceHistoryModal")?.classList.contains("open")) {
    closePriceHistoryModal();
  }
}

function closePriceHistoryModal() {
  destroyPriceHistoryChart();
  const modal = document.getElementById("priceHistoryModal");
  modal?.classList.remove("open");
  modal?.setAttribute("aria-hidden", "true");
  activePriceHistoryState = null;
  if (priceHistoryReturnFocus?.isConnected) priceHistoryReturnFocus.focus();
  priceHistoryReturnFocus = null;
}

function renderPriceHistoryModal() {
  const state = activePriceHistoryState;
  if (!state) return;
  destroyPriceHistoryChart();
  document.getElementById("priceHistoryIdentity").textContent = formatPriceHistoryIdentity(state.item);
  document.getElementById("priceHistoryRanges").innerHTML = PRICE_HISTORY_RANGES.map(range => {
    const selected = state.range === range.key;
    const meaningful = range.key === "all" || filterHistoryByRange(state.history, range.key).length >= 2;
    return `<button type="button" data-price-history-range="${range.key}" class="${selected ? "active" : ""}" ${meaningful ? "" : "disabled"} aria-pressed="${selected}">${range.label}</button>`;
  }).join("");

  const filtered = filterHistoryByRange(state.history, state.range);
  const metrics = calculateHistoryMetrics(filtered);
  const content = document.getElementById("priceHistoryContent");
  content.innerHTML = `
    ${renderPriceHistoryChartState(filtered)}
    ${renderPriceHistoryMetrics(metrics)}
    ${renderPriceHistoryReferences(state.references)}
    ${renderPriceHistoryFooter(filtered)}
  `;
  if (filtered.length >= 2) renderPriceHistoryChart(filtered, state.references);
}

function renderPriceHistoryChartState(history) {
  if (!history.length) return `
    <div class="price-history-empty">
      <strong>No price history saved yet.</strong>
      <span>History begins after a successful price refresh saves this exact printing and finish.</span>
    </div>
  `;
  if (history.length === 1) return `
    <div class="price-history-empty price-history-empty--limited">
      <strong>1 daily snapshot saved.</strong>
      <span>At least two snapshots are needed to show price movement.</span>
      <small>${formatHistoryDate(history[0].date)} · ${formatHistoryMoney(history[0].price)} · Source: Scryfall</small>
    </div>
  `;
  return `<div class="price-history-chart-wrap"><canvas id="priceHistoryChart" tabindex="0" aria-label="Price history line chart"></canvas></div>`;
}

function renderPriceHistoryMetrics(metrics) {
  return `<div class="price-history-metrics">
    ${renderPriceHistoryMetric("Current", formatHistoryMoney(metrics.current))}
    ${renderPriceHistoryMetric("Change", formatHistoryChange(metrics.change), getHistoryChangeClass(metrics.change))}
    ${renderPriceHistoryMetric("High", formatHistoryMoney(metrics.high))}
    ${renderPriceHistoryMetric("Low", formatHistoryMoney(metrics.low))}
  </div>`;
}

function renderPriceHistoryMetric(label, value, className = "") {
  return `<div><span>${label}</span><strong class="${className}">${value}</strong></div>`;
}

function getPriceHistoryReferences(item) {
  const key = normalizeTrackedHistoryItem(item)?.printingKey;
  const owned = typeof specs !== "undefined"
    ? specs.find(spec => normalizeTrackedHistoryItem(spec)?.printingKey === key && Number(spec.qty || 0) > 0)
    : null;
  const watched = typeof radar !== "undefined"
    ? radar.find(candidate => normalizeTrackedHistoryItem(candidate)?.printingKey === key)
    : null;
  return [
    { label: "Entry", value: getPositiveNumber(item.entryTarget ?? watched?.entryTarget), color: "#7dd3fc" },
    { label: "Buy", value: getPositiveNumber(owned?.buyPrice), color: "#fbbf24" },
    { label: "Exit", value: getPositiveNumber(item.exitTarget ?? owned?.exitTarget ?? watched?.exitTarget), color: "#86efac" },
  ].filter(reference => reference.value !== null);
}

function getPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function renderPriceHistoryReferences(references) {
  if (!references.length) return "";
  return `<div class="price-history-references">${references.map(reference => `
    <span><i style="--reference-color:${reference.color}"></i>${reference.label} <strong>${formatHistoryMoney(reference.value)}</strong></span>
  `).join("")}</div>`;
}

function renderPriceHistoryFooter(history) {
  if (!history.length) return `<footer class="price-history-footer">Local history only · Source: Scryfall</footer>`;
  const newest = history.at(-1);
  const dateRange = history.length === 1
    ? formatHistoryDate(newest.date)
    : `${formatHistoryDate(history[0].date)}–${formatHistoryDate(newest.date)}`;
  const updated = newest.savedAt ? new Date(newest.savedAt).toLocaleString() : "unknown";
  return `<footer class="price-history-footer">${history.length} ${history.length === 1 ? "snapshot" : "snapshots"} · ${dateRange} · Source: Scryfall · Updated ${updated}</footer>`;
}

function renderPriceHistoryChart(history, references) {
  if (typeof Chart !== "function") {
    document.querySelector(".price-history-chart-wrap").innerHTML = `<div class="price-history-empty"><strong>Chart unavailable.</strong><span>The local chart library did not load.</span></div>`;
    return;
  }
  const context = document.getElementById("priceHistoryChart");
  const firstTime = getHistoryDayTimestamp(history[0].date);
  const lastTime = getHistoryDayTimestamp(history.at(-1).date);
  const observations = history.map((snapshot, index) => ({
    x: getHistoryDayTimestamp(snapshot.date),
    y: snapshot.price,
    snapshotDate: snapshot.date,
    previousChange: index && history[index - 1].price > 0
      ? ((snapshot.price - history[index - 1].price) / history[index - 1].price) * 100
      : null,
  }));
  const datasets = [{
    label: "Scryfall",
    data: observations,
    borderColor: "#a78bfa",
    backgroundColor: "rgba(167, 139, 250, 0.13)",
    fill: true,
    tension: 0.24,
    pointRadius: history.length > 45 ? 1.5 : 3,
    pointHoverRadius: 5,
    pointHitRadius: 4,
    borderWidth: 2,
  }, ...references.map(reference => ({
    label: reference.label,
    data: [{ x: firstTime, y: reference.value }, { x: lastTime, y: reference.value }],
    borderColor: reference.color,
    borderDash: [6, 5],
    borderWidth: 1,
    pointRadius: 0,
    pointHitRadius: 0,
    fill: false,
  }))];

  activePriceHistoryChart = new Chart(context, {
    type: "line",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      interaction: { intersect: true, mode: "nearest" },
      animation: false,
      plugins: {
        legend: { display: references.length > 0, labels: { color: "#cbd5e1", boxWidth: 12, boxHeight: 2 } },
        tooltip: {
          filter: item => item.datasetIndex === 0,
          callbacks: {
            title: items => formatHistoryDate(items[0]?.raw?.snapshotDate),
            label: item => formatHistoryMoney(item.raw.y),
            afterLabel: item => item.raw.previousChange === null
              ? ""
              : `${formatHistoryChange(item.raw.previousChange)} from previous snapshot`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: firstTime,
          max: lastTime,
          ticks: {
            color: "#94a3b8",
            maxTicksLimit: 8,
            callback: value => formatHistoryAxisDate(value, firstTime, lastTime),
          },
          grid: { color: "rgba(148, 163, 184, 0.08)" },
        },
        y: { ticks: { color: "#94a3b8", callback: value => `$${Number(value).toFixed(0)}` }, grid: { color: "rgba(148, 163, 184, 0.12)" } },
      },
    },
  });
}

function getHistoryDayTimestamp(date) {
  const [year, month, day] = String(date).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function formatHistoryAxisDate(value, firstTime, lastTime) {
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) return "";
  const spansYears = new Date(firstTime).getUTCFullYear() !== new Date(lastTime).getUTCFullYear();
  return date.toLocaleDateString(undefined, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    ...(spansYears ? { year: "2-digit" } : {}),
  });
}

function destroyPriceHistoryChart() {
  if (activePriceHistoryChart) activePriceHistoryChart.destroy();
  activePriceHistoryChart = null;
}

function chooseDefaultPriceHistoryRange(coverage) {
  if (coverage.days >= 365) return "1y";
  if (coverage.days >= 30) return "30d";
  return "all";
}

function formatPriceHistoryIdentity(item) {
  const normalized = normalizeTrackedHistoryItem(item) || {};
  const finish = normalized.finish === "foil" ? "Foil" : "Nonfoil";
  return [normalized.name, normalized.setCode, normalized.collectorNumber ? `#${normalized.collectorNumber}` : "", finish]
    .filter(Boolean).join(" · ");
}

function formatHistoryDate(date) {
  if (!date) return "-";
  const [year, month, day] = String(date).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatHistoryMoney(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0
    ? (typeof money === "function" ? money(Number(value)) : `$${Number(value).toFixed(2)}`)
    : "-";
}

function formatHistoryChange(value) {
  return Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toFixed(1)}%` : "-";
}

function getHistoryChangeClass(value) {
  if (!Number.isFinite(value)) return "";
  return value >= 0 ? "value-positive" : "value-negative";
}
