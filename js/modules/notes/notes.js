/*
====================================
SHARED CARD NOTES
====================================

Append-first notes keyed by exact tracked printing identity.
Radar and Positions can stay separate row stores while notes remain shared.
====================================
*/

function addCardNote(item, text) {
  const noteText = String(text || "").trim();
  const cardKey = getTrackedPrintingKey(item);
  if (!noteText || !cardKey) return null;

  const now = new Date().toISOString();
  const note = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    cardKey,
    cardId: item.id || "",
    scryfall_id: item.scryfall_id || String(item.id || "").replace(/\|(foil|nonfoil)$/i, ""),
    finish: item.foil ? "foil" : "nonfoil",
    cardName: item.name || "",
    set_code: item.set_code || item.set?.toUpperCase() || "",
    set_name: item.set_name || "",
    collector_number: item.collector_number || "",
    text: noteText,
    createdAt: now,
    updatedAt: now,
  };

  cardNotes.unshift(note);
  saveCardNotesState(cardNotes);
  return note;
}

function getCardNotesForItem(item) {
  const cardKey = getTrackedPrintingKey(item);
  if (!cardKey) return [];

  return cardNotes
    .filter(note => note.cardKey === cardKey)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getCardNotesForKey(cardKey) {
  if (!cardKey) return [];

  return cardNotes
    .filter(note => note.cardKey === cardKey)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getTrackedNoteCount(item) {
  return getCardNotesForItem(item).length;
}

function getMostRecentCardNote(item) {
  return getCardNotesForItem(item)[0] || null;
}

function findTrackedCardByNote(note) {
  if (!note) return null;

  const byKey = item => getTrackedPrintingKey(item) === note.cardKey;
  return specs.find(byKey)
    || radar.find(byKey)
    || specs.find(item => item.id === note.cardId)
    || radar.find(item => item.id === note.cardId)
    || null;
}

function renderNotesTableControl(item, index) {
  const notes = getCardNotesForItem(item);
  const latest = notes[0];
  const label = notes.length ? `${notes.length}n` : "+note";
  const title = latest
    ? `${latest.text}\n${new Date(latest.createdAt).toLocaleDateString()}`
    : "No notes yet";
  const stateClass = notes.length ? "note-control--has-notes" : "note-control--empty";

  return `
    <button type="button" class="note-control ${stateClass}" data-ms-action="notes" data-ms-row="${msEscapeAttr(index)}" title="${msEscapeAttr(title)}">
      ${msEscapeHtml(label)}
    </button>
  `;
}

function getCardNotePreview(note) {
  if (!note) return "";
  const text = String(note.text || "").trim();
  return text.length > 96 ? `${text.slice(0, 93)}...` : text;
}
