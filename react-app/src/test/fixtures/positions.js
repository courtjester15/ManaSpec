const validPosition = Object.freeze({
  id: "valid-printing|nonfoil",
  scryfall_id: "valid-printing",
  trackedPrintingKey: "valid-printing|nonfoil",
  finish: "nonfoil",
  foil: false,
  name: "Valid Position",
  set_code: "TST",
  set_name: "Test Set",
  collector_number: "1",
  qty: 2,
  buyPrice: 5,
  buyDate: "2026-01-15T12:00:00.000Z",
  addedDate: "2025-12-01T12:00:00.000Z",
  currentPrice: 8,
  exitTarget: 10,
  holdTime: "6-12",
  futureField: { preserve: true },
});

function position(overrides = {}) {
  return { ...validPosition, ...overrides };
}

export const positionFixtures = Object.freeze({
  valid: position(),
  missingQuantity: position({ id: "missing-qty|nonfoil", scryfall_id: "missing-qty", trackedPrintingKey: "missing-qty|nonfoil", qty: null }),
  zeroQuantity: position({ id: "zero-qty|nonfoil", scryfall_id: "zero-qty", trackedPrintingKey: "zero-qty|nonfoil", qty: 0 }),
  invalidQuantity: position({ id: "invalid-qty|nonfoil", scryfall_id: "invalid-qty", trackedPrintingKey: "invalid-qty|nonfoil", qty: "not-a-number" }),
  missingBuyPrice: position({ id: "missing-buy|nonfoil", scryfall_id: "missing-buy", trackedPrintingKey: "missing-buy|nonfoil", buyPrice: null }),
  zeroBuyPrice: position({ id: "zero-buy|nonfoil", scryfall_id: "zero-buy", trackedPrintingKey: "zero-buy|nonfoil", buyPrice: 0 }),
  invalidBuyPrice: position({ id: "invalid-buy|nonfoil", scryfall_id: "invalid-buy", trackedPrintingKey: "invalid-buy|nonfoil", buyPrice: "not-a-number" }),
  missingBuyDate: position({ id: "missing-date|nonfoil", scryfall_id: "missing-date", trackedPrintingKey: "missing-date|nonfoil", buyDate: null }),
  invalidBuyDate: position({ id: "invalid-date|nonfoil", scryfall_id: "invalid-date", trackedPrintingKey: "invalid-date|nonfoil", buyDate: "not-a-date" }),
  invalidIdentity: position({ id: "invalid-identity", scryfall_id: null, trackedPrintingKey: null }),
  missingCurrentPrice: position({ id: "missing-current|nonfoil", scryfall_id: "missing-current", trackedPrintingKey: "missing-current|nonfoil", currentPrice: null }),
});
