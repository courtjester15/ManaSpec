function renderPortfolioView() {
  document.getElementById("viewContainer").innerHTML = `
  
    <h2>ManaSpec <small>v0.8.0-alpha</small></h2>

    <div id="summaryBar">
      <div>Cash: $<span id="cash">0</span></div>
      <div>Invested: $<span id="invested">0</span></div>
      <div>Value: $<span id="value">0</span></div>
      <div>Total: $<span id="totalEquity">0</span></div>
      <div>P/L: <span id="totalPL">0</span></div>

      <button class="cash-reset-btn" onclick="resetCash()">
        Reset Cash
      </button>
    </div>

    <!-- SEARCH PANEL -->
    <input id="searchBox" placeholder="Search cards (Scryfall)...">

    <div id="searchResults"
         style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 5px;">
    </div>

    <!-- PRINTINGS PANEL -->
    <div id="printingsView"
         style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 5px;">
    </div>

    <hr>

    <!-- PORTFOLIO TABLE -->
    <div id="table"></div>

  `;
}