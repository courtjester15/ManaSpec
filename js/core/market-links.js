/* Pure helpers for outbound marketplace links. */
(function expose(root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) {
    root.ManaSpecMarketLinks = api;
    root.getFinishAwareTcgplayerUrl = api.getFinishAwareTcgplayerUrl;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createMarketLinks() {
  const TCGPLAYER_PRINTINGS = Object.freeze({
    nonfoil: "Normal",
    foil: "Foil",
  });

  function isTcgplayerHost(hostname) {
    const normalized = String(hostname || "").toLowerCase();
    return normalized === "tcgplayer.com" || normalized.endsWith(".tcgplayer.com");
  }

  function addTcgplayerPrinting(url, printing) {
    if (!isTcgplayerHost(url.hostname)) return false;
    url.searchParams.set("Printing", printing);
    return true;
  }

  function getFinishAwareTcgplayerUrl(rawUrl, finish, availableFinishes) {
    if (typeof rawUrl !== "string" || !rawUrl) return rawUrl;

    const normalizedFinish = String(finish || "").toLowerCase();
    const printing = TCGPLAYER_PRINTINGS[normalizedFinish];
    if (!printing) return rawUrl;

    if (!Array.isArray(availableFinishes) || !availableFinishes.includes(normalizedFinish)) {
      return rawUrl;
    }

    try {
      const outerUrl = new URL(rawUrl);
      if (!isTcgplayerHost(outerUrl.hostname)) return rawUrl;

      if (outerUrl.hostname.toLowerCase() === "partner.tcgplayer.com") {
        const destination = outerUrl.searchParams.get("u");
        if (!destination) return rawUrl;

        const destinationUrl = new URL(destination);
        if (!addTcgplayerPrinting(destinationUrl, printing)) return rawUrl;
        outerUrl.searchParams.set("u", destinationUrl.toString());
        return outerUrl.toString();
      }

      addTcgplayerPrinting(outerUrl, printing);
      return outerUrl.toString();
    } catch (error) {
      return rawUrl;
    }
  }

  return Object.freeze({ getFinishAwareTcgplayerUrl });
});
