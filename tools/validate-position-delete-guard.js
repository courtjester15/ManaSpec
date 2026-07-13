const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const position = {
  id: "printing-a",
  scryfall_id: "printing-a",
  name: "Synthetic Position",
  foil: false,
  qty: 1,
  buyPrice: 5,
};
let confirmCalls = 0;
let notices = [];
const context = vm.createContext({
  console,
  document: { querySelector() { return null; } },
  globalThis: null,
  specs: [position],
  transactions: [{
    id: "buy-a",
    cardId: "printing-a",
    name: position.name,
    foil: false,
    type: "BUY",
    quantity: 1,
    price: 5,
    fees: 0,
    date: "2026-01-01T00:00:00.000Z",
  }],
  getSpec(value) { return value; },
  confirm() { confirmCalls += 1; return true; },
  showAppNotice(message, tone) { notices.push({ message, tone }); },
  save() {},
  refreshPositionsWorkflowAfterTrade() {},
  startingCash: 10000,
  cash: 10000,
});
context.globalThis = context;

function run(relativePath) {
  const filename = path.resolve(__dirname, "..", relativePath);
  vm.runInContext(fs.readFileSync(filename, "utf8"), context, { filename });
}

run("js/core/data-foundation.js");
run("js/modules/portfolio/trading.js");

context.deleteSpec(position);
assert.equal(context.specs.length, 1, "Open transaction history must block Position deletion");
assert.equal(confirmCalls, 0, "Unsafe deletion must stop before confirmation");
assert(notices.some(notice => notice.message.includes("transaction history still projects an open holding")));

context.transactions = [];
context.deleteSpec(position);
assert.equal(context.specs.length, 0, "A Position with no open transaction projection may use the correction-only delete path");
assert.equal(confirmCalls, 1);

process.stdout.write(`${JSON.stringify({ status: "passed", openProjectionBlocked: true, noHistoryCorrectionPreserved: true }, null, 2)}\n`);
