import { useEffect, useMemo, useRef, useState } from "react";
import { groupLocalSearchResults, normalizeLocalSearchText, searchLocalState } from "../../domain/localSearch.js";

function optionId(result, index) {
  return `local-search-option-${index}-${result.id.replace(/[^a-z0-9_-]/gi, "-")}`;
}

export function LocalSearch({ state, onNavigate }) {
  const formRef = useRef(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const normalizedQuery = normalizeLocalSearchText(query);
  const results = useMemo(() => searchLocalState(state, query), [query, state]);
  const groups = useMemo(() => groupLocalSearchResults(results), [results]);
  const groupedResults = useMemo(() => groups.flatMap(group => group.results), [groups]);
  const activeIndex = groupedResults.findIndex(result => result.id === activeId);
  const hasQuery = normalizedQuery.length >= 2;

  useEffect(() => setActiveId(""), [normalizedQuery]);
  useEffect(() => {
    if (activeIndex < 0) return;
    document.getElementById(optionId(groupedResults[activeIndex], activeIndex))?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, groupedResults]);

  function choose(result) {
    if (!result) return;
    onNavigate(result.destination);
    setQuery("");
    setOpen(false);
    setActiveId("");
  }

  function submit(event) {
    event.preventDefault();
    if (!hasQuery) return;
    if (groupedResults.length) choose(groupedResults[activeIndex >= 0 ? activeIndex : 0]);
    else setOpen(true);
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActiveId("");
      return;
    }
    if (event.key === "Enter" && hasQuery) {
      event.preventDefault();
      if (groupedResults.length) choose(groupedResults[activeIndex >= 0 ? activeIndex : 0]);
      else setOpen(true);
      return;
    }
    if (!["ArrowDown", "ArrowUp"].includes(event.key) || !groupedResults.length) return;
    event.preventDefault();
    setOpen(true);
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = activeIndex < 0
      ? direction > 0 ? 0 : groupedResults.length - 1
      : (activeIndex + direction + groupedResults.length) % groupedResults.length;
    setActiveId(groupedResults[nextIndex].id);
  }

  let optionIndex = -1;
  const listboxOpen = open && hasQuery;
  return (
    <form
      ref={formRef}
      className="global-search-bar"
      role="search"
      onSubmit={submit}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label className="visually-hidden" htmlFor="universalSearch">Search saved ManaSpec data</label>
      <input
        id="universalSearch"
        name="query"
        value={query}
        placeholder="Search ManaSpec..."
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={listboxOpen}
        aria-controls="universalSearchResults"
        aria-activedescendant={activeIndex >= 0 ? optionId(groupedResults[activeIndex], activeIndex) : undefined}
        onChange={event => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (hasQuery) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      <button type="submit" id="universalSearchButton">Search</button>
      {listboxOpen && (
        <div id="universalSearchResults" className="universal-search-results show" role="listbox" aria-label="Saved ManaSpec search results">
          {groups.length ? groups.map(group => (
            <section key={group.category} className="universal-search-group" role="group" aria-label={group.category}>
              <header><strong>{group.category}</strong><span>{group.results.length}</span></header>
              {group.results.map(result => {
                optionIndex += 1;
                const index = optionIndex;
                const active = result.id === activeId;
                return (
                  <button
                    key={result.id}
                    id={optionId(result, index)}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={active ? "active" : ""}
                    onMouseEnter={() => setActiveId(result.id)}
                    onFocus={() => setActiveId(result.id)}
                    onClick={() => choose(result)}
                  >
                    <span className="universal-search-result-main"><strong>{result.primary}</strong><small>{result.secondary}</small></span>
                    <span className="universal-search-source">{result.category}</span>
                    <small className="universal-search-context">{result.context}</small>
                  </button>
                );
              })}
            </section>
          )) : <div className="universal-search-empty" role="status"><strong>No saved ManaSpec matches</strong><span>Add or find new cards from Radar's Scryfall search.</span></div>}
        </div>
      )}
    </form>
  );
}
