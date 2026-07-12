/*
====================================
HELP DRAWER
====================================

Contextual workflow help for ManaSpec.
====================================
*/

const helpTopics = {
  dashboard: {
    title: "Dashboard",
    intro: "Use Dashboard to decide what to inspect first today.",
    steps: [
      "Start with hit and near-target tiles when you want the most urgent price checks.",
      "Use market check, hold review, and missing plan tiles to clean up cards that need attention.",
      "Open a row to review the tracked printing in Card Detail.",
    ],
  },
  radar: {
    label: "Radar",
    title: "Radar Search And Ideas",
    intro: "Radar is for cards you are watching before committing cash.",
    steps: [
      "Search by card name to discover printings. Name search tolerates partial words and likely misspellings.",
      "Radar search is paper-only until Digital/MTGO results can ship with supported pricing.",
      "Use Set # search for exact printings, such as FIN 123, FIN #123, FIN123, or MH3 123.",
      "Use the nonfoil or foil Add button on a printing to add it to Radar. Printing names open art previews.",
      "Click outside the search area or open Card Detail to collapse active search and printing results.",
      "Set Entry and Want when you know your target buy price and planned quantity.",
      "Scryfall is the saved/refreshed app price; TCG Check is your latest manually saved TCGplayer Price Points observation.",
      "Buying from Radar creates or updates a Position while keeping the card watched.",
      "Leave targets blank when you are only watching what a card does.",
    ],
  },
  portfolio: {
    label: "Positions",
    title: "Positions",
    intro: "Positions is for owned cards and compact trade management.",
    steps: [
      "Use Buy to add copies and record the quantity and purchase price.",
      "Now is the saved/refreshed Scryfall price used for current value and target math.",
      "Use Sell to choose one copy, all copies, or a custom quantity before confirming the exit.",
      "Edit Target and Hold inline when you have a plan.",
      "Card Detail plan fields also save on Enter or click-away.",
      "Delete removes the position without logging a transaction, so use it only for corrections.",
    ],
  },
  signals: {
    title: "Signals",
    intro: "Signals turns local plan, price, hold, and market-check state into an attention list.",
    steps: [
      "Exit Hits are owned positions at or above the exit target.",
      "Entry Hits are Radar ideas at or below the entry target.",
      "Approaching shows true near-target cards first, then the closest target-watch cards so the tile stays useful.",
      "Click a tile header or background to filter the table by that bucket.",
      "Click a queue row or card title to filter the table to that exact tracked printing.",
      "No Plan uses ownership rules: Radar needs Entry, while Positions need Exit and Hold.",
      "Use Detail to review the card, or View to filter Radar/Positions to the exact source row.",
    ],
  },
  tcgPaste: {
    label: "Market Check",
    title: "Market Check",
    intro: "Use the card detail Market Check area to save visible TCGplayer price-point text and power market evaluation.",
    steps: [
      "Open card detail from Radar, Positions, or Signals.",
      "Use the detail sections in order: printing context, Plan, Market Check, Market Evaluation, Notes, and reference text.",
      "Plan fields save on Enter or click-away, so the visible plan is the current saved plan.",
      "Open the TCGplayer link and find the Price Points block.",
      "Copy the visible text that includes Market Price, Recent Sale, Listed Median, Quantity, and Sellers.",
      "Use the ? How to use Market Check guide in Card Detail for visual examples.",
      "Paste it into the TCG Price Points box and save the check.",
      "Saved TCG checks are manual observations with timestamps, not a live TCGplayer price feed.",
      "ManaSpec evaluates only observable market mechanics: supply, velocity, price confidence, Scryfall EDH rank, target math, freshness, and data gaps.",
    ],
  },
  transactions: {
    title: "Transactions",
    intro: "Transactions are the audit trail for buy and sell activity.",
    steps: [
      "Buy and sell actions add ledger records automatically.",
      "Use filters to review specific cards, sets, or BUY/SELL events.",
      "Signed totals show cash direction: buys are negative, sells are positive.",
      "Balance shows cash after each event, and SELL rows show realized gain/loss when cost basis is available.",
    ],
  },
  history: {
    title: "History",
    intro: "History is the wider activity feed across the app.",
    steps: [
      "Review buys, sells, Radar additions, and notes.",
      "Filter by event type when you only want transactions, Radar, or Notes.",
      "Transaction history details include balance context and SELL realized gain/loss when available.",
      "History keeps context even after a position closes.",
    ],
  },
  admin: {
    title: "Admin",
    intro: "Admin is for local maintenance and safety tools.",
    steps: [
      "Use admin actions carefully because localStorage is the current backing store.",
      "Reset Cash requires confirmation and changes only available cash, not Positions, Radar, notes, transactions, or history.",
      "Export a backup before risky maintenance or restore work.",
    ],
  },
};

