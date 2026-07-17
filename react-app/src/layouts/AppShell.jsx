import { NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/manaspec-mark.png";

const navigation = [
  ["dashboard", "Dashboard", "◔"],
  ["radar", "Radar", "◎"],
  ["positions", "Positions", "▣"],
  ["signals", "Signals", "⌁"],
  ["transactions", "Transactions", "⇄"],
  ["history", "History", "↶"],
  ["admin", "Admin", "⚙"],
];

export function AppShell() {
  const navigate = useNavigate();

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
            ManaSpec <small>React spike</small>
          </h1>
          <p className="app-subtitle">MTG speculation workflow and positions terminal</p>
        </div>
        <div className="app-header-actions">
          <section id="summaryBar" aria-label="Account summary">
            <div><span>Cash</span> <strong>$0.00</strong></div>
            <div><span>Invested</span> <strong>$0.00</strong></div>
            <div><span>Value</span> <strong>$0.00</strong></div>
            <div><span>Total</span> <strong>$0.00</strong></div>
            <div><span>P/L</span> <strong>$0.00</strong></div>
            <div id="priceRefreshStatus">Prices: not checked</div>
          </section>
          <button type="button" className="help-open-btn">Help</button>
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
              <span className="toolbar-tab-icon" aria-hidden="true">{icon}</span>
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
      <section className="view-container">
        <Outlet />
      </section>
      <footer>
        <small>ManaSpec React modernization spike<br />&copy; 2026 Jason Elie</small>
      </footer>
    </main>
  );
}
