import { useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/manaspec-mark.png";
import { calculatePortfolioSummary, formatMoney, formatPriceRefreshStatus } from "../domain/portfolio.js";
import { useAppState } from "../state/AppState.jsx";

const navigation = [
  ["dashboard", "Dashboard", <><path d="M12 3v9h9" /><path d="M20.5 15.5A9 9 0 1 1 8.5 3.5" /></>],
  ["radar", "Radar", <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></>],
  ["positions", "Positions", <><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M9 7V5h6v2M4 12h16M10 12v2h4v-2" /></>],
  ["signals", "Signals", <><path d="M5 12a7 7 0 0 1 14 0M8 12a4 4 0 0 1 8 0M12 12v6M9 18h6" /></>],
  ["transactions", "Transactions", <><path d="M7 7h11m-3-3 3 3-3 3M17 17H6m3-3-3 3 3 3" /></>],
  ["history", "History", <><path d="M4 12a8 8 0 1 0 2.3-5.7M4 5v5h5M12 8v5l3 2" /></>],
  ["admin", "Admin", <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7.8 7.8 0 0 0-1.7-1L14.5 3h-5l-.4 3.1a7.8 7.8 0 0 0-1.7 1l-2.4-1-2 3.4L5 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.8 7.8 0 0 0 1.7 1l.4 3.1h5l.4-3.1a7.8 7.8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z" /></>],
];

export function AppShell() {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const { state, storagePersistent } = useAppState();
  const summary = useMemo(() => calculatePortfolioSummary(state.specs, state.cash), [state.cash, state.specs]);
  const profitLoss = `${summary.profitLoss >= 0 ? "+" : ""}${formatMoney(summary.profitLoss)} (${summary.profitLossPercent.toFixed(1)}%)`;

  function submitSearch(event) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("query")?.trim();
    navigate(query ? `/radar?query=${encodeURIComponent(query)}` : "/radar");
  }

  return (
    <main className="container">
      <header className="app-header">
        <div className="app-logo-frame" aria-hidden="true">
          <img className="app-logo" src={logo} alt="" />
        </div>
        <div className="app-title-block">
          <h1>
            ManaSpec <small>v0.9.0-alpha.1</small>
          </h1>
          <p className="app-subtitle">MTG speculation workflow and positions terminal</p>
        </div>
        <div className="app-header-actions">
          <section id="summaryBar" aria-label="Account summary">
            <div><span>Cash</span> <strong>{formatMoney(summary.cash)}</strong></div>
            <div><span>Invested</span> <strong>{formatMoney(summary.invested)}</strong></div>
            <div><span>Value</span> <strong>{formatMoney(summary.value)}</strong></div>
            <div><span>Total</span> <strong>{formatMoney(summary.totalEquity)}</strong></div>
            <div><span>P/L</span> <strong className={summary.profitLoss >= 0 ? "positive" : "negative"}>{profitLoss}</strong></div>
            <div id="priceRefreshStatus">{formatPriceRefreshStatus(state.priceRefreshStatus)}</div>
          </section>
          <button type="button" className="help-open-btn" onClick={() => setHelpOpen(true)}>Help</button>
        </div>
      </header>

      <section className="workbar">
        <nav className="toolbar" aria-label="Main navigation">
          {navigation.map(([path, label, icon]) => (
            <NavLink
              key={path}
              className={({ isActive }) => `toolbar-tab${isActive ? " active" : ""}`}
              to={`/${path}`}
            >
              <span className="toolbar-tab-icon" aria-hidden="true"><svg viewBox="0 0 24 24">{icon}</svg></span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <form className="global-search-bar" role="search" onSubmit={submitSearch}>
          <label className="visually-hidden" htmlFor="universalSearch">Search cards</label>
          <input id="universalSearch" name="query" placeholder="Search cards..." />
          <button type="submit">Search</button>
        </form>
      </section>

      <div className="toast-stack" role="status" aria-live="polite" />
      {!storagePersistent && (
        <div className="storage-warning" role="status">
          Browser storage is unavailable in this context. Changes will last only until this tab closes.
        </div>
      )}
      <section className="view-container">
        <Outlet />
      </section>
      <footer>
        <small>ManaSpec v0.9.0-alpha.1<br />&copy; 2026 Jason Elie</small>
      </footer>
      {helpOpen && (
        <div className="help-scrim" onClick={() => setHelpOpen(false)}>
          <aside className="help-drawer" onClick={event => event.stopPropagation()} aria-label="ManaSpec help">
            <header><h3>ManaSpec workflow</h3><button onClick={() => setHelpOpen(false)} aria-label="Close help">×</button></header>
            <section>
              <h4>1. Research on Radar</h4><p>Search Scryfall, select the exact printing and finish, set an entry target and planned quantity, then record decision notes.</p>
              <h4>2. Buy into Positions</h4><p>A Radar buy creates or adds to a Position, updates weighted cost basis and cash, and logs a BUY. The candidate stays on Radar.</p>
              <h4>3. Review signals</h4><p>Entry and exit targets drive the attention queue. Signals are computed from your saved plan and current prices.</p>
              <h4>4. Exit and preserve history</h4><p>Selling reduces or closes a Position, increases cash, logs realized P/L, and remains visible in Transactions and History.</p>
              <h4>Protect your work</h4><p>ManaSpec stores data in this browser. Export a JSON backup from Admin before browser cleanup or moving devices.</p>
            </section>
          </aside>
        </div>
      )}
    </main>
  );
}
