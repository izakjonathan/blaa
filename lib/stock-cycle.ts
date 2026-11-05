import {newWeek,type Stock,type Week} from './stock.ts';

/** Copenhagen wall-clock minutes, matching all existing count boundaries. */
export function stockNow(){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Copenhagen',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const get=(type:string)=>parts.find(p=>p.type===type)!.value;return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;}
export function newCount(stock:Stock,end:string,id:string):Week{
 if(stock.weeks.some(w=>w.status==='draft'))throw Error('Invalid count: finalize the open count first.');
 const previous=[...stock.weeks].filter(w=>w.status==='closed').sort((a,b)=>b.end.localeCompare(a.end))[0];
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(end)||!Number.isFinite(Date.parse(end+'Z'))||new Date(end+'Z').toISOString().slice(0,16)!==end)throw Error('Invalid count date.');
 if(previous&&end<=previous.end)throw Error('Invalid count: choose a time after the previous count.');
 const start=previous?.end??new Date(Date.parse(end+'Z')-60000).toISOString().slice(0,16);
 const week=newWeek(stock,start,end,id);
 if(!previous)return {...week,baseline:true,source:'ledger'};
 return applyActivity(stock,{...week,source:'ledger'});
}
export function applyActivity(stock:Stock,week:Week):Week{
 if(week.status==='closed'||week.baseline)throw Error('Invalid count: activity can only refresh an open calculation cycle.');
 const inside=(at:string)=>at>=week.start&&at<week.end;
 const deliveries=(stock.deliveries??[]).filter(d=>inside(d.at)),entries=(stock.salesEntries??[]).filter(e=>inside(e.at));
 const ids=new Set([...deliveries.map(d=>d.product.id),...entries.flatMap(e=>e.item.ingredients.map(i=>i.productId))]);
 const fresh=newWeek(stock,week.start,week.end,week.id);
 const rows=[...week.rows,...fresh.rows.filter(r=>!week.rows.some(old=>old.product.id===r.product.id))];
 for(const id of ids)if(!rows.some(r=>r.product.id===id)){const product=stock.products.find(p=>p.id===id)!;const previous=stock.weeks.find(w=>w.status==='closed'&&w.end===week.start)?.rows.find(r=>r.product.id===id);rows.push({product:structuredClone(product),opening:previous?.closing??null,closing:null,deliveryPacks:0,deliveryLoose:0,waste:0,comps:0,transfer:0,note:''});}
 const anchor=stock.weeks.find(w=>w.status==='closed'&&w.end===week.start);
 const groups=new Map<string,{item:typeof stock.sales[number];quantity:number}>();
 for(const e of entries){const key=JSON.stringify(e.item),old=groups.get(key);if(old)old.quantity+=e.quantity;else groups.set(key,{item:structuredClone(e.item),quantity:e.quantity});}
 const sales=[...groups.values()].map((s,index)=>({...s,item:{...s.item,id:s.item.id.slice(0,65)+'-v'+index}}));
 return {...week,source:'ledger',sales,salesConfirmed:false,movementsConfirmed:false,rows:rows.map(r=>{
  const logs=deliveries.filter(d=>d.product.id===r.product.id),delivered=logs.reduce((sum,d)=>sum+d.packs*d.product.pack,0);
  const prior=anchor?.rows.find(a=>a.product.id===r.product.id),opening=r.opening;
  const baseCost=prior?prior.product.packCost/prior.product.pack:r.product.packCost/r.product.pack;
  const available=(opening??0)+delivered,cost=available>0?((opening??0)*baseCost+logs.reduce((sum,d)=>sum+d.packs*d.cost,0))/available:baseCost;
  return {...r,deliveryPacks:delivered/r.product.pack,deliveryLoose:0,product:{...r.product,packCost:cost*r.product.pack}};
 })};
}
export function countFinancials(week:Week){
 if(week.baseline||(!week.salesConfirmed&&week.source!=='ledger'))return {sales:null,revenue:null,cogs:null,unpriced:0};
 let sales=0,revenue=0,cogs=0,unpriced=0;
 for(const s of week.sales){sales+=s.quantity;if(s.item.unitPrice===undefined&&s.quantity)unpriced++;else revenue+=s.quantity*(s.item.unitPrice??0);for(const i of s.item.ingredients){const p=week.rows.find(r=>r.product.id===i.productId)!.product;cogs+=s.quantity*i.quantity*p.packCost/p.pack;}}
 return {sales,revenue:unpriced?null:revenue,cogs,unpriced};
}
export function expectedPacks(week:Week,id:string){const r=week.rows.find(r=>r.product.id===id)!;if(r.opening===null||(!week.salesConfirmed&&week.source!=='ledger')||week.baseline)return null;const sold=week.sales.reduce((n,s)=>n+s.quantity*s.item.ingredients.filter(i=>i.productId===id).reduce((a,i)=>a+i.quantity,0),0);return (r.opening+r.deliveryPacks*r.product.pack+r.deliveryLoose+r.transfer-sold-r.waste-r.comps)/r.product.pack;}
export function currentPacks(stock:Stock,id:string,at:string){const anchor=[...stock.weeks].filter(w=>w.status==='closed'&&w.end<=at&&w.rows.some(r=>r.product.id===id)).sort((a,b)=>b.end.localeCompare(a.end))[0];if(!anchor)return null;const row=anchor.rows.find(r=>r.product.id===id)!,p=stock.products.find(p=>p.id===id)!;if(row.closing===null)return null;const inside=(time:string)=>time>=anchor.end&&time<=at;const delivered=(stock.deliveries??[]).filter(d=>d.product.id===id&&inside(d.at)).reduce((n,d)=>n+d.packs*d.product.pack,0);const sold=(stock.salesEntries??[]).filter(s=>inside(s.at)).reduce((n,s)=>n+s.quantity*s.item.ingredients.filter(i=>i.productId===id).reduce((a,i)=>a+i.quantity,0),0);return (row.closing+delivered-sold)/p.pack;}
export function orderSuggestions(week:Week){return week.rows.filter(r=>r.closing!==null&&r.product.active&&r.product.par>r.closing).map(r=>({id:r.product.id,name:r.product.name,supplier:r.product.supplier||'Unassigned',ideal:r.product.par/r.product.pack,counted:r.closing!/r.product.pack,order:Math.ceil((r.product.par-r.closing!)/r.product.pack)})).sort((a,b)=>a.supplier.localeCompare(b.supplier)||a.name.localeCompare(b.name));}

/** Revenue here belongs to linked till items; shared recipes are not additive across products. */
export function productPerformance(week:Week,id:string){
 if(week.baseline||(!week.salesConfirmed&&week.source!=='ledger'))return {sales:null,revenue:null,cogs:null};
 const p=week.rows.find(r=>r.product.id===id)!.product;let sales=0,revenue=0,cogs=0,unknown=false;
 for(const s of week.sales){const part=s.item.ingredients.find(i=>i.productId===id);if(!part)continue;sales+=s.quantity;cogs+=s.quantity*part.quantity*p.packCost/p.pack;if(s.quantity&&s.item.unitPrice===undefined)unknown=true;else revenue+=s.quantity*(s.item.unitPrice??0);}
 return {sales,revenue:unknown?null:revenue,cogs};
}
