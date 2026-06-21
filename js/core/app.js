/*
====================================
APP ENTRYPOINT
====================================

Bootstraps ManaSpec.

Responsible for:
- app-level save glue
- shared helpers
- view navigation
- starting the default view
====================================
*/

function save() {
  saveState(specs, cash, updateTotals);

  if (typeof refreshPortfolioTable === "function" && document.getElementById("portfolioTable")) {
    refreshPortfolioTable();
  }
}

function getSpec(positionOrEvent, maybeCell) {
  const cell = maybeCell || (positionOrEvent && typeof positionOrEvent.getRow === "function" ? positionOrEvent : null);
  if (cell) {
    const row = cell.getRow().getData();
    return specs.find(x => x.id === row.id);
  }

  if (positionOrEvent && positionOrEvent.id) {
    return specs.find(x => x.id === positionOrEvent.id);
  }

  return null;
}

function money(n) {
  const number = Number(n);
  return `$${Number.isFinite(number) ? number.toFixed(2) : "0.00"}`;
}

function tableMoney(n) {
  const number = Number(n);
  if (!Number.isFinite(number)) return "$0";

  const sign = number < 0 ? "-" : "";
  const absolute = Math.abs(number);
  const decimals = absolute >= 5 ? 0 : 2;
  return `${sign}$${absolute.toFixed(decimals)}`;
}

