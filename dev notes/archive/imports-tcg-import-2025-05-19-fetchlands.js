(function importTcgBuys20250519() {
  const PURCHASE_DATE = "2025-05-19T12:00:00.000Z";
  const SOURCE_LABEL = "TCG import 2025-05-19";
  const REDUCE_CASH = false;
  const RELOAD_AFTER_IMPORT = true;

  const items = [
    {
      purchasePrice: 15,
      quantity: 1,
      condition: "Near Mint Foil",
      card: {
        id: "6f941fee-aea1-4afb-ada4-7bbab39c2f6c",
        oracle_id: "fc0707c7-d504-4ccf-a0d2-3eb6e26e7a57",
        name: "Bloodstained Mire",
        set: "mh3",
        set_name: "Modern Horizons 3",
        collector_number: "352",
        rarity: "rare",
        released_at: "2024-06-14",
        type_line: "Land",
        oracle_text: "{T}, Pay 1 life, Sacrifice this land: Search your library for a Swamp or Mountain card, put it onto the battlefield, then shuffle.",
        colors: [],
        color_identity: [],
        mana_cost: "",
        cmc: 0,
        reserved: false,
        reprint: true,
        set_type: "draft_innovation",
        artist: "Sean Vo",
        promo: false,
        finishes: ["nonfoil", "foil"],
        frame: "2015",
        border_color: "borderless",
        security_stamp: "oval",
        prices: { usd: "33.46", usd_foil: "71.99" },
        image_uris: {
          normal: "https://cards.scryfall.io/normal/front/6/f/6f941fee-aea1-4afb-ada4-7bbab39c2f6c.jpg?1717014315"
        }
      }
    },
    {
      purchasePrice: 16,
      quantity: 1,
      condition: "Near Mint Foil",
      card: {
        id: "7996ab8e-5fa4-4d39-8c7b-12e4258bf8a9",
        oracle_id: "f3c7af78-a77d-4134-82a2-a5ce84285a84",
        name: "Flooded Strand",
        set: "mh3",
        set_name: "Modern Horizons 3",
        collector_number: "353",
        rarity: "rare",
        released_at: "2024-06-14",
        type_line: "Land",
        oracle_text: "{T}, Pay 1 life, Sacrifice this land: Search your library for a Plains or Island card, put it onto the battlefield, then shuffle.",
        colors: [],
        color_identity: [],
        mana_cost: "",
        cmc: 0,
        reserved: false,
        reprint: true,
        set_type: "draft_innovation",
        artist: "Salvatorre Zee Yazzie",
        promo: false,
        finishes: ["nonfoil", "foil"],
        frame: "2015",
        border_color: "borderless",
        security_stamp: "oval",
        prices: { usd: "32.10", usd_foil: "77.24" },
        image_uris: {
          normal: "https://cards.scryfall.io/normal/front/7/9/7996ab8e-5fa4-4d39-8c7b-12e4258bf8a9.jpg?1717014323"
        }
      }
    },
    {
      purchasePrice: 11,
      quantity: 1,
      condition: "Near Mint Foil",
      card: {
        id: "26343f80-4d60-407a-a44a-ee6295d2e5ec",
        oracle_id: "29737a60-3ebd-40d9-b935-c4f54b90d45d",
        name: "Windswept Heath",
        set: "mh3",
        set_name: "Modern Horizons 3",
        collector_number: "360",
        rarity: "rare",
        released_at: "2024-06-14",
        type_line: "Land",
        oracle_text: "{T}, Pay 1 life, Sacrifice this land: Search your library for a Forest or Plains card, put it onto the battlefield, then shuffle.",
        colors: [],
        color_identity: [],
        mana_cost: "",
        cmc: 0,
        reserved: false,
        reprint: true,
        set_type: "draft_innovation",
        artist: "Samuele Bandini",
        promo: false,
        finishes: ["nonfoil", "foil"],
        frame: "2015",
        border_color: "borderless",
        security_stamp: "oval",
        prices: { usd: "23.43", usd_foil: "56.13" },
        image_uris: {
          normal: "https://cards.scryfall.io/normal/front/2/6/26343f80-4d60-407a-a44a-ee6295d2e5ec.jpg?1717014388"
        }
      }
    },
    {
      purchasePrice: 19,
      quantity: 2,
      condition: "Near Mint Foil",
      card: {
        id: "492fa77b-d103-446f-95d0-e4b11dfac05f",
        oracle_id: "6587a463-a108-4854-b6d1-944e89b8c8a4",
        name: "Wooded Foothills",
        set: "mh3",
        set_name: "Modern Horizons 3",
        collector_number: "361",
        rarity: "rare",
        released_at: "2024-06-14",
        type_line: "Land",
        oracle_text: "{T}, Pay 1 life, Sacrifice this land: Search your library for a Mountain or Forest card, put it onto the battlefield, then shuffle.",
        colors: [],
        color_identity: [],
        mana_cost: "",
        cmc: 0,
        reserved: false,
        reprint: true,
        set_type: "draft_innovation",
        artist: "Tomas Honz",
        promo: false,
        finishes: ["nonfoil", "foil"],
        frame: "2015",
        border_color: "borderless",
        security_stamp: "oval",
        prices: { usd: "26.67", usd_foil: "65.20" },
        image_uris: {
          normal: "https://cards.scryfall.io/normal/front/4/9/492fa77b-d103-446f-95d0-e4b11dfac05f.jpg?1717014397"
        }
      }
    }
  ];

  const parse = key => JSON.parse(localStorage.getItem(key) || "[]");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPrefix = `backup_before_${SOURCE_LABEL.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${timestamp}`;

  const specs = parse("specs");
  const transactions = parse("transactions");
  const radar = parse("radar");
  const importedIds = new Set();
  const existingTxIds = new Set(transactions.map(tx => tx.id));
  let importedQty = 0;
  let importedCost = 0;

  localStorage.setItem(`${backupPrefix}_specs`, JSON.stringify(specs));
  localStorage.setItem(`${backupPrefix}_transactions`, JSON.stringify(transactions));
  localStorage.setItem(`${backupPrefix}_radar`, JSON.stringify(radar));
  localStorage.setItem(`${backupPrefix}_cash`, localStorage.getItem("cash") || "");

  function buildPosition(item) {
    const card = item.card;
    const id = `${card.id}|foil`;
    const currentPrice = Number(card.prices.usd_foil || card.prices.usd || item.purchasePrice || 0);

    return {
      id,
      scryfall_id: card.id,
      oracle_id: card.oracle_id,
      name: card.name,
      set_code: card.set.toUpperCase(),
      set_name: card.set_name,
      collector_number: card.collector_number,
      foil: true,
      qty: Number(item.quantity || 0),
      buyPrice: Number(item.purchasePrice || 0),
      currentPrice,
      pl: ((currentPrice - Number(item.purchasePrice || 0)) * Number(item.quantity || 0)).toFixed(2),
      addedDate: PURCHASE_DATE,
      buyDate: PURCHASE_DATE,
      plannedQty: Math.max(1, Number(item.quantity || 1)),
      entryTarget: Number(item.purchasePrice || 0),
      exitTarget: 0,
      holdTime: "",
      importSource: SOURCE_LABEL,
      condition: item.condition,
      rarity: card.rarity,
      released_at: card.released_at,
      type_line: card.type_line,
      oracle_text: card.oracle_text,
      colors: card.colors,
      color_identity: card.color_identity,
      mana_cost: card.mana_cost,
      cmc: Number(card.cmc || 0),
      edhrec_rank: card.edhrec_rank || null,
      reserved: Boolean(card.reserved),
      reprint: Boolean(card.reprint),
      set_type: card.set_type,
      artist: card.artist,
      promo: Boolean(card.promo),
      finishes: card.finishes,
      frame: card.frame,
      border_color: card.border_color,
      security_stamp: card.security_stamp,
      prices: card.prices,
      image_uris: card.image_uris
    };
  }

  function mergePosition(position) {
    const existing = specs.find(spec => spec.id === position.id);

    if (!existing) {
      specs.push(position);
      return;
    }

    const existingQty = Number(existing.qty || 0);
    const newQty = Number(position.qty || 0);
    const totalQty = existingQty + newQty;
    const weightedBuyPrice = totalQty
      ? ((Number(existing.buyPrice || 0) * existingQty) + (Number(position.buyPrice || 0) * newQty)) / totalQty
      : Number(position.buyPrice || 0);

    Object.assign(existing, {
      ...position,
      ...existing,
      qty: totalQty,
      buyPrice: weightedBuyPrice,
      currentPrice: position.currentPrice,
      prices: position.prices,
      image_uris: position.image_uris,
      pl: ((position.currentPrice - weightedBuyPrice) * totalQty).toFixed(2),
      buyDate: [existing.buyDate, position.buyDate].filter(Boolean).sort()[0] || position.buyDate,
      addedDate: existing.addedDate || position.addedDate,
      importSource: [existing.importSource, SOURCE_LABEL].filter(Boolean).join(" | ")
    });
  }

  function addTransaction(item, position, index) {
    const txId = getTransactionId(position, index);
    if (existingTxIds.has(txId)) return;

    transactions.unshift({
      id: txId,
      cardId: position.id,
      name: position.name,
      set_code: position.set_code,
      set_name: position.set_name,
      collector_number: position.collector_number,
      foil: true,
      rarity: position.rarity,
      released_at: position.released_at,
      type_line: position.type_line,
      colors: position.colors,
      color_identity: position.color_identity,
      mana_cost: position.mana_cost,
      cmc: position.cmc,
      edhrec_rank: position.edhrec_rank,
      reserved: position.reserved,
      reprint: position.reprint,
      set_type: position.set_type,
      artist: position.artist,
      promo: position.promo,
      finishes: position.finishes,
      frame: position.frame,
      border_color: position.border_color,
      security_stamp: position.security_stamp,
      type: "BUY",
      quantity: Number(item.quantity || 0),
      price: Number(item.purchasePrice || 0),
      fees: 0,
      date: PURCHASE_DATE,
      notes: `${SOURCE_LABEL}: ${item.condition}, Extended Art.`
    });
    existingTxIds.add(txId);
  }

  function getTransactionId(position, index) {
    return `tcg|2025-05-19|${position.id}|buy|${index}`;
  }

  items.forEach((item, index) => {
    const position = buildPosition(item);
    const txId = getTransactionId(position, index + 1);
    if (existingTxIds.has(txId)) {
      console.warn(`Skipping already-imported row: ${position.name} ${position.set_code} #${position.collector_number}`);
      return;
    }

    importedIds.add(position.id);
    mergePosition(position);
    addTransaction(item, position, index + 1);
    importedQty += Number(item.quantity || 0);
    importedCost += Number(item.quantity || 0) * Number(item.purchasePrice || 0);
  });

  const nextRadar = radar.filter(item => !importedIds.has(item.id));

  localStorage.setItem("specs", JSON.stringify(specs));
  localStorage.setItem("transactions", JSON.stringify(transactions));
  localStorage.setItem("radar", JSON.stringify(nextRadar));

  if (REDUCE_CASH) {
    const currentCash = Number(localStorage.getItem("cash") || 10000);
    localStorage.setItem("cash", String(currentCash - importedCost));
  }

  console.table(items.map(item => ({
    card: item.card.name,
    set: item.card.set.toUpperCase(),
    number: item.card.collector_number,
    foil: true,
    quantity: item.quantity,
    buyPrice: item.purchasePrice,
    currentFoilPrice: item.card.prices.usd_foil
  })));
  console.log(`Imported ${importedQty} cards for $${importedCost.toFixed(2)}. Backups saved with prefix ${backupPrefix}. Cash changed: ${REDUCE_CASH}.`);

  if (RELOAD_AFTER_IMPORT) {
    location.reload();
  }
})();
