'use client';
import type {Product,Sale} from '../../../lib/stock';
import {newTillItem,servingAmount,servingUnit,storedAmount,tillProblem} from '../../../lib/stock-till';

export default function TillItems({product,products,sales,onAdd,onChange,onRemove}:{product:Product;products:Product[];sales:Sale[];onAdd:(sale:Sale)=>void;onChange:(id:string,patch:Partial<Sale>)=>void;onRemove:(id:string)=>void}){
 const linked=sales.filter(s=>s.ingredients.some(i=>i.productId===product.id));
 return <section className="stock-product-till" aria-label={`Till items for ${product.name}`}>
  <div className="stock-till-heading"><h3>Till items</h3><button onClick={()=>onAdd(newTillItem(product,crypto.randomUUID()))}>Add till item</button></div>
  {!linked.length&&<p>Connect this stock to what you sell. Add separate till items for different serving sizes.</p>}
  {linked.map(s=>{const next=products.find(p=>p.active&&!s.ingredients.some(i=>i.productId===p.id));return <fieldset className="stock-till-card" key={s.id}><legend>{s.name||'Till item'}</legend>
   <div className="stock-product-fields"><label>Name on till<input autoComplete="off" value={s.name} maxLength={200} onChange={e=>onChange(s.id,{name:e.target.value})}/></label><label>Selling price (DKK)<input type="number" inputMode="decimal" min={0} step="any" value={s.unitPrice??''} onChange={e=>onChange(s.id,{unitPrice:e.target.value===''?undefined:e.target.valueAsNumber})}/></label><label>Till code (optional)<input value={s.sku} maxLength={200} onChange={e=>onChange(s.id,{sku:e.target.value})}/></label></div>
   {s.ingredients.length>1&&<p>Shared recipe — edits here also update its other product cards.</p>}
   {s.ingredients.map((part,index)=>{const p=products.find(p=>p.id===part.productId)!;return <div className="stock-till-ingredient" key={part.productId}><div className="stock-product-fields"><label>Stock product<select value={part.productId} onChange={e=>onChange(s.id,{ingredients:s.ingredients.map((i,n)=>n===index?{productId:e.target.value,quantity:0}:i)})}>{products.filter(p=>p.id===part.productId||(p.active&&!s.ingredients.some(i=>i.productId===p.id))).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Amount per sale ({servingUnit(p)})<input type="number" inputMode="decimal" min={.000001} step="any" value={part.quantity?servingAmount(p,part.quantity):''} placeholder={p.unit==='L'?'e.g. 40':p.unit==='kg'?'e.g. 100':'e.g. 1'} onChange={e=>onChange(s.id,{ingredients:s.ingredients.map((i,n)=>n===index?{...i,quantity:storedAmount(p,e.target.value===''?0:e.target.valueAsNumber)}:i)})}/></label></div>{s.ingredients.length>1&&<button onClick={()=>onChange(s.id,{ingredients:s.ingredients.filter((_,n)=>n!==index)})}>Remove ingredient</button>}</div>;})}
   {tillProblem(s)&&<p role="alert">{tillProblem(s)}</p>}
   <div className="stock-product-actions">{next&&<button onClick={()=>onChange(s.id,{ingredients:[...s.ingredients,{productId:next.id,quantity:0}]})}>Add ingredient</button>}<button onClick={()=>{if(window.confirm(`Remove “${s.name}” from future counts? Saved periods stay unchanged.`))onRemove(s.id);}}>Remove till item</button></div>
  </fieldset>;})}
 </section>;
}
