/*
====================================
TRADING ENGINE
====================================

Handles:
- buy actions
- sell actions
- delete actions
- position updates
====================================
*/

function buySpec(positionOrEvent, maybeCell) {
  const s = getSpec(positionOrEvent, maybeCell);
  if (!s) return;
  const price = Number(s.currentPrice);

  if (!price) {
    alert("Price not loaded yet");
    return;
  }

  if (cash < price) {
    alert("Not enough cash");
    return;
  }

  if (s.qty === 0) {
    s.buyDate = new Date().toISOString();
  }

  cash -= price;
  s.qty += 1;
  s.buyPrice = ((s.buyPrice * (s.qty - 1)) + price) / s.qty;

  if (typeof logTransaction === "function") {
    logTransaction(s, "BUY", 1, price);
  }

  updatePL();
  save();

  if (typeof showAppNotice === "function") {
    showAppNotice(`Bought 1 ${s.name} for ${money(price)}.`, "trade");
  }
}

function sellSpec(positionOrEvent, maybeCell, requestedQuantity = 1) {
  if (typeof maybeCell === "number") {
    requestedQuantity = maybeCell;
    maybeCell = null;
  }

  const s = getSpec(positionOrEvent, maybeCell);
  if (!s) return;
  if (s.qty <= 0) return;

  const price = Number(s.currentPrice || s.buyPrice || 0);
  const ownedQty = Number(s.qty || 0);
  const initialQty = Math.min(ownedQty, Math.max(1, Number(requestedQuantity || 1)));

  requestAppConfirmation({
    title: "Confirm Sale",
    message: `${s.name} at ${money(price)} each. This will log a SELL transaction and reduce the position quantity.`,
    bodyHtml: `
      <div class="sell-confirm-grid">
        <label>
          <span>Quantity to sell</span>
          <input id="sellConfirmQty" type="number" min="1" max="${ownedQty}" step="1" value="${initialQty}">
        </label>
        <div class="sell-confirm-total">
          <span>Estimated Total</span>
          <strong id="sellConfirmTotal">${money(price * initialQty)}</strong>
        </div>
      </div>
      <div class="sell-confirm-options">
        <button type="button" data-sell-qty="1">Sell 1</button>
        <button type="button" data-sell-qty="${ownedQty}">Sell All ${ownedQty}</button>
      </div>
    `,
    confirmLabel: "Sell",
    tone: "danger",
    onOpen: dialog => {
      const input = dialog.querySelector("#sellConfirmQty");
      const total = dialog.querySelector("#sellConfirmTotal");
      const clampQty = value => Math.min(ownedQty, Math.max(1, Number(value || 1)));
      const updateTotal = () => {
        input.value = String(clampQty(input.value));
        total.textContent = money(price * Number(input.value || 1));
      };

      input.addEventListener("input", updateTotal);
      dialog.querySelectorAll("[data-sell-qty]").forEach(button => {
        button.addEventListener("click", () => {
          input.value = String(clampQty(button.dataset.sellQty));
          updateTotal();
        });
      });
      input.focus();
      input.select();
    },
    getResult: dialog => ({
      quantity: Math.min(ownedQty, Math.max(1, Number(dialog.querySelector("#sellConfirmQty")?.value || 1))),
    }),
  }).then(confirmed => {
    if (!confirmed) return;

    const sellQty = confirmed.quantity;
    const total = price * sellQty;

    s.qty -= sellQty;
    cash += total;

    if (typeof logTransaction === "function") {
      logTransaction(s, "SELL", sellQty, price);
    }

    if (s.qty === 0) {
      specs = specs.filter(x => x.id !== s.id);
    }

    updatePL();
    save();

    if (typeof showAppNotice === "function") {
      const suffix = s.qty === 0 ? " Position is now closed." : "";
      showAppNotice(`Sold ${sellQty} ${s.name} for ${money(total)}.${suffix}`, "trade");
    }
  });
}

function deleteSpec(positionOrEvent, maybeCell) {
  const s = getSpec(positionOrEvent, maybeCell);
  if (!s) return;

  if (!confirm(`Delete ${s.name} from Positions? This removes the current position without logging a transaction.`)) {
    return;
  }

  specs = specs.filter(x => x.id !== s.id);
  save();

  if (typeof showAppNotice === "function") {
    showAppNotice(`${s.name} deleted from Positions. No transaction was logged.`, "warning");
  }
}

function resetCash() {
  cash = startingCash;
  localStorage.setItem("cash", cash);
  updateTotals();
}
