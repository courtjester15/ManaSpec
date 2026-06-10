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

const views = {
  dashboard: {
    title: "Dashboard",
    description: "Home base for portfolio awareness, alerts, and performance charts.",
  },
  signals: {
    title: "Signals",
    description: "Targets, price moves, and decision triggers will live here.",
  },
  thesis: {
    title: "Thesis",
    description: "Conviction notes, catalysts, and exit reasoning will live here.",
  },
  history: {
    title: "History",
    description: "Buy/sell records and learning data will live here.",
  },
};

function renderPlaceholderView(viewName) {
  const view = views[viewName];

  document.getElementById("viewContainer").innerHTML = `
    <section class="placeholder-view">
      <h3>${view.title}</h3>
      <p>${view.description}</p>
    </section>
  `;
}

function setActiveView(viewName) {
  document.querySelectorAll(".toolbar-tab").forEach(button => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  if (viewName === "portfolio") {
    renderPortfolioView();
    refreshPrices();
    return;
  }

  if (viewName === "radar") {
    renderRadarView();
    return;
  }

  renderPlaceholderView(viewName);
}

function initNavigation() {
  document.querySelectorAll(".toolbar-tab").forEach(button => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.view);
    });
  });
}

function initApp() {
  initNavigation();
  updatePL();
  updateTotals();
  setActiveView("dashboard");
}

function addSpec(card) {
  addRadarItem(card);
}

initApp();