// Tutorial entries can later supply: title, description, image, steps, and action.
// Keeping them here lets global and module-level Help open the same shared content.
const helpTutorials = {
  dashboard: [], radar: [], portfolio: [], signals: [], tcgPaste: [],
  transactions: [], history: [], admin: [],
};

let activeHelpTopic = "dashboard";

function initHelp() {
  ensureHelpDrawer();

  const openButton = document.getElementById("openHelpDrawer");
  if (openButton) {
    openButton.addEventListener("click", () => openHelpDrawer(activeHelpTopic));
  }
}

function setHelpContext(topicId) {
  activeHelpTopic = helpTopics[topicId] ? topicId : "dashboard";

  const drawer = document.getElementById("helpDrawer");
  if (drawer?.classList.contains("open")) {
    renderHelpTopic(activeHelpTopic);
  }
}

function ensureHelpDrawer() {
  if (document.getElementById("helpDrawer")) return;

  const drawer = document.createElement("aside");
  drawer.id = "helpDrawer";
  drawer.className = "help-drawer";
  drawer.innerHTML = `
    <div class="help-backdrop" data-help-close></div>
    <section class="help-panel" aria-label="ManaSpec help">
      <header class="help-header">
        <div>
          <h3>Help</h3>
          <span>Workflow notes and examples</span>
        </div>
        <button type="button" class="help-close-btn" data-help-close>Close</button>
      </header>
      <nav class="help-topic-list" id="helpTopicList"></nav>
      <div class="help-topic-body" id="helpTopicBody"></div>
    </section>
  `;

  document.body.appendChild(drawer);

  drawer.querySelectorAll("[data-help-close]").forEach(button => {
    button.addEventListener("click", closeHelpDrawer);
  });
}

function openHelpDrawer(topicId = activeHelpTopic) {
  ensureHelpDrawer();
  renderHelpTopic(topicId);
  document.getElementById("helpDrawer").classList.add("open");
}

function closeHelpDrawer() {
  document.getElementById("helpDrawer")?.classList.remove("open");
}

function renderHelpTopic(topicId) {
  const topic = helpTopics[topicId] || helpTopics.dashboard;
  activeHelpTopic = topicId;

  document.getElementById("helpTopicList").innerHTML = Object.entries(helpTopics)
    .map(([id, item]) => `
      <button type="button" class="${id === activeHelpTopic ? "active" : ""}" data-help-topic="${id}">
        ${item.label || item.title}
      </button>
    `).join("");

  document.querySelectorAll("[data-help-topic]").forEach(button => {
    button.addEventListener("click", () => renderHelpTopic(button.dataset.helpTopic));
  });

  document.getElementById("helpTopicBody").innerHTML = `
    <h4>${topic.title}</h4>
    <p>${topic.intro}</p>
    <ol>
      ${topic.steps.map(step => `<li>${step}</li>`).join("")}
    </ol>
    ${renderHelpTutorials(topicId)}
  `;
}

function renderHelpTutorials(topicId) {
  const tutorials = helpTutorials[topicId] || [];
  return `
    <section class="help-tutorials" aria-labelledby="helpTutorialsTitle">
      <h5 id="helpTutorialsTitle">Tutorials</h5>
      ${tutorials.length
        ? tutorials.map(renderHelpTutorialEntry).join("")
        : `<p class="help-tutorials-placeholder">Visual walkthroughs coming soon</p>`}
    </section>
  `;
}

function renderHelpTutorialEntry(tutorial) {
  return `
    <article class="help-tutorial-entry">
      <h6>${tutorial.title}</h6>
      ${tutorial.description ? `<p>${tutorial.description}</p>` : ""}
      ${tutorial.image ? `<img src="${tutorial.image}" alt="">` : ""}
      ${tutorial.steps?.length ? `<ol>${tutorial.steps.map(step => `<li>${step}</li>`).join("")}</ol>` : ""}
      ${tutorial.action ? `<a href="${tutorial.action.href}">${tutorial.action.label}</a>` : ""}
    </article>
  `;
}
