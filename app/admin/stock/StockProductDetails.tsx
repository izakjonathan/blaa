import type {Product} from '../../../lib/stock';

const quantity = new Intl.NumberFormat('da-DK', {maximumFractionDigits: 3});

export default function StockProductDetails({product, estimatedPacks}: {
  product: Product;
  estimatedPacks?: number | null;
}) {
  const number = (value: number | null | undefined) => value == null ? '—' : quantity.format(value);
  return <dl className="stock-product-details">
    <div><dt>Supplier</dt><dd>{product.supplier || '—'}</dd></div>
    <div><dt>Unit</dt><dd>{product.unitLabel || '—'}</dd></div>
    <div><dt>Unit size</dt><dd>{product.unitSizeL === undefined ? '—' : quantity.format(product.unitSizeL) + ' L'}</dd></div>
    <div><dt>Pack qty</dt><dd>{number(product.packQty)}</dd></div>
    <div><dt>Low ideal (packs)</dt><dd>{number(product.lowIdeal)}</dd></div>
    <div><dt>High ideal (packs)</dt><dd>{number(product.highIdeal)}</dd></div>
    {estimatedPacks !== undefined && <div><dt>Estimated packs</dt><dd>{number(estimatedPacks)}</dd></div>}
  </dl>;
}
