import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createStorageAdapter } from "../persistence/storage.js";

const AppStateContext = createContext(null);

export function AppStateProvider({ children, adapter: adapterInput }) {
  const adapter = useMemo(() => adapterInput || createStorageAdapter(), [adapterInput]);
  const [state, setState] = useState(() => adapter.loadState());

  const stateRef = useRef(state);

  const commitState = useCallback(next => {
    const previous = stateRef.current;
    adapter.saveSlices(Object.fromEntries(Object.keys(next)
      .filter(key => next[key] !== previous[key]).map(key => [key, next[key]])));
    stateRef.current = next;
    setState(next);
  }, [adapter]);

  const updateSlice = useCallback((key, update) => {
    const previous = stateRef.current;
    const value = typeof update === "function" ? update(previous[key], previous) : update;
    commitState({ ...previous, [key]: value });
  }, [commitState]);

  const updateState = useCallback(update => {
    const previous = stateRef.current;
    commitState(typeof update === "function" ? update(previous) : update);
  }, [commitState]);

  const restoreBackup = useCallback(backup => {
    const restored = adapter.restoreBackup(backup);
    stateRef.current = restored;
    setState(restored);
    return restored;
  }, [adapter]);

  const reload = useCallback(() => {
    const restored = adapter.loadState();
    stateRef.current = restored;
    setState(restored);
  }, [adapter]);

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
