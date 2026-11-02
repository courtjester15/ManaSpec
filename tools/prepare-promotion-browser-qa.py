"""Assemble synthetic-only previews. Never read, copy, or change owner backups.

Run after the React Pages, portable and canonical builds. Serve the printed
directory with Python on a dedicated loopback port. These wrappers are QA only.
"""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent.parent
out = root / ".tmp/issue-27-preview"
bootstrap = (root / "tools/workflow-qa-bootstrap.html").read_text(encoding="utf-8")
# Reuse the reviewed synthetic store and enrich it without using private data.
bootstrap = bootstrap.replace("if(location.search.includes('reset'))sessionStorage.removeItem(key);", "if(location.search.includes('reset')){sessionStorage.removeItem(key);sessionStorage.removeItem('promotion-enriched');}", 1)
extra = """
<script>
const qaParams = new URLSearchParams(location.search);
if (qaParams.has('empty')) {
  for (const key of [...data.keys()]) data.set(key, key === 'cash' ? '10000' : '[]');
} else if (!sessionStorage.getItem('promotion-enriched')) {
  const specs = JSON.parse(data.get('specs'));
  specs.push({...specs[0],id:'00000000-0000-4000-8000-000000000002|etched',scryfall_id:'00000000-0000-4000-8000-000000000002',trackedPrintingKey:'00000000-0000-4000-8000-000000000002|etched',finish:'etched',foil:false,name:'QA Etched Zero',currentPrice:0,prices:{usd_etched:'0.00'},finishes:['etched']});
  data.set('specs',JSON.stringify(specs));
  data.set('cardNotes',JSON.stringify([{id:'qa-note',cardKey:specs[1].trackedPrintingKey,cardId:specs[1].id,scryfall_id:specs[1].scryfall_id,finish:'foil',text:'Synthetic thesis: review before exit',createdAt:'2026-07-01T12:00:00Z'}]));
  data.set('priceSnapshots',JSON.stringify([{date:'2026-07-01',cardId:specs[1].scryfall_id,foil:true,finish:'foil',price:6,source:'scryfall'},{date:'2026-10-01',cardId:specs[1].scryfall_id,foil:true,finish:'foil',price:8,source:'scryfall'}]));
  sessionStorage.setItem('promotion-enriched','1');
}
if (qaParams.has('corrupt')) data.set('specs','not-json');
const nativeFetch=window.fetch.bind(window);
window.fetch=async(input,options={})=>{
  const url=String(input);
  if (!url.startsWith('https://api.scryfall.com/')) return nativeFetch(input,options);
  if(qaParams.has('provider-failure')) return new Response(JSON.stringify({details:'Synthetic provider unavailable'}),{status:503});
  const cards=[...JSON.parse(data.get('radar')||'[]'),...JSON.parse(data.get('specs')||'[]')].map(row=>({...row,id:row.scryfall_id,oracle_id:'qa-oracle',set:row.set_code.toLowerCase(),prices:row.finish==='etched'?{usd:null,usd_foil:null,usd_etched:'0.00'}:{usd:'7.00',usd_foil:'8.00',usd_etched:null}}));
  const body=url.includes('/cards/named')?cards[0]:{data:cards};
  return new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}});
};
document.addEventListener('DOMContentLoaded',()=>{
  const label=document.createElement('aside');
  label.textContent='Synthetic QA only · isolated session storage · fixture Scryfall responses';
  label.style.cssText='position:fixed;bottom:0;left:0;background:#132138;color:white;padding:3px 8px;z-index:99999;font:11px sans-serif';
  document.body.append(label);
});
</script>
"""
for source, destination in [
    (root / "react-app/dist-canonical", out / "ManaSpec"),
    (root / "react-spike", out / "ManaSpec/react-spike"),
    (root / "react-app/dist-portable", out / "portable"),
]:
    shutil.copytree(source, destination, dirs_exist_ok=True)
    html = (destination / "index.html").read_text(encoding="utf-8")
    (destination / "qa.html").write_text(html.replace("<head>", "<head>" + bootstrap + extra, 1), encoding="utf-8")

reference = out / "reference"
reference.mkdir(parents=True, exist_ok=True)
for directory in ["assets", "css", "js"]:
    shutil.copytree(root / directory, reference / directory, dirs_exist_ok=True)
html = (root / "index.html").read_text(encoding="utf-8")
(reference / "qa.html").write_text(html.replace("<head>", "<head>" + bootstrap + extra, 1), encoding="utf-8")
print(f"Serve: python -m http.server 8029 --bind 127.0.0.1 --directory {out}")
print("Canonical /ManaSpec/qa.html; spike /ManaSpec/react-spike/qa.html; hosted portable /portable/qa.html; vanilla /reference/qa.html")
print("?reset resets the shared synthetic map; ?empty gives empty state; ?provider-failure gives controlled price failure; ?corrupt exercises recovery.")
