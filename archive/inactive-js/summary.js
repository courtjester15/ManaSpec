function renderSummaryBar() {
  document.getElementById("summaryBar").innerHTML = `
    <div>Cash: $<span id="cash">0</span></div>
    <div>Invested: $<span id="invested">0</span></div>
    <div>Value: $<span id="value">0</span></div>
    <div>Total: $<span id="totalEquity">0</span></div>
    <div>P/L: <span id="totalPL">0</span></div>

    <button class="cash-reset-btn" onclick="resetCash()">
      Reset Cash
    </button>
  `;
}