'use client';
import {useState} from 'react';
import type {Product,Sale} from '../../../lib/stock';
import {newProduct,purchaseSizes,purchaseSize,packDescription,productProblems,packsToUnits,unitsToPacks} from '../../../lib/stock-product';

import TillItems from './TillItems';
import {servingUnit,storedAmount} from '../../../lib/stock-till';

const price=(value:number)=>new Intl.NumberFormat('da-DK',{style:'currency',currency:'DKK',maximumFractionDigits:2}).format(value);
function ProductFields({product:p,change,locked=false,isNew=false}:{product:Product;change:(patch:Partial<Product>)=>void;locked?:boolean;isNew?:boolean}){
 const [custom,setCustom]=useState(false);
 const preset=purchaseSize(p),other=custom||!preset;
 const number=(label:string,value:number,apply:(value:number)=>void,min=0,max=10000000)=><label>{label}<input type="number" inputMode="decimal" step="any" min={min} max={max} value={value||''} onChange={e=>apply(e.target.value===''?0:e.target.valueAsNumber)}/></label>;
 return <>
  <div className="stock-product-fields">
   <label className="stock-field-name">Product name<input autoComplete="off" autoFocus={isNew} value={p.name} maxLength={200} placeholder="e.g. Carlsberg Pilsner" onChange={e=>change({name:e.target.value})}/></label>
   <label>Purchase pack<select value={other?'custom':preset!.id} onChange={e=>{if(e.target.value==='custom'){setCustom(true);return;}const size=purchaseSizes.find(s=>s.id===e.target.value);if(size){setCustom(false);change({unit:size.unit,pack:size.pack,par:p.pack>0?p.par/p.pack*size.pack:0});}}}>{purchaseSizes.map(s=><option key={s.id} value={s.id} disabled={locked&&s.unit!==p.unit}>{s.label}</option>)}<option value="custom">Other size</option></select></label>
   {other&&<><label>Measure stock in<select disabled={locked} value={p.unit} onChange={e=>change({unit:e.target.value as Product['unit']})}><option value="each">Items</option><option value="L">Litres</option><option value="kg">Kilograms</option></select></label>{number(p.unit==='each'?'Items in one pack':p.unit==='L'?'Litres in one pack':'Kilograms in one pack',p.pack,pack=>change({pack,par:p.pack>0?p.par/p.pack*pack:0}),.0001)}</>}
   {number('Price per purchase pack (DKK)',p.packCost,packCost=>change({packCost}))}
   <label>Product type<input value={p.category} maxLength={200} placeholder="e.g. Tap beer" onChange={e=>change({category:e.target.value})}/></label>
   <label>Supplier<input value={p.supplier} maxLength={200} onChange={e=>change({supplier:e.target.value})}/></label>
   {number('Ideal stock (purchase packs)',p.pack>0?unitsToPacks(p,p.par):0,value=>change({par:packsToUnits(p,value)}))}

  </div>
  <p className="stock-product-help">One purchase pack = {packDescription(p).toLowerCase()}. Price is optional; add it for loss values in DKK. Exclude refundable deposits.</p>
  <details className="stock-product-options"><summary>Optional details</summary><div className="stock-product-fields">
   <label>Product code<input value={p.sku} maxLength={200} onChange={e=>change({sku:e.target.value})}/></label>
   {number('Loss alert (%)',p.threshold,threshold=>change({threshold}),0,100)}
  </div><p>Loss alerts start at 5%. Ideal stock above controls order suggestions; use zero to disable ordering for this product.</p>
  {!isNew&&<label><input type="checkbox" checked={p.active} onChange={e=>change({active:e.target.checked})}/> Active product</label>}
  </details>
  {!isNew&&!p.active&&<small>Inactive products still appear in new counts if a till item uses them. Remove that till connection to stop counting them.</small>}
  {locked&&<small>Stock measure is locked because this product has counts or posted activity. Changes to sizes and prices apply to new periods.</small>}
 </>;
}
export default function Products({products,usedIds,draft,setDraft,onAdd,onChange,sales,onAddSale,onChangeSale,onRemoveSale}:{products:Product[];usedIds:Set<string>;draft:Product|null;setDraft:(draft:Product|null)=>void;onAdd:(product:Product,sale?:Sale)=>void;onChange:(id:string,patch:Partial<Product>)=>void;sales:Sale[];onAddSale:(sale:Sale)=>void;onChangeSale:(id:string,patch:Partial<Sale>)=>void;onRemoveSale:(id:string)=>void}){
 const [search,setSearch]=useState(''),[archived,setArchived]=useState(false),[error,setError]=useState(''),[expanded,setExpanded]=useState<string|null>(null);
 const [createPlu,setCreatePlu]=useState(false),[pluName,setPluName]=useState(''),[pluAmount,setPluAmount]=useState(''),[pluPrice,setPluPrice]=useState('');
 const visible=products.filter(p=>(archived||p.active)&&`${p.name} ${p.category} ${p.supplier} ${p.sku}`.toLowerCase().includes(search.toLowerCase()));
 return <section aria-labelledby="stock-products-title">
  <div className="stock-section-heading"><div><h2 id="stock-products-title">Products</h2><p>Add what you buy. Open a product to edit its details and connect till items.</p></div>{!draft&&<button className="stock-primary" onClick={()=>{setError('');setCreatePlu(false);setPluName('');setPluAmount('');setPluPrice('');setDraft(newProduct(crypto.randomUUID()));}}>Add product</button>}</div>
  {draft&&<section className="stock-product-create" aria-labelledby="stock-new-product"><h3 id="stock-new-product">New product</h3><ProductFields key={draft.id} product={draft} isNew change={patch=>{setError('');setDraft({...draft,...patch});}}/><section className="stock-new-plu"><label><input type="checkbox" checked={createPlu} onChange={e=>setCreatePlu(e.target.checked)}/> Create a matching PLU / till item</label>{createPlu&&<div className="stock-product-fields"><label>Name on till<input value={pluName} placeholder={draft.name||'Same as product'} maxLength={200} onChange={e=>setPluName(e.target.value)}/></label><label>Serving size ({servingUnit(draft)})<input type="number" inputMode="decimal" min={.000001} step="any" value={pluAmount} onChange={e=>setPluAmount(e.target.value)}/></label><label>Selling price (DKK)<input type="number" inputMode="decimal" min={0} step="any" value={pluPrice} onChange={e=>setPluPrice(e.target.value)}/></label></div>}</section>{error&&<p role="alert">{error}</p>}<div className="stock-product-actions"><button className="stock-primary" onClick={()=>{const problems=productProblems(draft);if(problems.length){setError(problems.join(' '));return;}if(createPlu&&(!pluAmount||Number(pluAmount)<=0||!Number.isFinite(Number(pluAmount))||pluPrice===''||Number(pluPrice)<0||!Number.isFinite(Number(pluPrice)))){setError('Enter a serving size and selling price for the PLU.');return;}const sale:Sale|undefined=createPlu?{id:crypto.randomUUID(),name:pluName.trim()||draft.name.trim(),sku:'',unitPrice:Number(pluPrice),ingredients:[{productId:draft.id,quantity:storedAmount(draft,Number(pluAmount))}]}:undefined;onAdd({...draft,name:draft.name.trim()},sale);setExpanded(draft.id);setDraft(null);setSearch('');setError('');}}>Add product</button><button onClick={()=>{setDraft(null);setError('');}}>Cancel</button></div><small>Use Save in the bottom bar to keep your changes.</small></section>}
  {products.length>0&&<div className="stock-product-search"><label>Find a product<input type="search" placeholder="Search name, category or supplier" value={search} onChange={e=>setSearch(e.target.value)}/></label><label><input type="checkbox" checked={archived} onChange={e=>setArchived(e.target.checked)}/> Show inactive products</label></div>}
  {!products.length&&!draft&&<p>No products yet. Start with one bottle, keg, case or other item you buy.</p>}
  {products.length>0&&!visible.length&&<p>No matching products. Try another search or show inactive products.</p>}
  {visible.map(p=><details className="stock-product-row" key={p.id} open={expanded===p.id} onToggle={e=>{const open=e.currentTarget.open;setExpanded(previous=>open?p.id:previous===p.id?null:previous);}}><summary><span>{p.name}{p.active?'':' · Inactive'}</span><small>{packDescription(p)} · {p.packCost?price(p.packCost):'Price not set'}</small></summary><ProductFields product={p} locked={usedIds.has(p.id)} change={patch=>onChange(p.id,patch)}/>{productProblems(p).length>0&&<p role="alert">{productProblems(p).join(' ')}</p>}<TillItems product={p} products={products} sales={sales} onAdd={onAddSale} onChange={onChangeSale} onRemove={onRemoveSale}/></details>)}
 </section>;
}
