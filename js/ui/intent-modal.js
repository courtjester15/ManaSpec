/*
====================================
INTENT MODAL
====================================

Shared lightweight planning dialog for exact printing actions.
Used when a card enters Radar and as the pattern for buy intent.
====================================
*/

function requestCardIntentModal(options = {}) {
  if (typeof requestAppConfirmation !== "function") {
    return Promise.resolve({});
  }

  const item = options.item || {};
  const title = options.title || "Card Plan";
  const confirmLabel = options.confirmLabel || "Save";
  const price = Number(options.price || 0);
  const qtyValue = options.qtyValue ?? "";
  const entryValue = options.entryValue ?? "";
  const holdValue = options.holdValue ?? "";
  const notePlaceholder = options.notePlaceholder || "Optional note";
  const priceLabel = options.priceLabel || "Current app price";
  const showPrice = Boolean(options.showPrice);
  const showBuyPrice = Boolean(options.showBuyPrice);
  const showEntry = options.showEntry !== false;
  const showHold = options.showHold !== false;
  const finishOptions = options.finishOptions || [];
  const selectedFinish = options.selectedFinish || (finishOptions.length === 1 ? finishOptions[0].value : "");

  return requestAppConfirmation({
    title,
    message: formatIntentModalCardLine(item),
    confirmLabel,
    cancelLabel: options.cancelLabel || "Cancel",
    tone: options.tone || "info",
    bodyHtml: `
      <div class="intent-modal-grid">
        ${renderIntentFinishChoice(finishOptions, selectedFinish)}
        ${showPrice ? `
          <div class="intent-price-summary">
            <span>${escapeHtml(priceLabel)}</span>
            <strong>${money(price)}</strong>
          </div>
        ` : ""}
        <label>
          <span>${escapeHtml(options.qtyLabel || "Qty Wanted")}</span>
          <input id="intentQty" type="number" min="1" step="1" value="${escapeAttribute(qtyValue)}" placeholder="Optional">
        </label>
        ${showBuyPrice ? `
        <label>
          <span>${escapeHtml(options.buyPriceLabel || "Buy Price")}</span>
          <span class="money-input-wrap">
            <em>$</em>
            <input id="intentBuyPrice" type="text" inputmode="decimal" pattern="[0-9$,.]*" value="${escapeAttribute(options.buyPriceValue ?? price)}" placeholder="0.00">
          </span>
        </label>
        ` : ""}
        ${showEntry ? `
        <label class="intent-entry-field">
          <span>${escapeHtml(options.entryLabel || "Entry Target")}</span>
          <span class="money-input-wrap">
            <em>$</em>
            <input id="intentEntry" type="text" inputmode="decimal" pattern="[0-9$,.]*" value="${escapeAttribute(entryValue)}" placeholder="Optional">
          </span>
        </label>
        ` : ""}
        ${showHold ? `
        <label class="intent-hold-field">
          <span>${escapeHtml(options.holdLabel || "Hold Duration")}</span>
          <input id="intentHold" type="text" inputmode="numeric" pattern="[0-9-]*" value="${escapeAttribute(holdValue)}" placeholder="Months">
          <small class="hold-time-helper">Examples: 3, 6-12, 12-18 months</small>
        </label>
        ` : ""}
        <label class="intent-modal-note">
          <span>${escapeHtml(options.noteLabel || "First Note")}</span>
          <textarea id="intentNote" placeholder="${escapeAttribute(notePlaceholder)}"></textarea>
        </label>
      </div>
    `,
    onOpen: dialog => {
      bindIntentFinishChoice(dialog);
      bindIntentKeyboardSubmit(dialog);
      const qty = dialog.querySelector("#intentQty");
      qty?.focus();
      qty?.select();
      if (typeof options.onOpen === "function") options.onOpen(dialog);
    },
    getResult: dialog => {
      const rawQty = dialog.querySelector("#intentQty")?.value || "";
      const rawEntry = dialog.querySelector("#intentEntry")?.value || "";
      const rawHold = dialog.querySelector("#intentHold")?.value || "";
      const rawBuyPrice = dialog.querySelector("#intentBuyPrice")?.value || "";
      const holdMonths = typeof parseHoldMonthsInput === "function"
        ? parseHoldMonthsInput(rawHold)
        : Number(rawHold || 0);
      const entryTarget = typeof parseWholeDollarInput === "function"
        ? parseWholeDollarInput(rawEntry)
        : Number(rawEntry || 0);
      const buyPrice = typeof parseWholeDollarInput === "function"
        ? parseWholeDollarInput(rawBuyPrice)
        : Number(String(rawBuyPrice || "").replace(/[^\d.]/g, "") || 0);

      return {
        quantity: rawQty === "" ? 0 : Math.max(1, Number(rawQty || 1)),
        entryTarget: entryTarget === null ? 0 : entryTarget,
        buyPrice: buyPrice === null ? 0 : buyPrice,
        holdTime: typeof formatHoldTime === "function"
          ? formatHoldTime(holdMonths)
          : (holdMonths ? `${holdMonths} mo` : ""),
        initialNote: dialog.querySelector("#intentNote")?.value.trim() || "",
        finish: dialog.querySelector("input[name='intentFinish']:checked")?.value || selectedFinish || "",
      };
    },
  }).then(result => result || null);
}

