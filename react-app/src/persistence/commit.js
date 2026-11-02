// Keep the vanilla-compatible keys. A write-ahead undo record makes interrupted
// multi-key writes recoverable without introducing a second ownership store.
export const COMMIT_KEY = "manaspec_pending_commit_v1";

function restoreRaw(storage, key, raw) {
  if (raw === null) storage.removeItem(key);
  else storage.setItem(key, raw);
}

export function recoverCommit(storage, allowedKeys) {
  const raw = storage.getItem(COMMIT_KEY);
  if (raw === null) return false;
  let journal;
  try { journal = JSON.parse(raw); } catch { /* Fail closed below. */ }
  if (journal?.version !== 1 || !Array.isArray(journal.entries) || !journal.entries.length
    || new Set(journal.entries.map(entry => entry.key)).size !== journal.entries.length
    || journal.entries.some(entry => !allowedKeys.includes(entry.key)
      || ![entry.before, entry.after].every(value => value === null || typeof value === "string"))) {
    throw new Error("Saved recovery record is invalid. Preserve browser storage before troubleshooting; no data was changed.");
  }
  // Inspect the entire record before undoing anything. An older vanilla tab or
  // another writer must never be silently overwritten during recovery.
  for (const entry of journal.entries) {
    const current = storage.getItem(entry.key);
    if (current !== entry.before && current !== entry.after) {
      throw new Error("Saved data changed during recovery. Preserve browser storage and close other ManaSpec tabs before troubleshooting.");
    }
  }
  for (const entry of journal.entries) restoreRaw(storage, entry.key, entry.before);
  storage.removeItem(COMMIT_KEY);
  return true;
}

export function commitRaw(storage, values, expected, allowedKeys) {
  if (storage.getItem(COMMIT_KEY) !== null) {
    throw new Error("A saved operation needs recovery. Reload ManaSpec before making changes.");
  }
  for (const key of allowedKeys) {
    if (expected[key] !== storage.getItem(key)) {
      throw new Error("Saved data changed in another ManaSpec tab. Reload before retrying; this operation was not saved.");
    }
  }
  const entries = Object.entries(values).filter(([key, after]) => after !== expected[key])
    .map(([key, after]) => ({ key, before: expected[key], after }));
  if (!entries.length) return;
  if (entries.some(entry => !allowedKeys.includes(entry.key))) throw new Error("Unsupported storage key.");
  // Quota failure here leaves every application key untouched.
  storage.setItem(COMMIT_KEY, JSON.stringify({ version: 1, entries }));
  try {
    for (const entry of entries) restoreRaw(storage, entry.key, entry.after);
    storage.removeItem(COMMIT_KEY);
  } catch (error) {
    try { recoverCommit(storage, allowedKeys); } catch {
      throw new Error("Save interrupted and recovery is pending. Reload ManaSpec before continuing; preserve browser storage if recovery fails.", { cause: error });
    }
    throw new Error("Could not save this operation. Previous data was restored; export a backup and check browser storage space before retrying.", { cause: error });
  }
}
