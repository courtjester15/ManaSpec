/*
====================================
CARD FILTERS
====================================

Shared local filters for Radar ideas and owned Positions.
====================================
*/

function renderCardFilterControls(idPrefix, title, options = {}) {
  return `
    <section class="card-filter-panel">
      <div class="panel-heading compact-heading">
        <h4>${title}</h4>
        ${options.metaId ? `<span class="filter-meta" id="${options.metaId}"></span>` : ""}
      </div>

      <div class="card-filter-controls" data-filter-prefix="${idPrefix}">
        <label class="filter-control">
          <span>Search</span>
          <input id="${idPrefix}FilterText" placeholder="Name, set, type">
        </label>
        <label class="filter-control">
          <span>Rarity</span>
          <select id="${idPrefix}FilterRarity" aria-label="Rarity">
            <option value="">Rarity</option>
            <option value="mythic">Mythic</option>
            <option value="rare">Rare</option>
            <option value="uncommon">Uncommon</option>
            <option value="common">Common</option>
          </select>
        </label>
        <label class="filter-control">
          <span>Type</span>
          <select id="${idPrefix}FilterType" aria-label="Type">
            <option value="">Type</option>
            <option value="Creature">Creature</option>
            <option value="Planeswalker">Planeswalker</option>
            <option value="Instant">Instant</option>
            <option value="Sorcery">Sorcery</option>
            <option value="Artifact">Artifact</option>
            <option value="Enchantment">Enchantment</option>
            <option value="Land">Land</option>
            <option value="Battle">Battle</option>
          </select>
        </label>
        <label class="filter-control">
          <span>Color</span>
          <select id="${idPrefix}FilterColor" aria-label="Color">
            <option value="">Color</option>
            <option value="C">Colorless</option>
            <option value="W">White</option>
            <option value="U">Blue</option>
            <option value="B">Black</option>
            <option value="R">Red</option>
            <option value="G">Green</option>
            <option value="M">Multicolor</option>
          </select>
        </label>
        <label class="filter-control">
          <span>Min $</span>
          <input id="${idPrefix}FilterMinPrice" class="money-input" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="Min $">
        </label>
        <label class="filter-control">
          <span>Max $</span>
          <input id="${idPrefix}FilterMaxPrice" class="money-input" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="Max $">
        </label>
        <label class="inline-check">
          <input id="${idPrefix}FilterReserved" type="checkbox">
          Reserved
        </label>
        <label class="filter-control">
          <span>Print</span>
          <select id="${idPrefix}FilterReprint" aria-label="Reprint">
            <option value="">Print</option>
            <option value="new">First</option>
            <option value="reprint">Reprint</option>
          </select>
        </label>
        <label class="filter-control">
          <span>Plan</span>
          <select id="${idPrefix}FilterPlan" aria-label="Plan">
            <option value="">Plan</option>
            <option value="planned">Has plan</option>
            <option value="unplanned">No plan</option>
            <option value="entryHit">Entry hit</option>
            <option value="exitHit">Exit hit</option>
            <option value="approaching">Approaching</option>
          </select>
        </label>
        ${renderTablePageSizeControl(idPrefix)}
        <button type="button" class="filter-reset-btn" id="${idPrefix}FilterReset">Reset</button>
      </div>
    </section>
  `;
}

function initCardFilters(idPrefix, onChange) {
  const panel = document.querySelector(`[data-filter-prefix="${idPrefix}"]`);
  if (!panel) return;

  panel.querySelectorAll(".filter-control input, .filter-control select, .inline-check input").forEach(control => {
    control.addEventListener("input", onChange);
    control.addEventListener("change", onChange);
  });

  initTablePageSizeControl(idPrefix, onChange);

  const reset = document.getElementById(`${idPrefix}FilterReset`);
  if (reset) {
    reset.addEventListener("click", () => {
      resetCardFilters(idPrefix);
      onChange();
    });
  }
}

function resetCardFilters(idPrefix) {
  const panel = document.querySelector(`[data-filter-prefix="${idPrefix}"]`);
  if (!panel) return;

  panel.querySelectorAll(".filter-control input, .filter-control select, .inline-check input").forEach(control => {
    if (control.type === "checkbox") {
      control.checked = false;
      return;
    }

    control.value = "";
  });
}

function applyCardFilters(items, idPrefix) {
  const state = getCardFilterState(idPrefix);

  return items.filter(item => {
    const textHaystack = [
      item.name,
      item.set_code,
      item.set_name,
      item.type_line,
      item.oracle_text,
      item.artist,
    ].join(" ").toLowerCase();

    if (state.text && !textHaystack.includes(state.text)) return false;
    if (state.rarity && item.rarity !== state.rarity) return false;
    if (state.type && getPrimaryType(item) !== state.type) return false;
    if (state.color && !matchesColorFilter(item, state.color)) return false;
    if (state.minPrice && Number(item.currentPrice || 0) < state.minPrice) return false;
    if (state.maxPrice && Number(item.currentPrice || 0) > state.maxPrice) return false;
    if (state.reserved && !item.reserved) return false;
    if (state.reprint === "new" && item.reprint) return false;
    if (state.reprint === "reprint" && !item.reprint) return false;
    if (state.plan && !matchesPlanFilter(item, state.plan)) return false;

    return true;
  });
}

function getCardFilterState(idPrefix) {
  return {
    text: document.getElementById(`${idPrefix}FilterText`)?.value.trim().toLowerCase() || "",
    rarity: document.getElementById(`${idPrefix}FilterRarity`)?.value || "",
    type: document.getElementById(`${idPrefix}FilterType`)?.value || "",
    color: document.getElementById(`${idPrefix}FilterColor`)?.value || "",
    minPrice: Number(document.getElementById(`${idPrefix}FilterMinPrice`)?.value || 0),
    maxPrice: Number(document.getElementById(`${idPrefix}FilterMaxPrice`)?.value || 0),
    reserved: Boolean(document.getElementById(`${idPrefix}FilterReserved`)?.checked),
    reprint: document.getElementById(`${idPrefix}FilterReprint`)?.value || "",
    plan: document.getElementById(`${idPrefix}FilterPlan`)?.value || "",
  };
}

function matchesColorFilter(item, color) {
  const colors = item.color_identity || item.colors || [];

  if (color === "C") return colors.length === 0;
  if (color === "M") return colors.length > 1;
  return colors.includes(color);
}

function matchesPlanFilter(item, plan) {
  const hasPlan = Boolean(Number(item.entryTarget || 0) || Number(item.exitTarget || 0) || item.holdTime);
  const owned = Number(item.qty || 0) > 0;
  const state = typeof getTargetState === "function"
    ? getTargetState(item, owned).label
    : "";

  if (plan === "planned") return hasPlan;
  if (plan === "unplanned") return !hasPlan;
  if (plan === "entryHit") return state === "Entry hit";
  if (plan === "exitHit") return state === "Exit hit";
  if (plan === "approaching") return state === "Entry near" || state === "Exit near" || state === "Hold near" || state === "Hold due";
  return true;
}
