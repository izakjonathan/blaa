'use client';
import {useState} from 'react';
import type {Product} from '../../../lib/stock';
import {newProduct,purchaseSizes,purchaseSize,packDescription,productProblems,packsToUnits,unitsToPacks} from '../../../lib/stock-product';

const price=(value:number)=>new Intl.NumberFormat('da-DK',{style:'currency',currency:'DKK',maximumFractionDigits:2}).format(value);
function ProductFields({product:p,change,locked=false,isNew=false}:{product:Product;change:(patch:Partial<Product>)=>void;locked?:boolean;isNew?:boolean}){
 const [custom,setCustom]=useState(false);
 const preset=purchaseSize(p),other=custom||!preset;
 const number=(label:string,value:number,apply:(value:number)=>void,min=0,max=10000000)=><label>{label}<input type="number" inputMode="decimal" step="any" min={min} max={max} value={value||''} onChange={e=>apply(e.target.value===''?0:e.target.valueAsNumber)}/></label>;
 return <>
  <div className="stock-product-fields">
   <label>Product name<input autoFocus={isNew} value={p.name} maxLength={200} placeholder="e.g. Carlsberg Pilsner" onChange={e=>change({name:e.target.value})}/></label>
   <label>Purchase pack<select value={other?'custom':preset!.id} onChange={e=>{if(e.target.value==='custom'){setCustom(true);return;}const size=purchaseSizes.find(s=>s.id===e.target.value);if(size){setCustom(false);change({unit:size.unit,pack:size.pack});}}}>{purchaseSizes.map(s=><option key={s.id} value={s.id} disabled={locked&&s.unit!==p.unit}>{s.label}</option>)}<option value="custom">Other size</option></select></label>
   {other&&<><label>Measure stock in<select disabled={locked} value={p.unit} onChange={e=>change({unit:e.target.value as Product['unit']})}><option value="each">Items</option><option value="L">Litres</option><option value="kg">Kilograms</option></select></label>{number(p.unit==='each'?'Items in one pack':p.unit==='L'?'Litres in one pack':'Kilograms in one pack',p.pack,pack=>change({pack}),.0001)}</>}
   {number('Price per purchase pack (DKK)',p.packCost,packCost=>change({packCost}))}
  </div>
  <p className="stock-product-help">One purchase pack = {packDescription(p).toLowerCase()}. Price is optional; add it for loss values in DKK. Exclude refundable deposits.</p>
  <details className="stock-product-options"><summary>Optional details</summary><div className="stock-product-fields">
   <label>Category<input value={p.category} maxLength={200} placeholder="e.g. Beer" onChange={e=>change({category:e.target.value})}/></label>
   <label>Supplier<input value={p.supplier} maxLength={200} onChange={e=>change({supplier:e.target.value})}/></label>
   <label>Product code<input value={p.sku} maxLength={200} onChange={e=>change({sku:e.target.value})}/></label>
   {number('Target stock (purchase packs)',p.pack>0?unitsToPacks(p,p.par):0,value=>change({par:packsToUnits(p,value)}))}
   {number('Loss alert (%)',p.threshold,threshold=>change({threshold}),0,100)}
  </div><p>Target stock helps suggest orders. Leave it blank if you do not need this. Loss alerts start at 5%.</p>
  {!isNew&&<label><input type="checkbox" checked={p.active} onChange={e=>change({active:e.target.checked})}/> Active product</label>}
  </details>
  {!isNew&&!p.active&&<small>Inactive products still appear in new counts if a till item uses them. Remove that till connection to stop counting them.</small>}
  {locked&&<small>Stock measure is locked because this product has been counted. Changes to sizes and prices apply to new periods.</small>}
 </>;
}
export default function Products({products,usedIds,draft,setDraft,onAdd,onChange}:{products:Product[];usedIds:Set<string>;draft:Product|null;setDraft:(draft:Product|null)=>void;onAdd:(product:Product)=>void;onChange:(id:string,patch:Partial<Product>)=>void}){
 const [search,setSearch]=useState(''),[archived,setArchived]=useState(false),[error,setError]=useState('');
 const visible=products.filter(p=>(archived||p.active)&&`${p.name} ${p.category} ${p.supplier} ${p.sku}`.toLowerCase().includes(search.toLowerCase()));
 return <section aria-labelledby="stock-products-title">
  <div className="stock-section-heading"><div><h2 id="stock-products-title">Products</h2><p>Add what you buy. You can connect it to till sales below.</p></div>{!draft&&<button className="stock-primary" onClick={()=>{setError('');setDraft(newProduct(crypto.randomUUID()));}}>Add product</button>}</div>
  {draft&&<section className="stock-product-create" aria-labelledby="stock-new-product"><h3 id="stock-new-product">New product</h3><ProductFields key={draft.id} product={draft} isNew change={patch=>{setError('');setDraft({...draft,...patch});}}/>{error&&<p role="alert">{error}</p>}<div className="stock-product-actions"><button className="stock-primary" onClick={()=>{const problems=productProblems(draft);if(problems.length){setError(problems.join(' '));return;}onAdd({...draft,name:draft.name.trim()});setDraft(null);setSearch('');setError('');}}>Add to products</button><button onClick={()=>{setDraft(null);setError('');}}>Cancel</button></div><small>Added products are saved with Save changes at the top.</small></section>}
  {products.length>0&&<div className="stock-product-search"><label>Find a product<input type="search" placeholder="Search name, category or supplier" value={search} onChange={e=>setSearch(e.target.value)}/></label><label><input type="checkbox" checked={archived} onChange={e=>setArchived(e.target.checked)}/> Show inactive products</label></div>}
  {!products.length&&!draft&&<p>No products yet. Start with one bottle, keg, case or other item you buy.</p>}
  {products.length>0&&!visible.length&&<p>No matching products. Try another search or show inactive products.</p>}
  {visible.map(p=><details className="stock-product-row" key={p.id}><summary><span>{p.name}{p.active?'':' · Inactive'}</span><small>{packDescription(p)} · {p.packCost?price(p.packCost):'Price not set'}</small></summary><ProductFields product={p} locked={usedIds.has(p.id)} change={patch=>onChange(p.id,patch)}/>{productProblems(p).length>0&&<p role="alert">{productProblems(p).join(' ')}</p>}</details>)}
 </section>;
}
