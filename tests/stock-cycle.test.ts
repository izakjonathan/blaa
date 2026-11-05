import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {validateStock,weekIssues,rowReport,checkStockChange,type Stock} from '../lib/stock.ts';
import {newCount,applyActivity,countFinancials,expectedPacks,currentPacks,orderSuggestions} from '../lib/stock-cycle.ts';
import {initStock,saveStock,readStock} from '../lib/stock-store.ts';
import {processStockMail,orderHTML,orderMail} from '../lib/stock-mail.ts';
import type {Query} from '../lib/content-store.ts';
function fixture():Stock{
 const p={id:'hancock',name:'Hancock Pilsner',unit:'L' as const,pack:20,packCost:600,par:140,threshold:5,active:true,sku:'',category:'Tap beer',supplier:'Hancock'};
 const large={id:'large',name:'Beer 0.4L',sku:'1',unitPrice:55,ingredients:[{productId:p.id,quantity:.4}]},small={id:'small',name:'Beer 0.25L',sku:'2',unitPrice:40,ingredients:[{productId:p.id,quantity:.25}]};
 const s:Stock={products:[p],sales:[large,small],weeks:[],deliveries:[],salesEntries:[]};
 const baseline=newCount(s,'2026-11-01T04:00','baseline');baseline.rows[0].closing=140;baseline.status='closed';s.weeks.push(baseline);
 s.deliveries!.push({id:'delivery',product:structuredClone(p),at:'2026-11-02T12:00',packs:2,cost:660,reference:'INV-1'});
 s.salesEntries!.push({id:'sales-large',item:structuredClone(large),at:'2026-11-03T03:00',quantity:100},{id:'sales-small',item:structuredClone(small),at:'2026-11-03T03:00',quantity:50});return s;
}
test('baseline counts establish stock without pretending sales or opening stock are zero',()=>{
 const s=fixture(),w=s.weeks[0];assert.deepEqual(weekIssues(w),[]);assert.equal(rowReport(w.rows[0],w).actual,null);assert.equal(countFinancials(w).revenue,null);assert.equal(currentPacks(s,'hancock','2026-11-01T05:00'),7);assert.deepEqual(validateStock(s),s);
 const missing=structuredClone(w);missing.rows[0].closing=null;assert.ok(weekIssues(missing).length);
});
test('all PLU sizes, deliveries and weighted costs feed the next count, COGS and reorder',()=>{
 const s=fixture(),w=newCount(s,'2026-11-08T04:00','count');assert.equal(countFinancials(w).revenue,7500);w.rows[0].closing=120;w.salesConfirmed=true;w.movementsConfirmed=true;
 assert.equal(w.rows[0].opening,140);assert.equal(w.rows[0].deliveryPacks,2);assert.equal(rowReport(w.rows[0],w).theoretical,52.5);assert.equal(rowReport(w.rows[0],w).actual,60);
 assert.equal(expectedPacks(w,'hancock'),6.375);assert.equal(countFinancials(w).sales,150);assert.equal(countFinancials(w).revenue,7500);assert.ok(Math.abs(countFinancials(w).cogs!-1610)<1e-7);
 assert.deepEqual(orderSuggestions(w).map(r=>r.order),[1]);assert.equal(currentPacks(s,'hancock','2026-11-04T04:00'),6.375);
 w.rows[0].closing=111;assert.equal(orderSuggestions(w)[0].order,2);
});
test('cycle boundaries exclude activity at the ending minute; refresh is repeatable and keeps physical counts',()=>{
 const s=fixture();s.deliveries!.push({...s.deliveries![0],id:'next-cycle',at:'2026-11-08T04:00',packs:10});
 const w=newCount(s,'2026-11-08T04:00','count');w.rows[0].closing=120;
 const refreshed=applyActivity(s,w),again=applyActivity(s,refreshed);assert.equal(refreshed.rows[0].deliveryPacks,2);assert.equal(refreshed.rows[0].closing,120);assert.deepEqual(again,refreshed);assert.equal(refreshed.salesConfirmed,false);
 const incomplete={...w,sales:w.sales.map((s,i)=>i?{...s,item:{...s.item,unitPrice:undefined}}:s),salesConfirmed:true};assert.equal(countFinancials(incomplete).revenue,null);
});
test('price changes retain separate snapshots and finalized activity cannot silently change',()=>{
 const s=fixture();s.salesEntries!.push({...s.salesEntries![0],id:'discounted',item:{...s.salesEntries![0].item,unitPrice:50},quantity:10});const w=newCount(s,'2026-11-08T04:00','count');w.rows[0].closing=100;w.salesConfirmed=true;w.movementsConfirmed=true;w.status='closed';s.weeks.push(w);
 assert.equal(w.sales.length,3);assert.equal(countFinancials(w).revenue,8000);
 const changedUnit=structuredClone(s);changedUnit.products[0].unit='each';assert.throws(()=>checkStockChange(s,changedUnit,'Unit change'),/base unit/);
 const next=structuredClone(s);next.deliveries![0].packs=9;assert.throws(()=>checkStockChange(s,next,'Edit'),/immutable/);
});
test('count, revision and order outbox commit together; retry uses the same email key and payload',async()=>{
 const db=new PGlite(),query:Query=async(strings,...values)=>(await db.query(strings.reduce((s,part,i)=>s+(i?'$'+i:'')+part,''),values)).rows as Record<string,unknown>[];
 try{
  await initStock(query);const s=fixture();await saveStock(query,0,s,'Baseline and activity');
  const count=newCount(s,'2026-11-08T04:00','count');count.rows[0].closing=120;count.salesConfirmed=true;count.movementsConfirmed=true;count.status='closed';s.weeks.push(count);
  const stale=structuredClone(s);stale.deliveries![0].packs=3;await assert.rejects(()=>saveStock(query,1,stale,'Stale activity'),/refresh posted activity/);assert.equal((await readStock(query)).revision,1);
  await saveStock(query,1,s,'Finalize count');assert.equal((await db.query('SELECT * FROM blaa_stock_order_mail')).rows.length,1);
  const calls:{key:string;body:string}[]=[];let fail=true;const send:typeof fetch=async(_url,init)=>{calls.push({key:(init!.headers as Record<string,string>)['Idempotency-Key'],body:String(init!.body)});if(fail)throw Error('Timeout');return Response.json({id:'email-id'});};
  const config={key:'test-only',from:'stock@example.com',to:'manager@example.com'};await processStockMail(query,config,send);fail=false;await processStockMail(query,config,send);assert.deepEqual(calls[0],calls[1]);await processStockMail(query,config,send);assert.equal(calls.length,2);assert.equal((await readStock(query)).revision,2);
  const reopened=structuredClone(s);reopened.weeks[1].status='draft';await saveStock(query,2,reopened,'Recount');await saveStock(query,3,s,'Finalize again');assert.equal((await db.query('SELECT * FROM blaa_stock_order_mail')).rows.length,1);
  await db.exec("UPDATE blaa_stock_order_mail SET status='pending',attempted_at=now()-interval '25 hours'");await processStockMail(query,config,send);assert.equal(calls.length,2);assert.equal((await db.query<{status:string}>('SELECT status FROM blaa_stock_order_mail')).rows[0].status,'review');
  const next=structuredClone(s),following=newCount(next,'2026-11-15T04:00','next-count');following.rows[0].closing=100;following.salesConfirmed=true;following.movementsConfirmed=true;following.status='closed';next.weeks.push(following);await db.exec("ALTER TABLE blaa_stock_order_mail ADD CONSTRAINT reject_second CHECK(id <> 'next-count')");await assert.rejects(()=>saveStock(query,4,next,'Transaction rollback'),/reject_second/);assert.equal((await readStock(query)).revision,4);
 }finally{await db.close();}
});
test('email markup escapes product and supplier data',()=>{
 const s=fixture(),w=newCount(s,'2026-11-08T04:00','count');w.rows[0].closing=100;w.rows[0].product.name='<script>bad</script>';w.rows[0].product.supplier='A&B';const html=orderHTML(orderMail(w));assert.ok(!html.includes('<script>'));assert.ok(html.includes('A&amp;B'));
});
