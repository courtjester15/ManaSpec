export const SIGNAL_NOW = "2026-07-23T12:00:00.000Z";

const base = {
  set_code: "TST",
  set_name: "Signal Test",
  collector_number: "1",
  currentPrice: 10,
  priceUpdatedAt: "2026-07-22T12:00:00.000Z",
  foil: false,
};

export const signalFixtureState = {
  specs: [
    { ...base, id: "shared-printing|nonfoil", scryfall_id: "shared-printing", name: "Alpha Exit Hit", qty: 1, currentPrice: 110, exitTarget: 100, holdTime: "6 mo", buyDate: "2026-01-01T00:00:00.000Z" },
    { ...base, id: "shared-printing|foil", scryfall_id: "shared-printing", name: "Beta Exit Near Foil", qty: 1, foil: true, currentPrice: 96, exitTarget: 100, holdTime: "6 mo", buyDate: "2026-01-02T00:00:00.000Z" },
    { ...base, id: "position-outside", scryfall_id: "position-outside", name: "Gamma Outside Exit", qty: 1, currentPrice: 94, exitTarget: 100, holdTime: "6 mo", buyDate: "2026-01-03T00:00:00.000Z" },
    { ...base, id: "position-no-plan", scryfall_id: "position-no-plan", name: "Theta Missing Position Plan", qty: 1, currentPrice: 50, exitTarget: 0, holdTime: "", buyDate: "2026-01-04T00:00:00.000Z" },
    { ...base, id: "closed-position", scryfall_id: "closed-position", name: "Closed Position", qty: 0, currentPrice: 50, exitTarget: 40, holdTime: "6 mo" },
  ],
  radar: [
    { ...base, id: "radar-entry-hit", scryfall_id: "radar-entry-hit", name: "Delta Entry Hit", collector_number: "2", currentPrice: 9, entryTarget: 10, addedDate: "2026-01-05T00:00:00.000Z" },
    { ...base, id: "radar-approaching", scryfall_id: "radar-approaching", name: "Epsilon Entry Near", collector_number: "3", currentPrice: 10.5, entryTarget: 10, addedDate: "2026-01-06T00:00:00.000Z" },
    { ...base, id: "radar-outside", scryfall_id: "radar-outside", name: "Zeta Outside Entry", collector_number: "4", currentPrice: 10.51, entryTarget: 10, addedDate: "2026-01-07T00:00:00.000Z" },
    { ...base, id: "radar-no-plan", scryfall_id: "radar-no-plan", name: "Eta Missing Radar Plan", collector_number: "5", currentPrice: 8, entryTarget: 0, addedDate: "2026-01-08T00:00:00.000Z" },
    { ...base, id: "radar-stale", scryfall_id: "radar-stale", name: "Iota Stale Check", collector_number: "6", currentPrice: 20, entryTarget: 15, addedDate: "2026-01-09T00:00:00.000Z" },
    { ...base, id: "radar-fresh", scryfall_id: "radar-fresh", name: "Kappa Fresh Check", collector_number: "7", currentPrice: 20, entryTarget: 15, addedDate: "2026-01-10T00:00:00.000Z" },
  ],
  marketObservations: [
    { id: "market-nonfoil", cardKey: "shared-printing|nonfoil", source: "tcgplayer", checkedAt: "2026-07-22T12:00:00.000Z", marketPrice: 109 },
    { id: "market-foil", cardKey: "shared-printing|foil", source: "tcgplayer", checkedAt: "2026-07-21T12:00:00.000Z", marketPrice: 97 },
    { id: "market-position-outside", cardKey: "position-outside|nonfoil", source: "tcgplayer", checkedAt: "2026-07-22T12:00:00.000Z", marketPrice: 94 },
    { id: "market-position-plan", cardKey: "position-no-plan|nonfoil", source: "tcgplayer", checkedAt: "2026-07-22T12:00:00.000Z", marketPrice: 50 },
    { id: "market-entry-near", cardKey: "radar-approaching|nonfoil", source: "tcgplayer", checkedAt: "2026-07-22T12:00:00.000Z", marketPrice: 10.5 },
    { id: "market-entry-outside", cardKey: "radar-outside|nonfoil", source: "tcgplayer", checkedAt: "2026-07-22T12:00:00.000Z", marketPrice: 10.51 },
    { id: "market-radar-plan", cardKey: "radar-no-plan|nonfoil", source: "tcgplayer", checkedAt: "2026-07-22T12:00:00.000Z", marketPrice: 8 },
    { id: "market-stale", cardKey: "radar-stale|nonfoil", source: "tcgplayer", checkedAt: "2026-06-23T12:00:00.000Z", marketPrice: 20 },
    { id: "market-fresh", cardKey: "radar-fresh|nonfoil", source: "tcgplayer", checkedAt: "2026-07-16T12:00:00.000Z", marketPrice: 20 },
  ],
};
