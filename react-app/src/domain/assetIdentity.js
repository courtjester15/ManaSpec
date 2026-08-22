export const ASSET_TYPES = Object.freeze({
  SINGLE: "single",
  SEALED: "sealed",
});

const FINISHES = new Set(["nonfoil", "foil", "etched"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized >= 0 ? normalized : null;
}

export function getAssetType(record = {}) {
  if (!record || typeof record !== "object") return ASSET_TYPES.SINGLE;
  if (record.assetType === ASSET_TYPES.SEALED) return ASSET_TYPES.SEALED;
  if (record.assetType === ASSET_TYPES.SINGLE) return ASSET_TYPES.SINGLE;
  if (record.mtgjson_uuid || record.mtgjsonUuid || String(record.assetKey || "").startsWith("sealed:")) {
    return ASSET_TYPES.SEALED;
  }
  return ASSET_TYPES.SINGLE;
}

export function getSingleFinish(record = {}) {
  const explicit = text(record.finish)?.toLowerCase();
  if (FINISHES.has(explicit)) return explicit;
  const suffix = String(record.id || record.cardId || "").match(/\|(nonfoil|foil|etched)$/i)?.[1]?.toLowerCase();
  if (FINISHES.has(suffix)) return suffix;
  return record.foil === true ? "foil" : record.foil === false ? "nonfoil" : null;
}

export function getSingleScryfallId(record = {}) {
  const raw = text(record.scryfall_id || record.scryfallId || record.cardId || record.id);
  return raw?.replace(/\|(nonfoil|foil|etched)$/i, "") || null;
}

export function getTrackedPrintingKey(record = {}) {
  if (!record || typeof record !== "object") return null;
  if (getAssetType(record) !== ASSET_TYPES.SINGLE) return null;
  const explicit = text(record.trackedPrintingKey || record.cardKey || record.printingKey);
  if (explicit?.match(/\|(nonfoil|foil|etched)$/i)) return explicit;
  const id = getSingleScryfallId(record);
  const finish = getSingleFinish(record);
  return id && finish ? `${id}|${finish}` : null;
}

export function getMtgjsonUuid(record = {}) {
  if (getAssetType(record) !== ASSET_TYPES.SEALED) return null;
  const explicit = text(record.mtgjson_uuid || record.mtgjsonUuid || record.productUuid);
  if (explicit) return explicit;
  const key = text(record.assetKey || record.id || record.cardId);
  return key?.startsWith("sealed:") ? key.slice("sealed:".length) || null : null;
}

export function getAssetKey(record = {}) {
  if (!record || typeof record !== "object") return null;
  if (getAssetType(record) === ASSET_TYPES.SEALED) {
    const uuid = getMtgjsonUuid(record);
    return uuid && UUID_PATTERN.test(uuid) ? `sealed:${uuid.toLowerCase()}` : null;
  }
  const printingKey = getTrackedPrintingKey(record);
  return printingKey ? `single:${printingKey}` : null;
}

export function isValidAssetIdentity(record = {}) {
  return Boolean(getAssetKey(record));
}

export function assetTypeLabel(record = {}) {
  return getAssetType(record) === ASSET_TYPES.SEALED ? "Sealed" : "Single";
}

export function assetContextLabel(record = {}) {
  if (getAssetType(record) === ASSET_TYPES.SEALED) {
    const type = text(record.productType || record.category || record.subtype)?.replaceAll("_", " ");
    return [text(record.set_code)?.toUpperCase(), type].filter(Boolean).join(" · ") || "Sealed product";
  }
  const set = text(record.set_code || record.set)?.toUpperCase() || "Set unknown";
  const collector = text(record.collector_number);
  const finish = getSingleFinish(record);
  return `${set}${collector ? ` #${collector}` : ""}${finish ? ` · ${finish === "nonfoil" ? "Nonfoil" : finish[0].toUpperCase() + finish.slice(1)}` : ""}`;
}

export function getExternalMarketUrl(record = {}) {
  if (getAssetType(record) === ASSET_TYPES.SEALED) {
    return text(record.purchaseUrls?.tcgplayer || record.tcgplayerUrl)
      || (text(record.tcgplayerProductId) ? `https://www.tcgplayer.com/product/${encodeURIComponent(record.tcgplayerProductId)}` : null);
  }
  return `https://www.tcgplayer.com/search/magic/product?productLineName=magic&q=${encodeURIComponent(record.name || "")}`;
}

export function normalizeSealedAsset(record = {}) {
  const uuid = getMtgjsonUuid({ ...record, assetType: ASSET_TYPES.SEALED });
  const assetKey = uuid && UUID_PATTERN.test(uuid) ? `sealed:${uuid.toLowerCase()}` : null;
  return {
    ...record,
    id: assetKey || text(record.id),
    assetType: ASSET_TYPES.SEALED,
    assetKey,
    mtgjson_uuid: uuid?.toLowerCase() || null,
    name: text(record.name),
    set_code: text(record.set_code || record.set)?.toUpperCase() || null,
    set_name: text(record.set_name),
    category: text(record.category),
    subtype: text(record.subtype),
    productType: text(record.productType || record.category || record.subtype),
    releaseDate: text(record.releaseDate),
    tcgplayerProductId: text(record.tcgplayerProductId || record.identifiers?.tcgplayerProductId),
    purchaseUrls: record.purchaseUrls && typeof record.purchaseUrls === "object" ? { ...record.purchaseUrls } : {},
    currentPrice: numberOrNull(record.currentPrice),
    priceUpdatedAt: text(record.priceUpdatedAt),
    identityValid: Boolean(assetKey),
  };
}

export function toTrackedSealedProduct(product, options = {}) {
  const normalized = normalizeSealedAsset(product);
  if (!normalized.identityValid) throw new Error("This sealed product is missing a valid MTGJSON identity.");
  return {
    ...normalized,
    plannedQty: Math.max(1, Number(options.plannedQty || 1)),
    entryTarget: numberOrNull(options.entryTarget) || 0,
    exitTarget: numberOrNull(options.exitTarget) || 0,
    holdTime: text(options.holdTime) || "",
    addedDate: new Date().toISOString(),
    currentPrice: null,
    priceUpdatedAt: null,
    valuationSource: null,
  };
}

export function sameAsset(left, right) {
  const leftKey = getAssetKey(left);
  return Boolean(leftKey) && leftKey === getAssetKey(right);
}
