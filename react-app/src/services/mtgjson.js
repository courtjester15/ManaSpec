import { normalizeSealedAsset } from "../domain/assetIdentity.js";

let catalogPromise;

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export async function loadSealedCatalog() {
  catalogPromise ||= import("../data/sealed-catalog.json")
    .then(module => module.default || module)
    .then(catalog => ({
      meta: catalog.meta,
      products: catalog.products.map(normalizeSealedAsset),
    }));
  return catalogPromise;
}

export async function searchSealedProducts(queryInput, options = {}) {
  const { products } = await loadSealedCatalog();
  return filterSealedProducts(products, queryInput, options);
}

export function filterSealedProducts(products, queryInput, options = {}) {
  const query = normalizeSearchText(queryInput);
  if (query.length < 2) return [];
  const terms = query.split(" ").filter(Boolean);
  const limit = Number.isInteger(options.limit) ? options.limit : 60;
  return products
    .map(product => {
      const name = normalizeSearchText(product.name);
      const searchText = normalizeSearchText([
        product.name,
        product.set_code,
        product.set_name,
        product.category,
        product.subtype,
        product.contentsSummary,
        product.releaseDate,
      ].join(" "));
      if (!terms.every(term => searchText.includes(term))) return null;
      const score = name === query ? 0 : name.startsWith(query) ? 1 : name.includes(query) ? 2 : 3;
      return { product, score };
    })
    .filter(Boolean)
    .sort((left, right) => left.score - right.score
      || String(right.product.releaseDate || "").localeCompare(String(left.product.releaseDate || ""))
      || left.product.name.localeCompare(right.product.name))
    .slice(0, limit)
    .map(entry => entry.product);
}
