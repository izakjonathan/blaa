import type {Query} from './content-store.ts';
import {orderSuggestions} from './stock-cycle.ts';
import type {Week} from './stock.ts';

export function stockMailConfig(){if(process.env.STOCK_ORDER_EMAIL_ENABLED!=='true')return null;const key=process.env.RESEND_API_KEY?.trim(),from=process.env.STOCK_ORDER_FROM?.trim(),to=process.env.STOCK_ORDER_TO?.trim();const address=/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;return key&&from&&to&&address.test(from)&&address.test(to)?{key,from,to}:null;}
const escape=(value:unknown)=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function orderMail(week:Week){return {id:week.id,end:week.end,rows:orderSuggestions(week)};}
export function orderHTML(payload:ReturnType<typeof orderMail>){return `<h2>Stock count · ${escape(payload.end.replace('T',' '))}</h2><p>Internal purchase suggestion. No order has been placed with a supplier. Quantities are whole purchase packs.</p><table><thead><tr><th>Supplier</th><th>Product</th><th>Ideal</th><th>Counted</th><th>Order</th></tr></thead><tbody>${payload.rows.map(r=>`<tr><td>${escape(r.supplier)}</td><td>${escape(r.name)}</td><td>${escape(r.ideal)}</td><td>${escape(Number(r.counted.toFixed(3)))}</td><td>${escape(r.order)}</td></tr>`).join('')}</tbody></table>`;}
export async function initStockMail(db:Query){await db`CREATE TABLE IF NOT EXISTS blaa_stock_order_mail(id text PRIMARY KEY,payload jsonb NOT NULL,status text NOT NULL DEFAULT 'pending',request jsonb,attempted_at timestamptz,provider_id text,error text NOT NULL DEFAULT '',sent_at timestamptz)`;}
export async function mailStatus(db:Query){const rows=await db`SELECT id,status,error,sent_at FROM blaa_stock_order_mail ORDER BY id LIMIT 100`;return {configured:Boolean(stockMailConfig()),jobs:rows};}
/** Provider deduplication is 24h. Older ambiguous attempts require manual review. */
export async function processStockMail(db:Query,config=stockMailConfig(),send:typeof fetch=fetch){
 if(!config)return;
 const pending=await db`SELECT id,payload FROM blaa_stock_order_mail WHERE status='pending' ORDER BY id LIMIT 3`;
 for(const job of pending){const payload=job.payload as ReturnType<typeof orderMail>;const request={from:config.from,to:[config.to],subject:`Stock order suggestion · ${payload.end.replace('T',' ')}`,html:orderHTML(payload)};
  const claimed=await db`UPDATE blaa_stock_order_mail SET request=COALESCE(request,${JSON.stringify(request)}::jsonb),attempted_at=COALESCE(attempted_at,now()) WHERE id=${job.id} AND status='pending' RETURNING request,attempted_at`;
  if(!claimed.length)continue;
  if(Date.now()-new Date(String(claimed[0].attempted_at)).getTime()>23*3600000){await db`UPDATE blaa_stock_order_mail SET status='review',error='Check provider delivery history before retrying an older attempt.' WHERE id=${job.id}`;continue;}
  try{const response=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${config.key}`,'Content-Type':'application/json','Idempotency-Key':`blaa-stock-count/${job.id}`},body:JSON.stringify(claimed[0].request),signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw Error(`Email service returned ${response.status}. Check sender verification and credentials.`);
   const data=await response.json();if(typeof data.id!=='string')throw Error('Email service did not acknowledge delivery.');
   await db`UPDATE blaa_stock_order_mail SET status='sent',provider_id=${data.id},sent_at=now(),error='' WHERE id=${job.id}`;
  }catch(error){await db`UPDATE blaa_stock_order_mail SET error=${error instanceof Error?error.message:'Email request failed.'} WHERE id=${job.id}`;}
 }
}
