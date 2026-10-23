import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createStorageAdapter } from "../persistence/storage.js";

const AppStateContext = createContext(null);

export function AppStateProvider({ children, adapter: adapterInput }) {
  const adapter = useMemo(() => adapterInput || createStorageAdapter(), [adapterInput]);
  const [state, setState] = useState(() => adapter.loadState());

  const updateSlice = useCallback((key, update) => {
    setState(previous => {
      const value = typeof update === "function" ? update(previous[key], previous) : update;
      adapter.saveSlice(key, value);
      return { ...previous, [key]: value };
    });
  }, [adapter]);

  const updateState = useCallback(update => {
    setState(previous => {
      const next = typeof update === "function" ? update(previous) : update;
      Object.keys(next).forEach(key => {
        if (next[key] !== previous[key]) adapter.saveSlice(key, next[key]);
      });
      return next;
    });
  }, [adapter]);

  const restoreBackup = useCallback(backup => {
    const restored = adapter.restoreBackup(backup);
    setState(restored);
    return restored;
  }, [adapter]);

  const reload = useCallback(() => setState(adapter.loadState()), [adapter]);

  const value = useMemo(() => ({
    state,
    updateSlice,
    updateState,
    createBackup: () => adapter.createBackup(state),
    parseBackupText: adapter.parseBackupText,
    restoreBackup,
    reload,
    storagePersistent: adapter.persistent,
  }), [adapter, reload, restoreBackup, state, updateSlice, updateState]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used inside AppStateProvider");
  return value;
}
