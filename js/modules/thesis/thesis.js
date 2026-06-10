/*
====================================
THESIS MODULE
====================================

Decision memory for why a spec is being watched or held.
====================================
*/

function renderThesisView() {
  document.getElementById("viewContainer").innerHTML = `
    <section class="module-view">
      <div class="view-heading">
        <h3>Thesis</h3>
        <p>Reasoning, catalysts, conviction, and exit thoughts.</p>
      </div>

      <form class="module-form thesis-form" id="thesisForm">
        <input id="thesisCardName" placeholder="Card / spec name">
        <select id="thesisConviction">
          <option value="Low">Low conviction</option>
          <option value="Medium">Medium conviction</option>
          <option value="High">High conviction</option>
        </select>
        <textarea id="thesisText" placeholder="Why this matters, what could move it, and what would change your mind"></textarea>
        <button type="submit">Add Thesis</button>
      </form>

      <div class="module-list" id="thesisList"></div>
    </section>
  `;

  document.getElementById("thesisForm").onsubmit = addThesisFromForm;
  renderThesisList();
}

function addThesisFromForm(event) {
  event.preventDefault();

  const cardName = document.getElementById("thesisCardName").value.trim();
  const conviction = document.getElementById("thesisConviction").value;
  const thesis = document.getElementById("thesisText").value.trim();

  if (!thesis) return;

  addThesisNote({
    cardName,
    conviction,
    thesis,
  });

  renderThesisView();
}

function addThesisNote(note) {
  thesisNotes.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    cardId: note.cardId || "",
    cardName: note.cardName || "",
    set_code: note.set_code || "",
    set_name: note.set_name || "",
    collector_number: note.collector_number || "",
    conviction: note.conviction || "Medium",
    thesis: note.thesis || "",
    createdAt: new Date().toISOString(),
  });

  saveThesisState(thesisNotes);
}

function getThesisNotesForCard(cardId) {
  return thesisNotes
    .filter(note => note.cardId === cardId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function renderThesisList() {
  const container = document.getElementById("thesisList");
  if (!container) return;

  if (!thesisNotes.length) {
    container.innerHTML = `<div class="empty-state">No thesis notes yet. Use this space for decision memory.</div>`;
    return;
  }

  container.innerHTML = thesisNotes.map(note => `
    <article class="note-card">
      <header>
        <strong>${note.cardName || "General thesis"}</strong>
        <span>${formatThesisMeta(note)}</span>
      </header>
      <p>${note.thesis}</p>
      ${note.cardId ? `<button type="button" class="note-link-btn" data-thesis-card="${note.cardId}">Open Card</button>` : ""}
    </article>
  `).join("");

  container.querySelectorAll("[data-thesis-card]").forEach(button => {
    button.addEventListener("click", () => {
      const cardId = button.dataset.thesisCard;
      const source = specs.some(spec => spec.id === cardId) ? "portfolio" : "radar";
      if (!findTrackedCard(cardId)) {
        if (typeof showAppNotice === "function") {
          showAppNotice("This thesis is linked to a card that is no longer tracked.", "warning");
        }
        return;
      }
      openCardDetail(cardId, source);
    });
  });
}

function formatThesisMeta(note) {
  const identity = [note.set_code, note.collector_number ? `#${note.collector_number}` : ""]
    .filter(Boolean)
    .join(" ");

  return [note.conviction, identity].filter(Boolean).join(" / ");
}
