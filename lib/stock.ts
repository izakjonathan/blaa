export type Product={id:string;name:string;sku:string;category:string;supplier:string;unit:'L'|'each'|'kg';pack:number;packCost:number;par:number;threshold:number;active:boolean};
export type Sale={id:string;name:string;sku:string;unitPrice?:number;ingredients:{productId:string;quantity:number}[]};
export type Count={product:Product;opening:number|null;closing:number|null;deliveryPacks:number;deliveryLoose:number;waste:number;comps:number;transfer:number;note:string};
export type Delivery={id:string;product:Product;at:string;packs:number;cost:number;reference:string};
export type SalesEntry={id:string;item:Sale;at:string;quantity:number};
export type Week={baseline?:boolean;source?:'ledger';id:string;start:string;end:string;status:'draft'|'closed';salesConfirmed:boolean;movementsConfirmed:boolean;note:string;rows:Count[];sales:{item:Sale;quantity:number}[]};
export type Stock={deliveries?:Delivery[];salesEntries?:SalesEntry[];products:Product[];sales:Sale[];weeks:Week[]};
export const emptyStock:Stock={products:[],sales:[],weeks:[]};
const obj=(v:unknown):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid stock object.');return v as Record<string,unknown>;};
const text=(v:unknown,max=200)=>{if(typeof v!=='string'||v.length>max)throw Error('Invalid stock text.');return v;};
const id=(v:unknown)=>{const s=text(v,80);if(!/^[a-z0-9-]+$/i.test(s))throw Error('Invalid stock id.');return s;};
const num=(v:unknown,min=0,max=10000000)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error('Invalid stock number.');return v;};
const bool=(v:unknown)=>{if(typeof v!=='boolean')throw Error('Invalid stock switch.');return v;};
function list<T>(v:unknown,fn:(value:unknown)=>T,max:number){if(!Array.isArray(v)||v.length>max)throw Error('Invalid stock list.');return v.map(fn);}
function unique<T extends{id:string}>(rows:T[]){if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Invalid duplicate stock id.');return rows;}
function product(v:unknown):Product{const p=obj(v),unit=text(p.unit);if(!['L','each','kg'].includes(unit))throw Error('Invalid stock unit.');const name=text(p.name);if(!name.trim())throw Error('Invalid empty product name.');return {id:id(p.id),name,sku:text(p.sku),category:text(p.category),supplier:text(p.supplier),unit:unit as Product['unit'],pack:num(p.pack,.0001),packCost:num(p.packCost),par:num(p.par),threshold:num(p.threshold,0,100),active:bool(p.active)};}
function sale(v:unknown):Sale{const s=obj(v);const ingredients=list(s.ingredients,value=>{const i=obj(value);return {productId:id(i.productId),quantity:num(i.quantity,.000001)};},40);if(!ingredients.length||new Set(ingredients.map(i=>i.productId)).size!==ingredients.length)throw Error('Invalid recipe ingredients.');const name=text(s.name);if(!name.trim())throw Error('Invalid empty till item name.');return {id:id(s.id),name,sku:text(s.sku),ingredients,...(s.unitPrice===undefined?{}:{unitPrice:num(s.unitPrice)})};}
export function validateStock(value:unknown):Stock{
 if(JSON.stringify(value).length>2900000)throw Error('Invalid stock document: document exceeds 2.9 MB; contact the maintainer to archive historical records.');
 const s=obj(value),products=unique(list(s.products,product,500)),sales=unique(list(s.sales,sale,1000));
 const known=new Map(products.map(p=>[p.id,p]));
 for(const item of sales)for(const part of item.ingredients)if(!known.has(part.productId))throw Error('Invalid unknown recipe product.');
 const weeks=unique(list(s.weeks,value=>{
  const w=obj(value),start=text(w.start),end=text(w.end);if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(start)||!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(end)||!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end))||new Date(start+'Z').toISOString().slice(0,16)!==start||new Date(end+'Z').toISOString().slice(0,16)!==end||start>=end)throw Error('Invalid stock period.');
  if(w.status!=='draft'&&w.status!=='closed')throw Error('Invalid stock period status.');
  const rows=list(w.rows,value=>{const r=obj(value),p=product(r.product);if(!known.has(p.id)||known.get(p.id)!.unit!==p.unit)throw Error('Invalid changed product unit.');return {product:p,opening:r.opening===null?null:num(r.opening),closing:r.closing===null?null:num(r.closing),deliveryPacks:num(r.deliveryPacks),deliveryLoose:num(r.deliveryLoose),waste:num(r.waste),comps:num(r.comps),transfer:num(r.transfer,-10000000),note:text(r.note,2000)};},500);
  if(new Set(rows.map(r=>r.product.id)).size!==rows.length)throw Error('Invalid duplicate count row.');
  const weekSales=list(w.sales,value=>{const row=obj(value),item=sale(row.item);for(const ingredient of item.ingredients)if(!rows.some(r=>r.product.id===ingredient.productId))throw Error('Invalid missing recipe count row.');return {item,quantity:num(row.quantity)};},1000);
  if(new Set(weekSales.map(r=>r.item.id)).size!==weekSales.length)throw Error('Invalid duplicate till item.');
  const week:Week={...(w.baseline===undefined?{}:{baseline:bool(w.baseline)}),...(w.source===undefined?{}:w.source==='ledger'?{source:'ledger' as const}:(()=>{throw Error('Invalid count source.');})()),id:id(w.id),start,end,status:w.status,salesConfirmed:bool(w.salesConfirmed),movementsConfirmed:bool(w.movementsConfirmed),note:text(w.note,4000),rows,sales:weekSales};
  if(week.status==='closed'&&weekIssues(week).length)throw Error('Invalid incomplete stock period.');return week;
 },260));
 const sorted=[...weeks].sort((a,b)=>a.start.localeCompare(b.start));for(let i=1;i<sorted.length;i++)if(sorted[i].start<sorted[i-1].end)throw Error('Invalid overlapping stock periods.');
 const stamp=(value:unknown)=>{const at=text(value);if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(at)||!Number.isFinite(Date.parse(at+'Z'))||new Date(at+'Z').toISOString().slice(0,16)!==at)throw Error('Invalid activity date.');return at;};
 const deliveries=s.deliveries===undefined?undefined:unique(list(s.deliveries,value=>{const d=obj(value),p=product(d.product);if(!known.has(p.id)||known.get(p.id)!.unit!==p.unit)throw Error('Invalid delivery product.');return {id:id(d.id),product:p,at:stamp(d.at),packs:num(d.packs,.000001),cost:num(d.cost),reference:text(d.reference)};},10000));
 const salesEntries=s.salesEntries===undefined?undefined:unique(list(s.salesEntries,value=>{const e=obj(value),item=sale(e.item);for(const part of item.ingredients)if(!known.has(part.productId))throw Error('Invalid sales product.');return {id:id(e.id),item,at:stamp(e.at),quantity:num(e.quantity)};},10000));
 return {products,sales,weeks,...(deliveries===undefined?{}:{deliveries}),...(salesEntries===undefined?{}:{salesEntries})};
}
export function rowReport(row:Count,week:Week){
 const delivered=row.deliveryPacks*row.product.pack+row.deliveryLoose;
 const actual=row.opening===null||row.closing===null?null:row.opening+delivered+row.transfer-row.closing;
 const theoretical=week.sales.reduce((sum,s)=>sum+s.quantity*s.item.ingredients.filter(i=>i.productId===row.product.id).reduce((n,i)=>n+i.quantity,0),0);
 const valid=actual!==null&&actual>=-1e-7&&week.salesConfirmed&&row.waste+row.comps<=actual+1e-7;
 const variance=valid?actual!-theoretical-row.waste-row.comps:null;
 const cost=row.product.packCost/row.product.pack;
 return {delivered,actual,theoretical,variance,cost,loss:variance===null?null:Math.max(0,variance)+row.waste,gain:variance===null?null:Math.max(0,-variance),percent:valid&&actual!>0?(Math.max(0,variance!)+row.waste)/actual!*100:null,order:row.closing===null?null:Math.ceil(Math.max(0,row.product.par-row.closing)/row.product.pack)};
}
export function weekIssues(week:Week){
 const issues:string[]=[];if(week.baseline){for(const row of week.rows)if(row.closing===null)issues.push(row.product.name+': closing count missing.');if(!week.rows.length)issues.push('Add products to this count.');return issues;}if(!week.movementsConfirmed)issues.push('Confirm deliveries, waste, complimentary usage and transfers are complete.');if(!week.rows.length)issues.push('Add products to this period.');if(!week.salesConfirmed)issues.push('Confirm that till sales cover the complete period, including zero sales.');
 for(const row of week.rows){const r=rowReport(row,week);if(row.opening===null||row.closing===null)issues.push(row.product.name+': opening/closing count missing.');if(r.actual!==null&&r.actual<-.0000001)issues.push(row.product.name+': closing stock exceeds available stock.');if(row.transfer!==0&&!row.note.trim())issues.push(row.product.name+': explain the transfer/return.');if(r.actual!==null&&r.actual>=0&&row.waste+row.comps>r.actual+.000001)issues.push(row.product.name+': waste and complimentary usage exceed actual usage.');}
 return issues;
}
export function summary(week:Week){
 let usageCost=0,lossCost=0,wasteCost=0,gainCost=0,stockValue=0,complete=0;
 const rows=week.rows.map(row=>({row,...rowReport(row,week)}));
 for(const r of rows){if(r.row.closing!==null)stockValue+=r.row.closing*r.cost;if(r.variance===null)continue;complete++;usageCost+=Math.max(0,r.actual!)*r.cost;lossCost+=r.loss!*r.cost;wasteCost+=r.row.waste*r.cost;gainCost+=r.gain!*r.cost;}
 return {rows,usageCost,lossCost,wasteCost,gainCost,stockValue,complete,total:rows.length,lossPercent:usageCost>0?lossCost/usageCost*100:null,wastePercent:usageCost>0?wasteCost/usageCost*100:null};
}
export function newWeek(stock:Stock,start:string,end:string,id:string):Week{
 const previous=[...stock.weeks].filter(w=>w.status==='closed'&&w.end===start).at(-1);
 const products=stock.products.filter(p=>p.active||stock.sales.some(s=>s.ingredients.some(i=>i.productId===p.id)));
 return {id,start,end,status:'draft',salesConfirmed:false,movementsConfirmed:false,note:'',rows:products.map(p=>({product:structuredClone(p),opening:previous?.rows.find(r=>r.product.id===p.id)?.closing??null,closing:null,deliveryPacks:0,deliveryLoose:0,waste:0,comps:0,transfer:0,note:''})),sales:stock.sales.map(item=>({item:structuredClone(item),quantity:0}))};
}
/** Closed periods are immutable unless explicitly reopened with an audit reason. */
export function checkStockChange(previous:Stock,next:Stock,reason:string){
 const nextProducts=new Map(next.products.map(p=>[p.id,p]));
 for(const p of previous.products){if(!nextProducts.has(p.id))throw Error('Invalid removal: archive products instead.');if(p.unit!==nextProducts.get(p.id)!.unit&&(previous.weeks.some(w=>w.rows.some(r=>r.product.id===p.id))||previous.deliveries?.some(d=>d.product.id===p.id)||previous.salesEntries?.some(e=>e.item.ingredients.some(i=>i.productId===p.id))))throw Error('Invalid change: create a new product for a different base unit.');}
 const cutoff=[...previous.weeks].filter(w=>w.status==='closed').sort((a,b)=>b.end.localeCompare(a.end))[0]?.end;
 for(const key of ['deliveries','salesEntries'] as const){for(const old of previous[key]??[]){const nextEntry=next[key]?.find(e=>e.id===old.id);if(cutoff&&old.at<cutoff&&(!nextEntry||JSON.stringify(nextEntry)!==JSON.stringify(old)))throw Error('Invalid change: activity before a finalized count is immutable.');}for(const entry of next[key]??[])if(!previous[key]?.some(e=>e.id===entry.id)&&cutoff&&entry.at<cutoff)throw Error('Invalid activity: date is before the latest finalized count.');}
 for(const old of previous.weeks){const changed=next.weeks.find(w=>w.id===old.id);if(!changed)throw Error('Invalid removal: periods must remain in history.');if(old.status==='closed'&&JSON.stringify(old)!==JSON.stringify(changed)){if(changed.status==='draft'&&previous.weeks.some(w=>w.id!==old.id&&w.status==='closed'&&w.start>=old.end))throw Error('Invalid change: reopen the latest finalized count first.');if(changed.status!=='draft'||!reason.trim())throw Error('Invalid change: reopen a closed period with a reason first.');const copy={...changed,status:'closed'};if(JSON.stringify(copy)!==JSON.stringify(old))throw Error('Invalid change: reopen before editing period data.');}}
}
