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
  return `$${Number(n || 0).toFixed(2)}`;
}

function showAppNotice(message, tone = "success") {
  const notice = document.getElementById("appNotice");
  if (!notice) return;

  notice.textContent = message;
  notice.className = `app-notice show ${tone}`;

  window.clearTimeout(showAppNotice.timeoutId);
  showAppNotice.timeoutId = window.setTimeout(() => {
    notice.className = "app-notice";
  }, 3200);
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
    renderPortfolioView();
    refreshPrices();
    return;
  }

  if (viewName === "radar") {
    renderRadarView(options);
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

function addSpec(card) {
  const added = addRadarItem(card);

  if (added) {
    showAppNotice(`${card.name} added to Radar.`);
  } else {
    showAppNotice(`${card.name} is already on Radar.`, "info");
  }
}

initApp();
