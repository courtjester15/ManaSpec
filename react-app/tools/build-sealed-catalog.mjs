import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const input = process.argv[2];
const output = process.argv[3] || new URL("../src/data/sealed-catalog.json", import.meta.url).pathname;

if (!input) {
  console.error("Usage: node tools/build-sealed-catalog.mjs <SetList.json> [output.json]");
  process.exit(1);
}

function compactContents(contents = {}) {
  const labels = [];
  for (const [key, rows] of Object.entries(contents)) {
    if (!Array.isArray(rows) || !rows.length) continue;
    if (key === "variable") {
      labels.push(`${rows.length} variable configuration${rows.length === 1 ? "" : "s"}`);
      continue;
    }
    const count = rows.reduce((total, row) => total + (Number(row?.count) || 1), 0);
    labels.push(`${count} ${key}${count === 1 ? "" : "s"}`);
  }
  return labels.join(", ");
}

const source = JSON.parse(await readFile(resolve(input), "utf8"));
const products = [];

for (const set of source.data || []) {
  if (set.isOnlineOnly) continue;
  for (const product of set.sealedProduct || []) {
    if (!product?.uuid || !product?.name || product.subtype === "mtgo_redemption") continue;
    products.push({
      assetType: "sealed",
      mtgjson_uuid: product.uuid,
      name: product.name,
      set_code: set.code,
      set_name: set.name,
      category: product.category || null,
      subtype: product.subtype || null,
      releaseDate: product.releaseDate || set.releaseDate || null,
      cardCount: product.cardCount ?? null,
      productSize: product.productSize ?? null,
      contentsSummary: compactContents(product.contents),
      tcgplayerProductId: product.identifiers?.tcgplayerProductId || null,
      purchaseUrls: product.purchaseUrls || {},
    });
  }
}

products.sort((left, right) =>
  String(right.releaseDate || "").localeCompare(String(left.releaseDate || ""))
  || left.name.localeCompare(right.name)
  || left.mtgjson_uuid.localeCompare(right.mtgjson_uuid));

const catalog = {
  meta: {
    source: "MTGJSON SetList",
    sourceDate: source.meta?.date || null,
    sourceVersion: source.meta?.version || null,
    generatedAt: source.meta?.date ? `${source.meta.date}T00:00:00.000Z` : null,
    productCount: products.length,
  },
  products,
};

await writeFile(resolve(output), `${JSON.stringify(catalog)}\n`, "utf8");
console.log(`Wrote ${products.length} sealed products to ${resolve(output)}`);
