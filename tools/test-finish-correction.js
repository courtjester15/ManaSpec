const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const cards = JSON.parse(fs.readFileSync('test-fixtures/browser/issue-20-live-unf-quotes.json','utf8')).cards;
const specs = cards.map(card => ({id:card.id,scryfall_id:card.id,name:card.name,set_code:'UNF',collector_number:card.collector_number,foil:false,finishes:['foil'],qty:2,buyPrice:100,currentPrice:0,buyDate:'2026-07-01'}));
const transactions = specs.map((row,i)=>({id:`buy-${i}`,cardId:row.id,backfilledFromPositionId:row.id,foil:false,type:'BUY',quantity:2,price:100,fees:2,date:'2026-07-01'}));
const values = new Map(Object.entries({specs,transactions,radar:[{...specs[0],plannedQty:3}],cash:500}).map(([k,v])=>[k,JSON.stringify(v)]));
const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
function boot(){ const c=vm.createContext({console,localStorage});for(const f of ['js/core/data-foundation.js','js/core/finish-policy.js','js/core/storage.js','js/core/state.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c); return c; }
let c=boot(); const before=localStorage.getItem('transactions'); const preview=c.previewUnfFinishCorrection(cards); c.applyUnfFinishCorrection(preview);
c=boot(); const after=JSON.parse(localStorage.getItem('transactions'));assert.equal(after.length,2);assert.equal(JSON.parse(localStorage.getItem('specs'))[0].qty,2);assert.equal(localStorage.getItem('cash'),'500');assert.equal(after[0].cardId,`${cards[0].id}|foil`);assert.equal(after[0].backfilledFromPositionId,`${cards[0].id}|foil`);
for(let i=0;i<2;i++)for(const k of ['id','quantity','price','fees','date'])assert.equal(after[i][k],JSON.parse(before)[i][k]);
const backup=JSON.parse(localStorage.getItem(c.ManaSpecFinishPolicy.BACKUP_KEY)); assert.equal(backup.rawStorage.transactions,before); assert.equal(c.normalizeManaSpecBackup(backup.backup).ok,true);
assert.equal(c.previewUnfFinishCorrection(cards).plan.corrections.length,0);
console.log('Vanilla correction, startup/reload, no duplicate backfills, immutable cash/amounts, and native backup validation passed.');
