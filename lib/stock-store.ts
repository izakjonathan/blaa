import {emptyStock,validateStock,checkStockChange,type Stock} from './stock.ts';
import {applyActivity} from './stock-cycle.ts';
import {initStockMail,orderMail} from './stock-mail.ts';
import type {Query} from './content-store.ts';
export async function initStock(db:Query){
 await initStockMail(db);
 await db`CREATE TABLE IF NOT EXISTS blaa_stock_state(id integer PRIMARY KEY,revision integer NOT NULL,document jsonb NOT NULL)`;
 await db`CREATE TABLE IF NOT EXISTS blaa_stock_audit(revision integer PRIMARY KEY,document jsonb NOT NULL,reason text NOT NULL,saved_at timestamptz NOT NULL DEFAULT now())`;
 await db`INSERT INTO blaa_stock_state(id,revision,document) VALUES(1,0,${JSON.stringify(emptyStock)}::jsonb) ON CONFLICT(id) DO NOTHING`;
}
export async function readStock(db:Query){const rows=await db`SELECT revision,document FROM blaa_stock_state WHERE id=1`;return {revision:Number(rows[0].revision),document:validateStock(rows[0].document)};}
export async function saveStock(db:Query,revision:number,document:Stock,reason:string){
 document=validateStock(document);
 const previous=await readStock(db);if(previous.revision!==revision)throw Error('CONFLICT: Stock data changed on another device. Export your edits, then reload before saving.');
 checkStockChange(previous.document,document,reason);
 for(const week of document.weeks.filter(w=>w.source==='ledger'&&w.status==='closed'&&!previous.document.weeks.some(old=>old.id===w.id&&old.status==='closed'))){
  const anchor=document.weeks.find(w=>w.status==='closed'&&w.end===week.start&&w.id!==week.id);
  if(week.baseline){if(document.weeks.some(w=>w.id!==week.id&&w.status==='closed'&&w.end<=week.end))throw Error('Invalid count: a baseline already exists.');continue;}
  if(!anchor)throw Error('Invalid count: previous finalized count is missing.');
  const expected=applyActivity(document,{...week,status:'draft'});
  if(JSON.stringify(expected.sales)!==JSON.stringify(week.sales)||week.rows.some(r=>{const e=expected.rows.find(x=>x.product.id===r.product.id)!,a=anchor.rows.find(x=>x.product.id===r.product.id);return r.opening!==(a?.closing??null)||Math.abs(r.deliveryPacks-e.deliveryPacks)>1e-8||r.deliveryLoose!==0||Math.abs(r.product.packCost-e.product.packCost)>1e-7;}))throw Error('Invalid count: refresh posted activity before finalizing.');
 }
 const orders=document.weeks.filter(w=>w.status==='closed'&&!previous.document.weeks.some(old=>old.id===w.id&&old.status==='closed')).map(orderMail).filter(o=>o.rows.length);
 const rows=await db`WITH changed AS (UPDATE blaa_stock_state SET revision=revision+1,document=${JSON.stringify(document)}::jsonb WHERE id=1 AND revision=${revision} RETURNING revision,document)
 ,audit AS (INSERT INTO blaa_stock_audit(revision,document,reason) SELECT revision,document,${reason} FROM changed RETURNING revision),
 mail AS (INSERT INTO blaa_stock_order_mail(id,payload) SELECT j.value->>'id',j.value FROM changed CROSS JOIN jsonb_array_elements(${JSON.stringify(orders)}::jsonb) AS j(value) ON CONFLICT(id) DO NOTHING RETURNING id) SELECT revision FROM audit`;
 if(!rows.length)throw Error('CONFLICT: Stock data changed on another device. Export your edits, then reload before saving.');return Number(rows[0].revision);
}