function bindIntentKeyboardSubmit(dialog) {
  dialog.querySelectorAll(".intent-modal-grid input").forEach(input => {
    input.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      dialog.querySelector("[data-confirm-action='confirm']")?.click();
    });
  });
}

function requestRadarAddIntent(card) {
  const finishOptions = getIntentFinishOptions(card);
  if (!finishOptions.length) { showAppNotice("Supported finishes are unavailable. Reload the exact printing.", "warning"); return Promise.resolve(null); }
  const selectedFinish = getIntentSelectedFinish(card, finishOptions);
  const price = getIntentCardPrice(card, selectedFinish);
  return requestCardIntentModal({
    item: card,
    title: "Add to Radar",
    confirmLabel: "Save to Radar",
    qtyLabel: "Qty Wanted",
    qtyValue: "",
    entryValue: price ? Math.round(price) : "",
    notePlaceholder: "Optional initial thesis",
    finishOptions,
    selectedFinish,
  }).then(result => {
    if (!result) return null;
    return {
      plannedQty: result.quantity || 1,
      entryTarget: result.entryTarget,
      holdTime: result.holdTime,
      initialNote: result.initialNote,
      finish: ManaSpecFinishPolicy.selectFinish(card, result.finish || selectedFinish),
    };
  });
}

function requestRadarBuyIntent(item, options = {}) {
  const price = Number(options.price || item.currentPrice || 0);
  return requestCardIntentModal({
    item,
    title: "Buy from Radar",
    confirmLabel: "Buy",
    qtyLabel: "Qty Purchased",
    qtyValue: options.quantity || 1,
    showEntry: false,
    showHold: false,
    showBuyPrice: true,
    buyPriceValue: price ? price.toFixed(2) : "",
    notePlaceholder: "Optional buy note",
    showPrice: true,
    price,
    priceLabel: "Scryfall reference",
    tone: "trade",
  });
}

function renderIntentFinishChoice(finishOptions, selectedFinish) {
  if (!finishOptions?.length) return "";
  if (finishOptions.length === 1) return `<p>Finish: <strong>${escapeHtml(finishOptions[0].label)}</strong> (only supported finish)</p>`;

  return `
    <fieldset class="intent-finish-choice">
      <legend>Version</legend>
      ${finishOptions.map(option => `
        <label>
          <input type="radio" name="intentFinish" value="${escapeAttribute(option.value)}" data-price="${escapeAttribute(option.price ?? "")}" ${option.value === selectedFinish ? "checked" : ""}>
          <span>${escapeHtml(option.label)}</span>
          <strong>${option.price !== null ? money(option.price) : "?"}</strong>
        </label>
      `).join("")}
    </fieldset>
  `;
}

function bindIntentFinishChoice(dialog) {
  const choices = dialog.querySelectorAll("input[name='intentFinish']");
  if (!choices.length) return;

  const entry = dialog.querySelector("#intentEntry");
  let lastDefault = entry?.value || "";
  const confirm = dialog.querySelector("[data-confirm-action=\"confirm\"]");
  const validate = () => { if (confirm) confirm.disabled = !dialog.querySelector("input[name=\"intentFinish\"]:checked"); };
  validate();

  choices.forEach(choice => {
    choice.addEventListener("change", () => {
      validate();
      if (!entry) return;
      const nextDefault = choice.dataset.price ? String(Math.round(Number(choice.dataset.price || 0))) : "";
      if (!entry.value || entry.value === lastDefault) {
        entry.value = nextDefault;
      }
      lastDefault = nextDefault;
    });
  });
}

function formatIntentModalCardLine(item) {
  return [
    item.name || "Selected printing",
    item.set?.toUpperCase() || item.set_code || "",
    item.collector_number ? `#${item.collector_number}` : "",
    item.foil ? "foil" : "",
  ].filter(Boolean).join(" ");
}

function getIntentCardPrice(card, finish = "") {
  return finish ? ManaSpecFinishPolicy.exactPrice(card, finish) : null;
}

function getIntentFinishOptions(card) {
  return ManaSpecFinishPolicy.supportedFinishes(card).map(value => ({
    value, label: { nonfoil: "Nonfoil", foil: "Foil", etched: "Etched" }[value],
    price: ManaSpecFinishPolicy.exactPrice(card, value),
  }));
}

function getIntentSelectedFinish(card, finishOptions) {
  if (card.finish && finishOptions.some(option => option.value === card.finish)) return card.finish;
  return finishOptions.length === 1 ? finishOptions[0].value : "";
}
