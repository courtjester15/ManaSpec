import { finishPolicy } from "./finishPolicy.js";

export function compactDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)}`;
}
export function compactDateTime(value) {
  if (compactDate(value) === "-") return "-";
  const date = new Date(value);
  return `${compactDate(value)} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
export function compactRarity(value) {
  return ({ common: "C", uncommon: "U", rare: "R", mythic: "M", special: "S", bonus: "B" })[String(value || "").toLowerCase()] || "-";
}
export function compactHold(value) {
  const text = String(value || "").trim();
  if (/^\d+(?:\s*-\s*\d+)?$/.test(text)) return `${text} mo`;
  return text.replace(/\s*months?\b/gi, " mo") || "Set";
}
export function printingLabel(item) {
  const finish = finishPolicy.recordFinish(item);
  return `${item.collector_number || "-"}${finish === "foil" ? " F" : finish === "etched" ? " E" : ""}`;
}

export function attentionReason(item, bucketId) {
  if (bucketId === "noPlan") return `Missing ${(item.missingPlanReasons || []).join(" + ")}`;
  if (bucketId === "staleChecks") return "Market check due";
  if (bucketId === "targetsHit") return item.source === "radar" ? "Entry hit" : "Exit hit";
  if (bucketId === "approaching") return item.status === "Exit near" ? "Exit near" : item.status === "Entry near" ? "Entry near" : "Target watch";
  return item.reasonLabel || "Review";
}
