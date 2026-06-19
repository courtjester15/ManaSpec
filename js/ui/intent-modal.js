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
  const finishOptions = options.finishOptions || [];
  const selectedFinish = options.selectedFinish || finishOptions[0]?.value || "";

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
          <span>${escapeHtml(options.qtyLabel || "Qty Target")}</span>
          <input id="intentQty" type="number" min="1" step="1" value="${escapeAttribute(qtyValue)}" placeholder="Optional">
        </label>
        <label>
          <span>${escapeHtml(options.entryLabel || "Entry Target")}</span>
          <input id="intentEntry" type="text" inputmode="numeric" pattern="[0-9]*" value="${escapeAttribute(entryValue)}" placeholder="Optional">
        </label>
        <label>
          <span>${escapeHtml(options.holdLabel || "Hold Duration")}</span>
          <input id="intentHold" type="text" inputmode="numeric" pattern="[0-9]*" value="${escapeAttribute(holdValue)}" placeholder="Months">
        </label>
        <label class="intent-modal-note">
          <span>${escapeHtml(options.noteLabel || "First Note")}</span>
          <textarea id="intentNote" placeholder="${escapeAttribute(notePlaceholder)}"></textarea>
        </label>
      </div>
    `,
    onOpen: dialog => {
      bindIntentFinishChoice(dialog);
      const qty = dialog.querySelector("#intentQty");
      qty?.focus();
      qty?.select();
      if (typeof options.onOpen === "function") options.onOpen(dialog);
    },
    getResult: dialog => {
      const rawQty = dialog.querySelector("#intentQty")?.value || "";
      const rawEntry = dialog.querySelector("#intentEntry")?.value || "";
      const rawHold = dialog.querySelector("#intentHold")?.value || "";
      const holdMonths = typeof parseHoldMonthsInput === "function"
        ? parseHoldMonthsInput(rawHold)
        : Number(rawHold || 0);

      return {
        quantity: rawQty === "" ? 0 : Math.max(1, Number(rawQty || 1)),
        entryTarget: typeof parseWholeDollarInput === "function"
          ? parseWholeDollarInput(rawEntry)
          : Number(rawEntry || 0),
        holdTime: typeof formatHoldTime === "function"
          ? formatHoldTime(holdMonths)
          : (holdMonths ? `${holdMonths} mo` : ""),
        initialNote: dialog.querySelector("#intentNote")?.value.trim() || "",
        finish: dialog.querySelector("input[name='intentFinish']:checked")?.value || selectedFinish || "",
      };
    },
  }).then(result => result || null);
}

function requestRadarAddIntent(card) {
  const finishOptions = getIntentFinishOptions(card);
  const selectedFinish = getIntentSelectedFinish(card, finishOptions);
  const price = getIntentCardPrice(card, selectedFinish);
  return requestCardIntentModal({
    item: card,
    title: "Add to Radar",
    confirmLabel: "Save to Radar",
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
      finish: result.finish || selectedFinish,
    };
  });
}

function requestRadarBuyIntent(item, options = {}) {
  const price = Number(options.price || item.currentPrice || 0);
  return requestCardIntentModal({
    item,
    title: "Buy from Radar",
    confirmLabel: "Buy",
    qtyLabel: "Qty Bought",
    entryLabel: "Entry Target",
    holdLabel: "Hold Duration",
    qtyValue: options.quantity || 1,
    entryValue: item.entryTarget ? Math.round(Number(item.entryTarget || 0)) : "",
    holdValue: typeof getHoldMonths === "function" ? getHoldMonths(item.holdTime) || "" : "",
    notePlaceholder: "Optional buy note",
    showPrice: true,
    price,
    priceLabel: "Sim buy price",
    tone: "trade",
  });
}

function renderIntentFinishChoice(finishOptions, selectedFinish) {
  if (!finishOptions || finishOptions.length <= 1) return "";

  return `
    <fieldset class="intent-finish-choice">
      <legend>Version</legend>
      ${finishOptions.map(option => `
        <label>
          <input type="radio" name="intentFinish" value="${escapeAttribute(option.value)}" data-price="${escapeAttribute(option.price || "")}" ${option.value === selectedFinish ? "checked" : ""}>
          <span>${escapeHtml(option.label)}</span>
          <strong>${option.price ? money(option.price) : "?"}</strong>
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

  choices.forEach(choice => {
    choice.addEventListener("change", () => {
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
  const prices = card.prices || {};
  if (finish === "foil") return Number(prices.usd_foil || prices.usd || 0);
  if (finish === "nonfoil") return Number(prices.usd || prices.usd_foil || 0);
  return Number(card.foil ? prices.usd_foil || prices.usd : prices.usd || prices.usd_foil || 0);
}

function getIntentFinishOptions(card) {
  const finishes = Array.isArray(card.finishes) ? card.finishes : [];
  const options = [];

  if (!finishes.length || finishes.includes("nonfoil")) {
    options.push({
      value: "nonfoil",
      label: "Nonfoil",
      price: Number(card.prices?.usd || 0),
    });
  }

  if (finishes.includes("foil")) {
    options.push({
      value: "foil",
      label: "Foil",
      price: Number(card.prices?.usd_foil || 0),
    });
  }

  return options.length ? options : [{ value: "nonfoil", label: "Nonfoil", price: Number(card.prices?.usd || 0) }];
}

function getIntentSelectedFinish(card, finishOptions) {
  if (card.foil && finishOptions.some(option => option.value === "foil")) return "foil";
  if (finishOptions.some(option => option.value === "nonfoil")) return "nonfoil";
  return finishOptions[0]?.value || "nonfoil";
}
