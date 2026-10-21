import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  assetContextLabel,
  getAssetKey,
  getAssetType,
  getExternalMarketUrl,
  getTrackedPrintingKey,
  normalizeSealedAsset,
  toTrackedSealedProduct,
} from "../domain/assetIdentity.js";
import { filterSealedProducts } from "../services/mtgjson.js";

const SEALED_UUID = "d575bd23-ebd6-586e-af7b-04924db4f1c3";

test("legacy exact printings infer single asset identity without stored migration fields", () => {
  const single = { id: "card-id|foil", scryfall_id: "card-id", foil: true };
  assert.equal(getAssetType(single), "single");
  assert.equal(getTrackedPrintingKey(single), "card-id|foil");
  assert.equal(getAssetKey(single), "single:card-id|foil");
  assert.equal(Object.hasOwn(single, "assetType"), false);
});

test("sealed assets require and retain exact MTGJSON identity", () => {
  const product = normalizeSealedAsset({
    mtgjson_uuid: SEALED_UUID,
    name: "Bloomburrow Play Booster Box",
    set_code: "BLB",
    category: "booster_box",
    tcgplayerProductId: "541235",
  });
  assert.equal(product.assetKey, `sealed:${SEALED_UUID}`);
  assert.equal(product.identityValid, true);
  assert.equal(product.scryfall_id, undefined);
  assert.equal(assetContextLabel(product), "BLB · booster box");
  assert.equal(getExternalMarketUrl(product), "https://www.tcgplayer.com/product/541235");

  const invalid = normalizeSealedAsset({ name: "Mystery product" });
  assert.equal(invalid.identityValid, false);
  assert.equal(invalid.assetKey, null);
  assert.throws(() => toTrackedSealedProduct(invalid), /valid MTGJSON identity/);
});

test("tracked sealed products start unpriced and use user plan fields", () => {
  const tracked = toTrackedSealedProduct({
    mtgjson_uuid: SEALED_UUID,
    name: "Bloomburrow Play Booster Box",
    set_code: "BLB",
    category: "booster_box",
  }, { plannedQty: 3, entryTarget: 115, exitTarget: 180, holdTime: "12-18" });
  assert.equal(tracked.assetType, "sealed");
  assert.equal(tracked.currentPrice, null);
  assert.equal(tracked.valuationSource, null);
  assert.equal(tracked.plannedQty, 3);
  assert.equal(tracked.entryTarget, 115);
  assert.equal(tracked.exitTarget, 180);
  assert.equal(tracked.holdTime, "12-18");
});

test("generated catalog covers representative sealed product families", async () => {
  const catalog = JSON.parse(await readFile(new URL("../data/sealed-catalog.json", import.meta.url), "utf8"));
  assert.equal(catalog.meta.sourceDate, "2026-08-18");
  assert.ok(catalog.products.length > 3_500);
  assert.ok(filterSealedProducts(catalog.products, "play booster box").some(row => row.category === "booster_box"));
  assert.ok(filterSealedProducts(catalog.products, "play booster pack").some(row => row.category === "booster_pack"));
  assert.ok(filterSealedProducts(catalog.products, "bundle").some(row => row.category === "bundle"));
  assert.ok(filterSealedProducts(catalog.products, "commander deck").some(row => row.subtype === "commander"));
  assert.ok(filterSealedProducts(catalog.products, "secret lair").some(row => row.subtype?.includes("secret_lair")));
});

