/* A guarded archive may read a v1 singles store, but must never start the
 * vanilla writer over React-only trade data or an interrupted React commit. */
(function () {
  const keys = ["specs", "radar", "transactions", "cardNotes", "thesisNotes", "signals", "priceSnapshots", "marketObservations", "sealedSpecs", "sealedRadar", "sealedTransactions", "cash", "priceRefreshStatus", "manaspec_pending_commit_v1", "manaspec_pre_import_backup"];
  let raw = {};
  let reason = "";
  try {
    raw = Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)]));
    if (raw.manaspec_pending_commit_v1 !== null) reason = "A React save needs recovery in the vetted React build.";
    for (const key of keys.slice(0, 11)) {
      if (raw[key] === null) continue;
      const records = JSON.parse(raw[key]);
      if (!Array.isArray(records)) throw new Error("Invalid saved list");
      if (key === "transactions" && records.some(record => record?.trade?.version === 1 || record?.type === "REVERSAL")) {
        reason = "This store includes true-cost trades. Vanilla cannot represent itemized cash flows, cent allocations, or reversals.";
      }
      if ((key.startsWith("sealed") && records.length) || records.some(record => record.assetType === "sealed" || String(record.assetKey || "").startsWith("sealed:"))) {
        reason = "This store includes sealed product data. Vanilla cannot represent its holdings, history or full account totals.";
      }
    }
    if (raw.cash !== null && (!raw.cash.trim() || !Number.isFinite(Number(raw.cash)))) throw new Error("Invalid cash");
  } catch {
    reason = "Saved storage is unavailable or invalid. Preserve it before troubleshooting.";
  }
  window.manaspecVanillaSafe = !reason;
  if (!reason) return;
  document.addEventListener("DOMContentLoaded", function () {
    document.body.replaceChildren();
    const main = document.createElement("main");
    main.style.cssText = "max-width:760px;margin:48px auto;padding:24px;font:16px/1.5 system-ui;color:#eef;background:#152032";
    const title = document.createElement("h1");
    title.textContent = "Vanilla rollback paused to protect your data";
    const detail = document.createElement("p");
    detail.textContent = reason + " No ManaSpec application script was started and no saved key was changed. Return to the vetted React release; do not clear storage or import a pre-promotion backup over newer activity.";
    const button = document.createElement("button");
    button.textContent = "Download private recovery copy";
    button.onclick = function () {
      const url = URL.createObjectURL(new Blob([JSON.stringify({ app: "ManaSpec", schema: "manaspec-raw-recovery", exportedAt: new Date().toISOString(), raw }, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "manaspec-rollback-recovery.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    main.append(title, detail, button);
    document.body.append(main);
  });
})();
