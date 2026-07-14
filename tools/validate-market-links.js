const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const { getFinishAwareTcgplayerUrl } = require("../js/core/market-links.js");

const direct = "https://www.tcgplayer.com/product/541296?page=1";
assert.strictEqual(
  getFinishAwareTcgplayerUrl(direct, "foil", ["nonfoil", "foil"]),
  "https://www.tcgplayer.com/product/541296?page=1&Printing=Foil"
);
assert.strictEqual(
  getFinishAwareTcgplayerUrl(`${direct}&Printing=Foil`, "nonfoil", ["nonfoil", "foil"]),
  "https://www.tcgplayer.com/product/541296?page=1&Printing=Normal",
  "an existing finish filter should be replaced instead of duplicated"
);

const affiliate = "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&u=https%3A%2F%2Fwww.tcgplayer.com%2Fproduct%2F541296%3Fpage%3D1";
const affiliateResult = new URL(getFinishAwareTcgplayerUrl(affiliate, "foil", ["nonfoil", "foil"]));
assert.strictEqual(affiliateResult.hostname, "partner.tcgplayer.com", "Scryfall affiliate attribution should be preserved");
assert.strictEqual(affiliateResult.searchParams.get("subId1"), "api");
assert.strictEqual(
  affiliateResult.searchParams.get("u"),
  "https://www.tcgplayer.com/product/541296?page=1&Printing=Foil",
  "the finish belongs on the nested TCGplayer destination"
);

const searchAffiliate = "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&u=https%3A%2F%2Fwww.tcgplayer.com%2Fsearch%2Fmagic%2Fproduct%3FproductLineName%3Dmagic%26q%3DExample%26view%3Dgrid";
const searchDestination = new URL(getFinishAwareTcgplayerUrl(searchAffiliate, "nonfoil", ["nonfoil"])).searchParams.get("u");
assert.strictEqual(new URL(searchDestination).searchParams.get("Printing"), "Normal");

const etched = "https://www.tcgplayer.com/search/magic/product?q=Etched+Card";
assert.strictEqual(getFinishAwareTcgplayerUrl(etched, "etched", ["etched"]), etched, "etched must gracefully fall back");
assert.strictEqual(getFinishAwareTcgplayerUrl(direct, "foil", ["nonfoil"]), direct, "unavailable finishes must not be forced");
assert.strictEqual(getFinishAwareTcgplayerUrl(direct, "foil"), direct, "missing availability data must not be guessed");
assert.strictEqual(getFinishAwareTcgplayerUrl("not a url", "foil", ["foil"]), "not a url");
assert.strictEqual(getFinishAwareTcgplayerUrl("https://example.com/product/541296", "foil", ["foil"]), "https://example.com/product/541296");

const cardDetailContext = {
  getFinishAwareTcgplayerUrl,
  ManaSpecDataFoundation: { normalizeFinish: item => item.finish || (item.foil ? "foil" : "nonfoil") },
};
vm.createContext(cardDetailContext);
vm.runInContext(fs.readFileSync("js/modules/card-details/card-details.js", "utf8"), cardDetailContext);
const marketLinks = cardDetailContext.getMarketLinks(
  { finishes: ["nonfoil", "foil"], purchase_uris: { tcgplayer: affiliate } },
  { name: "Bloodstained Mire", finish: "foil", foil: true }
);
const marketDestination = new URL(marketLinks.find(link => link.label === "Open TCG").href).searchParams.get("u");
assert.strictEqual(new URL(marketDestination).searchParams.get("Printing"), "Foil", "Card Detail should use the shared helper");

console.log("Market link validation passed.");
