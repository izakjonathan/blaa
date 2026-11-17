import type {Product} from '../../../lib/stock';

const quantity = new Intl.NumberFormat('da-DK', {maximumFractionDigits: 6});
const format = (value: number | undefined) => value === undefined ? '—' : quantity.format(value);

export default function StockProductDetails({product}: {product: Product}) {
  const ideal = format(product.lowIdeal);
  return <div className="stock-product-details">
    <strong className="stock-item-name" title={product.name}>{product.name}</strong>
    <span aria-hidden="true">-</span>
    <span className="stock-line-unit" title={product.unitLabel}>{product.unitLabel || '—'}</span>
    <span aria-hidden="true">-</span>
    <span>PK {format(product.packQty)}</span>
    <span aria-hidden="true">-</span>
    <span title="Ideal in packs"><span className="stock-inline-label">Ideal in packs </span>{ideal}</span>
  </div>;
}
