'use client';

import {useState} from 'react';
import {orderPacksForLowIdeal, type Product} from '../../../lib/stock';
import {productPackDetails} from '../../../lib/stock-product';
import StockProductDetails from './StockProductDetails';

type Props = {
  products: Product[];
  onCounting: (active: boolean) => void;
};

const supplierName = (supplier: string) => supplier || 'No supplier';
const maxCount = 10000000;

export default function OrderCount({products, onCounting}: Props) {
  const active = products.filter(product => product.active);
  const suppliers = [...new Set(active.map(product => product.supplier))].sort();
  const [selected, setSelected] = useState<string[] | null>(null);
  const [snapshot, setSnapshot] = useState<Product[]>([]);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<'select' | 'count' | 'order'>('select');
  const selectedSuppliers = selected ?? suppliers;
  const countGroups = [...new Set(snapshot.map(product => product.supplier))];
  const entered = snapshot.filter(({id}) => {
    const value = counts[id];
    return value !== undefined && value !== '' && Number.isFinite(Number(value)) &&
      Number(value) >= 0 && Number(value) <= maxCount;
  }).length;

  function reset() {
    setStage('select');
    setSnapshot([]);
    setCounts({});
    onCounting(false);
  }

  if (stage === 'select') {
    return <section>
      <h2>Order count</h2>
      {suppliers.length === 0 ? <p>No active products to count.</p> : <>
        <fieldset className="stock-order-suppliers">
          <legend>Suppliers to count</legend>
          <div className="stock-order-supplier-actions">
            <button type="button" onClick={() => setSelected(null)}>Select all</button>
            <button type="button" onClick={() => setSelected([])}>Clear selection</button>
          </div>
          {suppliers.map(supplier => <label key={supplier}>
            <input type="checkbox" checked={selectedSuppliers.includes(supplier)} onChange={event => {
              setSelected(event.target.checked
                ? [...selectedSuppliers, supplier]
                : selectedSuppliers.filter(value => value !== supplier));
            }}/>
            {supplierName(supplier)}
          </label>)}
        </fieldset>
        <button type="button" disabled={!active.some(product => selectedSuppliers.includes(product.supplier))} onClick={() => {
          setSnapshot(active.filter(product => selectedSuppliers.includes(product.supplier))
            .sort((left, right) => left.supplier.localeCompare(right.supplier) || left.name.localeCompare(right.name)));
          setStage('count');
          onCounting(true);
        }}>Start count</button>
      </>}
    </section>;
  }

  if (stage === 'count') {
    return <section>
      <h2>Count stock</h2>
      {countGroups.map(supplier => <fieldset key={supplier} className="stock-count-group">
        <legend>{supplierName(supplier)}</legend>
        {snapshot.filter(product => product.supplier === supplier).map(product => {
          const value = counts[product.id] ?? '';
          const setValue = (next: string) => setCounts(current => ({...current, [product.id]: next}));
          const adjust = (delta: number) => {
            const next = Math.max(0, Math.min(maxCount, (Number(value) || 0) + delta));
            setValue(String(Number(next.toFixed(9))));
          };
          return <div key={product.id} className="stock-order-count-row">
            <StockProductDetails product={product}/>
            <div className="stock-order-count-quantity">
              <button type="button" aria-label={'Remove one pack of ' + product.name}
                disabled={value !== '' && Number(value) <= 0} onClick={() => adjust(-1)}>−</button>
              <input id={'order-count-' + product.id} type="number" inputMode="decimal"
                aria-label={product.name + ' count in packs'} min={0} max={maxCount} step="any" value={value}
                onChange={event => setValue(event.target.value)}/>
              <button type="button" aria-label={'Add one pack of ' + product.name}
                disabled={Number(value) >= maxCount} onClick={() => adjust(1)}>+</button>
            </div>
          </div>;
        })}
      </fieldset>)}
      <div className="stock-product-actions">
        <button type="button" disabled={entered !== snapshot.length} onClick={() => setStage('order')}>Finish count</button>
        <button type="button" onClick={() => {
          if (entered === 0 || window.confirm('Discard this order count?')) reset();
        }}>Cancel count</button>
      </div>
    </section>;
  }

  const orders = snapshot.flatMap(product => {
    if (product.lowIdeal === undefined) return [];
    const counted = Number(counts[product.id]);
    const packs = orderPacksForLowIdeal(product.lowIdeal, counted);
    return packs > 0 ? [{product, counted, ideal: product.lowIdeal, packs}] : [];
  });
  const missing = snapshot.filter(product => product.lowIdeal === undefined);
  return <section>
    <h2>Order list</h2>
    <p>Based on Low ideal. Order quantities are in whole purchase packs.</p>
    {orders.length === 0 && <p>No orders needed for products with a Low ideal.</p>}
    {countGroups.map(supplier => {
      const lines = orders.filter(line => line.product.supplier === supplier);
      if (!lines.length) return null;
      return <section key={supplier}>
        <h3>{supplierName(supplier)}</h3>
        <ul>{lines.map(({product, counted, ideal, packs}) => <li key={product.id}>
          <strong>{packs} × {product.name}</strong> · counted {counted}, target {ideal}<br/><small>{productPackDetails(product)}</small>
        </li>)}</ul>
      </section>;
    })}
    {missing.length > 0 && <>
      <h3>Missing Low ideal</h3>
      <p>Add Low ideal in Google Sheets for these products to get an order quantity.</p>
      <ul>{missing.map(product => <li key={product.id}>{product.name} · {supplierName(product.supplier)}</li>)}</ul>
    </>}
    <div className="stock-product-actions">
      <button type="button" onClick={() => setStage('count')}>Edit counts</button>
      <button type="button" onClick={reset}>Done</button>
    </div>
  </section>;
}
