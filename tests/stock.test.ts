import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {validateStock,newWeek,rowReport,summary,weekIssues,checkStockChange,type Stock,type Product} from '../lib/stock.ts';
import {initStock,readStock,saveStock} from '../lib/stock-store.ts';
import type {Query} from '../lib/content-store.ts';
const product:Product={id:'beer',name:'Beer',sku:'123',category:'Beer',supplier:'Supplier',unit:'L',pack:30,packCost:600,par:60,threshold:5,active:true};
function sample():Stock{const stock:Stock={products:[structuredClone(product)],sales:[{id:'pint',name:'Beer 0.5L',sku:'1',ingredients:[{productId:'beer',quantity:.5}]}],weeks:[]};const week=newWeek(stock,'2026-11-02T04:00','2026-11-09T04:00','week1');week.salesConfirmed=true;week.movementsConfirmed=true;week.rows[0]={...week.rows[0],opening:30,closing:10,deliveryPacks:1,waste:2,comps:3};week.sales[0].quantity=80;stock.weeks.push(week);return stock;}
test('packs and portions reconcile actual usage, recorded waste and unexplained losses',()=>{
 const stock=sample(),week=stock.weeks[0],r=rowReport(week.rows[0],week);
 assert.equal(r.actual,50);assert.equal(r.delivered,30);assert.equal(r.theoretical,40);assert.equal(r.variance,5);assert.equal(r.loss,7);assert.ok(Math.abs(r.percent!-14)<1e-9);assert.equal(r.order,2);
 const s=summary(week);assert.equal(s.wastePercent,4);assert.ok(Math.abs(s.lossPercent!-14)<1e-9);assert.equal(s.lossCost,140);assert.equal(s.stockValue,200);assert.equal(s.usageCost,1000);
});
test('missing counts, missing sales and zero consumption never manufacture zero-waste results',()=>{
 const stock=sample(),w=stock.weeks[0];w.rows[0].closing=null;assert.equal(rowReport(w.rows[0],w).variance,null);assert.equal(summary(w).lossPercent,null);assert.ok(weekIssues(w).length);
 w.rows[0].closing=60;w.rows[0].waste=0;w.rows[0].comps=0;assert.equal(rowReport(w.rows[0],w).actual,0);assert.equal(rowReport(w.rows[0],w).percent,null);
 w.salesConfirmed=false;assert.equal(summary(w).complete,0);w.status='closed';assert.throws(()=>validateStock(stock),/incomplete/);
});
test('overcounts and inconsistent waste are flagged and stock gains do not offset losses',()=>{
 const w=sample().weeks[0];w.rows[0].closing=100;assert.ok(weekIssues(w).some(s=>s.includes('exceeds')));assert.equal(rowReport(w.rows[0],w).variance,null);
 w.rows[0].closing=50;w.rows[0].waste=20;assert.ok(weekIssues(w).some(s=>s.includes('exceed actual')));assert.equal(summary(w).complete,0);
 const stock=sample(),week=stock.weeks[0];const other={...structuredClone(week.rows[0]),product:{...product,id:'wine',name:'Wine'},opening:30,closing:30,deliveryPacks:0,waste:0,comps:0};week.rows.push(other);week.sales.push({item:{id:'wineglass',name:'Wine',sku:'',ingredients:[{productId:'wine',quantity:1}]},quantity:10});const report=summary(week);assert.equal(report.lossCost,140);assert.equal(report.gainCost,200);
});
test('rates are weighted by cost rather than mixing litres and units',()=>{
 const week=sample().weeks[0];week.rows.push({product:{...product,id:'bottle',unit:'each',pack:1,packCost:10},opening:10,closing:0,deliveryPacks:0,deliveryLoose:0,waste:1,comps:0,transfer:0,note:''});week.sales.push({item:{id:'bottlesale',name:'Bottle',sku:'',ingredients:[{productId:'bottle',quantity:1}]},quantity:9});const r=summary(week);assert.equal(r.usageCost,1100);assert.equal(r.lossCost,150);assert.equal(r.wasteCost,50);
});
test('contiguous closed counts carry forward while snapshots and gaps are preserved',()=>{
 const stock=sample();stock.weeks[0].status='closed';stock.products[0].packCost=999;
 const next=newWeek(stock,'2026-11-09T04:00','2026-11-16T04:00','week2');assert.equal(next.rows[0].opening,10);assert.equal(next.rows[0].product.packCost,999);assert.equal(stock.weeks[0].rows[0].product.packCost,600);
 const gap=newWeek(stock,'2026-11-10T04:00','2026-11-17T04:00','week3');assert.equal(gap.rows[0].opening,null);
});
test('validation rejects overlapping periods, invalid dates, unknown recipes and changed base units',()=>{
 const stock=sample();assert.deepEqual(validateStock(stock),stock);
 for(const mutate of [(s:Stock)=>s.weeks.push({...structuredClone(s.weeks[0]),id:'overlap'}),(s:Stock)=>s.weeks[0].start='2026-02-30T04:00',(s:Stock)=>s.sales[0].ingredients[0].productId='unknown',(s:Stock)=>s.products[0].unit='each',(s:Stock)=>s.weeks[0].rows[0].closing=-1]){const next=structuredClone(stock);mutate(next);assert.throws(()=>validateStock(next));}
});
test('closed weeks cannot be rewritten or deleted and reopening needs an explicit reason',()=>{
 const stock=sample();stock.weeks[0].status='closed';const next=structuredClone(stock);next.weeks[0].rows[0].closing=5;assert.throws(()=>checkStockChange(stock,next,'Correction'));
 next.weeks[0]=structuredClone(stock.weeks[0]);next.weeks[0].status='draft';assert.throws(()=>checkStockChange(stock,next,''));assert.doesNotThrow(()=>checkStockChange(stock,next,'Recount requested'));
 assert.throws(()=>checkStockChange(stock,{...stock,weeks:[]},'Delete'));
});
test('stock saves are atomic, audited and reject concurrent revisions',async()=>{
 const db=new PGlite();const query:Query=async(strings,...values)=>{const sql=strings.reduce((out,s,i)=>out+(i?'$'+i:'')+s,'');return (await db.query(sql,values)).rows as Record<string,unknown>[];};
 try{await initStock(query);const state=await readStock(query);assert.equal(state.revision,0);const stock=sample();assert.equal(await saveStock(query,0,stock,'First count'),1);await assert.rejects(()=>saveStock(query,0,stock,'Stale'),/CONFLICT/);const audit=await db.query('SELECT revision,document,reason FROM blaa_stock_audit');assert.equal(audit.rows.length,1);assert.equal((audit.rows[0] as {reason:string}).reason,'First count');stock.weeks[0].status='closed';await saveStock(query,1,stock,'Closed');const invalid=structuredClone(stock);invalid.weeks[0].rows[0].closing=0;await assert.rejects(()=>saveStock(query,2,invalid,'Edit'),/reopen/);assert.equal((await readStock(query)).revision,2);}finally{await db.close();}
});
