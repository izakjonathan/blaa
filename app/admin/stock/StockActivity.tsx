'use client';
import {useState} from 'react';
import type {Stock} from '../../../lib/stock';
import {stockNow} from '../../../lib/stock-cycle';
import PeriodTime from './PeriodTime';

export default function StockActivity({stock,onChange,onDraft}:{stock:Stock;onChange:(stock:Stock)=>void;onDraft:(dirty:boolean)=>void}){
 const [kind,setKind]=useState('delivery'),[selected,setSelected]=useState(''),[at,setAt]=useState(stockNow),[quantity,setQuantity]=useState(''),[cost,setCost]=useState(''),[reference,setReference]=useState(''),[error,setError]=useState('');
 const product=stock.products.find(p=>p.id===selected)??stock.products.find(p=>p.active),item=stock.sales.find(s=>s.id===selected)??stock.sales[0];
 const cutoff=[...stock.weeks].filter(w=>w.status==='closed').sort((a,b)=>b.end.localeCompare(a.end))[0]?.end;
 const clear=()=>{setQuantity('');setCost('');setReference('');setError('');onDraft(false);};
 const logs=[...(stock.deliveries??[]).map(d=>({id:d.id,at:d.at,label:`Delivery · ${d.product.name} · ${d.packs} packs`,kind:'delivery'})),...(stock.salesEntries??[]).map(e=>({id:e.id,at:e.at,label:`Till sales · ${e.item.name} · ${e.quantity}`,kind:'sale'}))].sort((a,b)=>b.at.localeCompare(a.at)).slice(0,40);
 return <section><h2>Deliveries & till sales</h2><p>Post activity as it happens. Sales are quantities from your till report, not individual transactions. There is no automatic POS connection.</p>
  <div className="stock-product-actions"><button aria-pressed={kind==='delivery'} onClick={()=>{setKind('delivery');setSelected('');clear();}}>Delivery</button><button aria-pressed={kind==='sale'} onClick={()=>{setKind('sale');setSelected('');clear();}}>Till sales</button></div>
  <form className="stock-activity-form" onChangeCapture={()=>onDraft(true)} onSubmit={e=>{e.preventDefault();try{
   if(!at||quantity==='')throw Error('Enter a date, time and quantity.');if(cutoff&&at<cutoff)throw Error('Activity must be at or after the latest finalized count.');
   const qty=Number(quantity);if(!Number.isFinite(qty)||qty<0||(kind==='delivery'&&qty===0))throw Error('Enter a valid quantity.');
   if(kind==='delivery'){if(!product)throw Error('Add a product first.');const price=cost===''?product.packCost:Number(cost);if(!Number.isFinite(price)||price<0)throw Error('Enter a valid pack cost.');onChange({...stock,deliveries:[...(stock.deliveries??[]),{id:crypto.randomUUID(),product:structuredClone(product),at,packs:qty,cost:price,reference}]});}
   else{if(!item)throw Error('Add a till item inside a product first.');if(item.ingredients.some(i=>i.quantity<=0))throw Error('Complete this till item’s serving size first.');onChange({...stock,salesEntries:[...(stock.salesEntries??[]),{id:crypto.randomUUID(),item:structuredClone(item),at,quantity:qty}]});}clear();
  }catch(error){setError((error as Error).message);}}}>
   <div className="stock-product-fields"><label>{kind==='delivery'?'Product':'Till item'}<select value={kind==='delivery'?product?.id??'':item?.id??''} onChange={e=>{setSelected(e.target.value);setCost('');}}>{kind==='delivery'?stock.products.filter(p=>p.active).map(p=><option key={p.id} value={p.id}>{p.name}</option>):stock.sales.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   <label>{kind==='delivery'?'Packs received':'Quantity sold'}<input type="number" inputMode="decimal" min={kind==='delivery'?.000001:0} max={10000000} step="any" required value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
   {kind==='delivery'&&<><label>Cost per pack (DKK)<input type="number" inputMode="decimal" min={0} step="any" placeholder={String(product?.packCost??0)} value={cost} onChange={e=>setCost(e.target.value)}/></label><label>Delivery reference (optional)<input maxLength={200} value={reference} onChange={e=>setReference(e.target.value)}/></label></>}
   </div><PeriodTime label="Activity time (Copenhagen)" value={at} onChange={setAt}/>
   {error&&<p role="alert">{error}</p>}<div className="stock-product-actions"><button className="stock-primary" type="submit">Add {kind==='delivery'?'delivery':'sales'}</button><button type="button" onClick={clear}>Clear</button></div><small>Use Save to post these records. Refresh an open count after adding or changing activity.</small>
  </form>
  <h3>Recent activity</h3>{!logs.length&&<p>No activity posted yet.</p>}<ul className="stock-audit">{logs.map(log=><li key={log.id}>{log.label}<small>{log.at.replace('T',' ')}</small>{(!cutoff||log.at>=cutoff)&&<button onClick={()=>{if(!window.confirm('Remove this activity entry? Refresh any open count afterwards.'))return;onChange(log.kind==='delivery'?{...stock,deliveries:stock.deliveries?.filter(d=>d.id!==log.id)}:{...stock,salesEntries:stock.salesEntries?.filter(s=>s.id!==log.id)});}}>Remove entry</button>}</li>)}</ul>
 </section>;
}
