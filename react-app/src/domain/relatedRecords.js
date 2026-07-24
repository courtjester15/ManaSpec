import { dataFoundation } from "./dataFoundation.js";

const FINISH_SUFFIX = /\|(nonfoil|foil|etched)$/i;

function text(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function normalizedKey(value) {
  const raw = text(value);
  const match = raw?.match(FINISH_SUFFIX);
  if (!match) return null;
  return `${raw.slice(0, -match[0].length)}|${match[1].toLowerCase()}`;
}

export function getRelatedRecordPrintingKey(record = {}) {
  if (!record || typeof record !== "object") return null;
  for (const value of [record.trackedPrintingKey, record.cardKey, record.printingKey]) {
    const key = normalizedKey(value);
    if (key) return key;
  }
  return dataFoundation.getTrackedPrintingKey(record);
}

function getBasePrintingId(record = {}) {
  const exactKey = getRelatedRecordPrintingKey(record);
  if (exactKey) return exactKey.replace(FINISH_SUFFIX, "");
  const raw = text(record.scryfall_id ?? record.scryfallId ?? record.cardId);
  return raw?.replace(FINISH_SUFFIX, "") || null;
}

function trackedCandidates(candidates = []) {
  const byKey = new Map();
  for (const candidate of candidates) {
    const key = getRelatedRecordPrintingKey(candidate);
    if (key && !byKey.has(key)) byKey.set(key, candidate);
  }
  return [...byKey.entries()].map(([key, candidate]) => ({
    key,
    candidate,
    baseId: key.replace(FINISH_SUFFIX, ""),
  }));
}

function sameText(left, right) {
  return text(left)?.toLowerCase() === text(right)?.toLowerCase();
}

function uniqueCandidate(matches) {
  return matches.length === 1 ? matches[0].candidate : null;
}

export function resolveTrackedPrinting(record, candidates = []) {
  if (!record) return null;
  const tracked = trackedCandidates(candidates);
  const exactKey = getRelatedRecordPrintingKey(record);
  if (exactKey) return tracked.find(entry => entry.key === exactKey)?.candidate || null;

  const baseId = getBasePrintingId(record);
  if (baseId) {
    return uniqueCandidate(tracked.filter(entry => entry.baseId === baseId));
  }

  const setCode = record.set_code ?? record.set;
  const collectorNumber = record.collector_number;
  if (text(setCode) && text(collectorNumber)) {
    return uniqueCandidate(tracked.filter(({ candidate }) =>
      sameText(candidate.set_code ?? candidate.set, setCode)
      && sameText(candidate.collector_number, collectorNumber)
      && (!text(record.cardName ?? record.name) || sameText(candidate.name, record.cardName ?? record.name))));
  }

  const name = record.cardName ?? record.name;
  if (text(name)) return uniqueCandidate(tracked.filter(({ candidate }) => sameText(candidate.name, name)));
  return null;
}

export function relatedRecordMatchesPrinting(record, item, candidates = []) {
  const itemKey = getRelatedRecordPrintingKey(item);
  if (!itemKey) return false;
  const recordKey = getRelatedRecordPrintingKey(record);
  if (recordKey) return recordKey === itemKey;
  return getRelatedRecordPrintingKey(resolveTrackedPrinting(record, candidates)) === itemKey;
}

export function getRelatedRecordsForPrinting(records = [], item, candidates = []) {
  return records.filter(record => relatedRecordMatchesPrinting(record, item, candidates));
}

export function resolveCardDetailPrinting(record, candidates = []) {
  return resolveTrackedPrinting(record, candidates)
    || (getRelatedRecordPrintingKey(record) ? record : null);
}
