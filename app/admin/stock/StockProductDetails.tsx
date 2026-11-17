import type {Product} from '../../../lib/stock';

const quantity = new Intl.NumberFormat('da-DK', {maximumFractionDigits: 6});

export default function StockProductDetails({product}: {product: Product}) {
  const number = (value: number | null | undefined) => value == null ? '—' : quantity.format(value);
  return <dl className="stock-product-details">
    <div><dt>Supplier</dt><dd>{product.supplier || '—'}</dd></div>
    <div><dt>Unit</dt><dd>{product.unitLabel || '—'}</dd></div>
    <div><dt>Unit size</dt><dd>{product.unitSizeL === undefined ? '—' : quantity.format(product.unitSizeL) + ' L'}</dd></div>
    <div><dt>Pack qty</dt><dd>{number(product.packQty)}</dd></div>
    <div><dt>Ideal (packs)</dt><dd>{number(product.lowIdeal)}</dd></div>
  </dl>;
}
