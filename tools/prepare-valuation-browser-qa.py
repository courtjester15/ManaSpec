"""Generate isolated, memory-storage QA pages; never touch browser-owned data."""
import json
import shutil
import argparse
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parent.parent
fixture = json.loads((root / "test-fixtures/browser/issue-20-valuations.json").read_text())
parser = argparse.ArgumentParser()
parser.add_argument("--unf-finish", choices=["nonfoil", "foil"])
args = parser.parse_args()
suffix = f"-unf-{args.unf_finish}" if args.unf_finish else ""
live_records = None
if args.unf_finish:
    evidence = json.loads((root / "test-fixtures/browser/issue-20-live-unf-quotes.json").read_text())
    live_records = [{**card, "games": ["paper"], "prints_search_uri": "https://api.scryfall.com/cards/search?fixture=issue20"} for card in evidence["cards"]]
    fixture = {"cash": 100, "radar": [], "transactions": [], "specs": [{
        "id": card["id"] + ("|foil" if args.unf_finish == "foil" else ""),
        "scryfall_id": card["id"], "trackedPrintingKey": card["id"] + "|" + args.unf_finish,
        "name": card["name"], "set_code": "UNF", "set_name": "Unfinity", "collector_number": card["collector_number"],
        "finish": args.unf_finish, "foil": args.unf_finish == "foil", "finishes": card["finishes"],
        "qty": 1, "buyPrice": 100, "buyDate": "2026-07-01T12:00:00Z", "currentPrice": 0,
        "priceUpdatedAt": "2020-01-01T00:00:00Z", "exitTarget": 200, "holdTime": "12 mo"
    } for card in evidence["cards"]]}
storage = {key: json.dumps(value) for key, value in fixture.items()}
storage["priceRefreshStatus"] = json.dumps({"checkedAt": datetime.now(timezone.utc).isoformat() if args.unf_finish else "2020-01-01", "updatedCount": 0})
bootstrap = """<script>
const fixtureStorage = new Map(Object.entries(STORAGE));
Object.defineProperty(window, 'localStorage', {value: {
  getItem: key => fixtureStorage.get(key) ?? null,
  setItem: (key, value) => fixtureStorage.set(key, String(value)),
  removeItem: key => fixtureStorage.delete(key)
}});
const nativeFetch = window.fetch.bind(window);
window.fetch = async (url, options) => {
  if (!String(url).startsWith('https://api.scryfall.com')) return nativeFetch(url, options);
  const records = LIVE_RECORDS || FIXTURE.specs.map(item => ({
    id: item.scryfall_id, name: item.name, set: 'cmm', collector_number: item.collector_number,
    games: ['paper'], finishes: ['nonfoil', 'foil'], digital: false,
    prints_search_uri: 'https://api.scryfall.com/cards/search?fixture=issue20',
    prices: {usd: item.name === 'Command Tower' ? '14.00' : item.name === 'Arcane Signet' ? '0.00' : null, usd_foil: null}
  }));
  const body = String(url).endsWith('/collection') || String(url).includes('/cards/search')
    ? {data: records} : records.find(item => String(url).endsWith(item.id));
  return {ok:true, json: async () => body || records[0]};
};
</script>""".replace("STORAGE", json.dumps(storage)).replace("FIXTURE", json.dumps(fixture)).replace("LIVE_RECORDS", json.dumps(live_records))
out = root / ".tmp/issue20"
out.mkdir(parents=True, exist_ok=True)
for name, source, base in [
    ("vanilla", root / "index.html", "/"),
    ("react", root / "react-app/dist/index.html", "/react-app/dist/"),
    ("portable", root / "react-app/dist-portable/index.html", "/react-app/dist-portable/"),
]:
    html = source.read_text(encoding="utf-8").replace("<head>", f'<head><base href="{base}">' + bootstrap, 1)
    # Normal production build emits root-absolute paths; rebase this QA wrapper only.
    if name == "react":
        html = html.replace('"/assets/', '"/react-app/dist/assets/').replace('/ManaSpec/react-spike/', '/react-spike/')
    (out / f"{name}{suffix}.html").write_text(html, encoding="utf-8")
print("Memory-backed QA pages ready at /.tmp/issue20/{vanilla,react,portable}.html")
pages = out / "pages-root/ManaSpec/react-spike"
shutil.copytree(root / "react-spike", pages, dirs_exist_ok=True)
html = (pages / "index.html").read_text(encoding="utf-8").replace("<head>", "<head>" + bootstrap, 1)
(pages / f"qa{suffix}.html").write_text(html, encoding="utf-8")
print("Pages fixture: serve .tmp/issue20/pages-root and open /ManaSpec/react-spike/qa.html")
