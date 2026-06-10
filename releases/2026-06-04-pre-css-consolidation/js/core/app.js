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
  saveState(specs, cash, table, updateTotals);

  if (typeof updatePortfolioCount === "function") {
    updatePortfolioCount();
  }
}

function getSpec(cell) {
  const row = cell.getRow().getData();
  return specs.find(x => x.id === row.id);
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

function initUniversalSearch() {
  const input = document.getElementById("universalSearch");
  const button = document.getElementById("universalSearchButton");
  if (!input || !button) return;

  const run = () => {
    const query = input.value.trim();
    setActiveView("radar", { searchQuery: query });
  };

  button.addEventListener("click", run);
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      run();
    }
  });
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
