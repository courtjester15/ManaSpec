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
    intro: "Use Dashboard as the fast scan view for what needs attention.",
    steps: [
      "Check top gainers and losers before drilling into a card.",
      "Use target panels to spot positions near or past planned exits.",
      "Treat empty panels as setup prompts, not errors.",
    ],
  },
  radar: {
    title: "Radar Search And Ideas",
    intro: "Radar is for cards you are watching before committing cash.",
    steps: [
      "Search by card name to discover printings. Name search tolerates partial words and likely misspellings.",
      "Paper results are shown by default. Turn on Digital only when you want MTGO or Arena printings.",
      "Use Set # search for exact printings, such as FIN 123, FIN #123, FIN123, or MH3 123.",
      "Use the nonfoil or foil Add button on a printing to add it to Radar. Printing names open art previews.",
      "Set Entry and Want when you know your target buy price and planned quantity.",
      "Buying from Radar creates or updates a Position while keeping the card watched.",
      "Leave targets blank when you are only watching what a card does.",
    ],
  },
  portfolio: {
    title: "Positions",
    intro: "Positions is for owned cards and compact trade management.",
    steps: [
      "Use +1 to buy one more copy at the current price.",
      "Use Sell to choose one copy, all copies, or a custom quantity before confirming the exit.",
      "Edit Target and Hold inline when you have a plan.",
      "Delete removes the position without logging a transaction, so use it only for corrections.",
    ],
  },
  signals: {
    title: "Signals",
    intro: "Signals turns local targets into an attention list.",
    steps: [
      "Exit Hits are owned positions at or above the exit target.",
      "Entry Hits are Radar ideas at or below the entry target.",
      "Approaching means the current price is close to a target or the hold is nearly due.",
      "Use No Plan rows to find cards that need planning, then open Detail or jump to the source workflow.",
      "Use Detail to review the card, or View to filter Radar/Positions to the exact source row.",
    ],
  },
  tcgPaste: {
    title: "TCG Price Points",
    intro: "Use the card detail Market Check area to save visible TCGplayer price-point text and power market evaluation.",
    steps: [
      "Open card detail from Radar, Positions, or Signals.",
      "Use the detail sections in order: Overview, Plan, Notes, Market Evaluation, Market Check, Oracle, and Card Data.",
      "Open the TCGplayer link and find the Price Points block.",
      "Copy the visible text that includes Market Price, Recent Sale, Listed Median, Quantity, and Sellers.",
      "Screenshot guidance is deferred until the Market Check surface stabilizes.",
      "Paste it into the TCG Price Points box and save the check.",
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
      "Long term, Positions should be computed from these events.",
    ],
  },
  history: {
    title: "History",
    intro: "History is the wider activity feed across the app.",
    steps: [
      "Review buys, sells, Radar additions, and notes.",
      "Filter by event type when you only want transactions, Radar, or Notes.",
      "History keeps context even after a position closes.",
    ],
  },
  admin: {
    title: "Admin",
    intro: "Admin is for local maintenance and safety tools.",
    steps: [
      "Use admin actions carefully because localStorage is the current backing store.",
      "Future backup/export tools should live here.",
      "Storage upgrades should wait until the workflow shape is clearer.",
    ],
  },
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
        ${item.title}
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
  `;
}
