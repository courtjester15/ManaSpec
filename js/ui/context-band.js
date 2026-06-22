/*
====================================
MODULE CONTEXT BAND
====================================

Shared scaffold for local module context tiles above workflow tables.
====================================
*/

function renderModuleContextBand(tiles = [], options = {}) {
  const classes = ["module-context-band", options.className].filter(Boolean).join(" ");

  return `
    <section class="${classes}" aria-label="${msEscapeAttr(options.label || "Module context")}">
      ${tiles.map(renderModuleContextTile).join("")}
    </section>
  `;
}

function renderModuleContextTile(tile = {}) {
  const classes = [
    "module-context-card",
    tile.wide ? "module-context-card--wide" : "",
    tile.search ? "module-context-card--search" : "",
    tile.active ? "active" : "",
  ].filter(Boolean).join(" ");
  const attrs = tile.action ? ` data-context-action="${msEscapeAttr(tile.action)}"` : "";
  const tag = tile.action ? "button" : "article";
  const type = tile.action ? ' type="button"' : "";

  return `
    <${tag}${type} class="${classes}"${attrs}>
      ${tile.html || `
        <span>${msEscapeHtml(tile.label || "")}</span>
        <strong>${msEscapeHtml(tile.value ?? "-")}</strong>
        <small>${msEscapeHtml(tile.detail || "")}</small>
        <em>${msEscapeHtml(tile.preview || "")}</em>
      `}
    </${tag}>
  `;
}
