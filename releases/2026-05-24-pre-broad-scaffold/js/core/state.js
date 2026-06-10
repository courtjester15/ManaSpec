/*
====================================
STATE SYSTEM
====================================

Holds global application state:
- specs (portfolio positions)
- cash balance
- future shared runtime state
====================================
*/

// Portfolio holdings
let specs = loadSpecs();

// Radar ideas
let radar = loadRadar();

const migratedRadarItems = specs
  .filter(s => Number(s.qty || 0) === 0)
  .map(specToRadarItem);

if (migratedRadarItems.length) {
  radar = mergeRadarItems(radar, migratedRadarItems);
  specs = specs.filter(s => Number(s.qty || 0) > 0);

  localStorage.setItem("radar", JSON.stringify(radar));
  localStorage.setItem("specs", JSON.stringify(specs));
}

// Cash balance
const startingCash = 10000;
let cash = loadCash(startingCash);

function specToRadarItem(spec) {
  return {
    id: spec.id,
    name: spec.name,
    set_code: spec.set_code,
    set_name: spec.set_name,
    collector_number: spec.collector_number,
    foil: spec.foil || false,
    currentPrice: Number(spec.currentPrice || 0),
    addedDate: spec.addedDate || spec.buyDate || new Date().toISOString(),
  };
}

function mergeRadarItems(existing, incoming) {
  const seen = new Set(existing.map(item => item.id));
  const merged = [...existing];

  incoming.forEach(item => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    merged.push(item);
  });

  return merged;
}
