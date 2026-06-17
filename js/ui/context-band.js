/*
====================================
MODULE CONTEXT BAND
====================================

Shared scaffold for local module context above workflow tables.
====================================
*/

function renderModuleContextBand(cards = [], options = {}) {
  const classes = ["module-context-band", options.className].filter(Boolean).join(" ");

  return `
    <section class="${classes}" aria-label="${msEscapeAttr(options.label || "Module context")}">
      ${cards.map(renderModuleContextCard).join("")}
    </section>
  `;
}

function renderModuleContextCard(card = {}) {
  const classes = [
    "module-context-card",
    card.wide ? "module-context-card--wide" : "",
    card.search ? "module-context-card--search" : "",
    card.active ? "active" : "",
  ].filter(Boolean).join(" ");
  const attrs = card.action ? ` data-context-action="${msEscapeAttr(card.action)}"` : "";
  const tag = card.action ? "button" : "article";
  const type = card.action ? ' type="button"' : "";

  return `
    <${tag}${type} class="${classes}"${attrs}>
      ${card.html || `
        <span>${msEscapeHtml(card.label || "")}</span>
        <strong>${msEscapeHtml(card.value ?? "-")}</strong>
        <small>${msEscapeHtml(card.detail || "")}</small>
        <em>${msEscapeHtml(card.preview || "")}</em>
      `}
    </${tag}>
  `;
}

function getTrackedNoteCount(item) {
  if (!item || typeof getThesisNotesForCard !== "function") return 0;
  return getThesisNotesForCard(item.id).length;
}