function showAppNotice(message, tone = "success") {
  const stack = document.getElementById("toastStack");
  if (!stack) return;
  const durationByTone = {
    trade: 5200,
    warning: 5200,
    save: 2800,
    info: 3600,
    success: 3800,
  };

  const toast = document.createElement("div");
  toast.className = `app-toast ${tone}`;
  toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button type="button" aria-label="Dismiss notification">Dismiss</button>
  `;

  const dismiss = () => {
    toast.classList.add("closing");
    window.setTimeout(() => toast.remove(), 160);
  };

  toast.querySelector("button").addEventListener("click", dismiss);
  stack.appendChild(toast);
  window.setTimeout(dismiss, durationByTone[tone] || durationByTone.success);
}

function requestAppConfirmation(options = {}) {
  const dialog = document.getElementById("appConfirmDialog");
  if (!dialog) return Promise.resolve(false);

  return new Promise(resolve => {
    const tone = options.tone || "warning";
    dialog.className = `app-confirm-dialog open ${tone}`;
    dialog.setAttribute("aria-hidden", "false");
    dialog.innerHTML = `
      <div class="app-confirm-backdrop" data-confirm-action="cancel"></div>
      <section class="app-confirm-panel" role="dialog" aria-modal="true" aria-labelledby="appConfirmTitle">
        <header>
          <div>
            <h3 id="appConfirmTitle">${escapeHtml(options.title || "Confirm action")}</h3>
            <p>${escapeHtml(options.message || "")}</p>
          </div>
        </header>
        ${options.bodyHtml ? `<div class="app-confirm-body">${options.bodyHtml}</div>` : ""}
        <div class="app-confirm-actions">
          <button type="button" data-confirm-action="cancel">${escapeHtml(options.cancelLabel || "Cancel")}</button>
          <button type="button" class="${tone === "danger" ? "danger" : ""}" data-confirm-action="confirm">${escapeHtml(options.confirmLabel || "Confirm")}</button>
        </div>
      </section>
    `;

    const close = confirmed => {
      dialog.className = "app-confirm-dialog";
      dialog.setAttribute("aria-hidden", "true");
      dialog.innerHTML = "";
      document.removeEventListener("keydown", onKeydown);
      resolve(confirmed);
    };

    const onKeydown = event => {
      if (event.key === "Escape") close(false);
    };

    if (typeof options.onOpen === "function") {
      options.onOpen(dialog);
    }

    dialog.querySelectorAll("[data-confirm-action]").forEach(control => {
      control.addEventListener("click", () => {
        if (control.dataset.confirmAction !== "confirm") {
          close(false);
          return;
        }

        const result = typeof options.getResult === "function" ? options.getResult(dialog) : true;
        close(result);
      });
    });

    document.addEventListener("keydown", onKeydown);
    if (!dialog.contains(document.activeElement)) {
      dialog.querySelector("[data-confirm-action='cancel']")?.focus();
    }
  });
}

function setActiveView(viewName, options = {}) {
  document.querySelectorAll(".toolbar-tab").forEach(button => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  if (typeof setHelpContext === "function") {
    setHelpContext(viewName);
  }

  if (viewName === "dashboard") {
    renderDashboardView();
    return;
  }

  if (viewName === "portfolio") {
    renderPortfolioView(options);
    focusTrackedRow(options.focusId, "portfolio");
    refreshPrices();
    return;
  }

  if (viewName === "radar") {
    renderRadarView(options);
    focusTrackedRow(options.focusId, "radar");
    refreshPrices();
    return;
  }

  if (viewName === "transactions") {
    renderTransactionsView();
    return;
  }

  if (viewName === "signals") {
    renderSignalsView();
    return;
  }

  if (viewName === "thesis") {
    renderThesisView();
    return;
  }

  if (viewName === "history") {
    renderHistoryView();
    return;
  }

  if (viewName === "admin") {
    renderAdminView();
    return;
  }

}

function focusTrackedRow(cardId, source) {
  if (!cardId) return;

  const tableId = source === "portfolio" ? "portfolioTable" : "radarList";
  const filterPrefix = source === "portfolio" ? "portfolio" : "radar";
  let row = document.getElementById(tableId)?.querySelector(`[data-row-id="${escapeAttribute(cardId)}"]`);

  if (!row) {
    resetCardFilters(filterPrefix);
    if (source === "portfolio" && typeof refreshPortfolioTable === "function") refreshPortfolioTable();
    if (source === "radar" && typeof renderRadarItems === "function") renderRadarItems();
    row = document.getElementById(tableId)?.querySelector(`[data-row-id="${escapeAttribute(cardId)}"]`);

    if (row && typeof showAppNotice === "function") {
      showAppNotice("Filters reset to show the selected card.", "info");
    }
  }

  if (!row) {
    if (typeof showAppNotice === "function") {
      showAppNotice("Selected card is not visible in this table yet.", "warning");
    }
    return;
  }

  row.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  row.classList.add("ms-table__row--focused");
  window.setTimeout(() => row.classList.remove("ms-table__row--focused"), 2600);
}

function openTrackedSource(source, cardId) {
  const item = typeof findTrackedCard === "function" ? findTrackedCard(cardId, source) : null;
  setActiveView(source === "portfolio" ? "portfolio" : "radar", {
    focusId: cardId,
    filterToId: cardId,
    filterLabel: item?.name || "",
  });
}

function initNavigation() {
  document.querySelectorAll(".toolbar-tab").forEach(button => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.view);
    });
  });
}

let universalSearchDebounce;

function initUniversalSearch() {
  const input = document.getElementById("universalSearch");
  const button = document.getElementById("universalSearchButton");
  if (!input || !button) return;

  const results = document.createElement("div");
  results.id = "universalSearchResults";
  results.className = "universal-search-results";
  input.insertAdjacentElement("afterend", results);

  const run = () => {
    const query = input.value.trim();
    hideUniversalSearchResults(results);
    setActiveView("radar", { searchQuery: query });
  };

  button.addEventListener("click", run);
  input.addEventListener("input", () => updateUniversalSearchResults(input, results));
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      run();
    }

    if (event.key === "Escape") {
      hideUniversalSearchResults(results);
    }
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".global-search-bar")) {
      hideUniversalSearchResults(results);
    }
  });
}

function updateUniversalSearchResults(input, results) {
  window.clearTimeout(universalSearchDebounce);

  universalSearchDebounce = window.setTimeout(async () => {
    const query = input.value.trim();

    if (query.length < 2) {
      hideUniversalSearchResults(results);
      return;
    }

    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      renderUniversalSearchResults((data.data || []).slice(0, 5), input, results);
    } catch (err) {
      console.warn("Global autocomplete failed", err);
      hideUniversalSearchResults(results);
    }
  }, 180);
}

function renderUniversalSearchResults(names, input, results) {
  if (!names.length) {
    hideUniversalSearchResults(results);
    return;
  }

  results.innerHTML = names.map(name => `
    <button type="button" data-universal-search="${escapeAttribute(name)}">${escapeHtml(name)}</button>
  `).join("");

  results.querySelectorAll("[data-universal-search]").forEach(button => {
    button.addEventListener("click", () => {
      input.value = button.dataset.universalSearch;
      hideUniversalSearchResults(results);
      setActiveView("radar", { searchQuery: input.value });
    });
  });

  results.classList.add("show");
}

function hideUniversalSearchResults(results) {
  results.innerHTML = "";
  results.classList.remove("show");
}

function initApp() {
  initNavigation();
  initUniversalSearch();
  if (typeof initHelp === "function") {
    initHelp();
  }
  updatePL();
  updateTotals();
  renderPriceRefreshStatus();
  refreshPrices();
  setActiveView("dashboard");
}

async function addSpec(card) {
  const options = typeof requestRadarAddIntent === "function"
    ? await requestRadarAddIntent(card)
    : {};
  if (!options) return;

  const { finish, ...planOptions } = options;
  const trackedCard = finish && typeof buildPrintingFinishCard === "function"
    ? buildPrintingFinishCard(card, finish)
    : card;
  const added = addRadarItem(trackedCard, planOptions);

  if (added) {
    showAppNotice(`${trackedCard.name} added to Radar.`);
  } else {
    showAppNotice(`${trackedCard.name} is already on Radar.`, "info");
  }

  if (typeof dismissRadarSearchSurface === "function") {
    dismissRadarSearchSurface({ clearInput: true, blurInput: true });
  }

  return { added, card: trackedCard };
}

initApp();
