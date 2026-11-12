const identity = ["name", "set_code", "collector_number"];
const groups = {
  radar: {
    essentials: [...identity, "currentPrice", "entryTarget", "plannedQty", "tcg", "notes", "actions"],
    plan: [...identity, "currentPrice", "entryTarget", "exitTarget", "distance", "plannedQty", "notes", "actions"],
    research: [...identity, "rarity", "color", "currentPrice", "sellers", "marketQty", "tcg", "history", "actions"],
  },
  positions: {
    essentials: [...identity, "quantity", "averageBuyPrice", "currentPrice", "pl", "exitTarget", "actions"],
    plan: [...identity, "quantity", "currentPrice", "exitTarget", "distance", "holdTime", "age", "notes", "actions"],
    research: [...identity, "quantity", "averageBuyPrice", "value", "pl", "plPct", "added", "history", "actions"],
  },
};

export function workflowColumns(columns, route, view = "essentials") {
  const keys = groups[route]?.[view];
  if (!keys) return columns;
  return columns.filter(column => keys.includes(column.key)).map(column => {
    if (column.align === "money") return { ...column, width: Math.max(column.width || 0, 82) };
    return column;
  });
}
