export function finalizePortableHtml(html) {
  return html
    .replace(/\s+type="module"/g, "")
    .replace(/\s+crossorigin/g, "")
    .replace(/<link rel="modulepreload"[^>]*>/g, "")
    .replace(/<script(?![^>]*\bdefer\b)([^>]*\bsrc="\.\/assets\/manaspec\.js"[^>]*)><\/script>/g, "<script defer$1></script>");
}
