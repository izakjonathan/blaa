import type {Product} from '../../../lib/stock';

const quantity = new Intl.NumberFormat('da-DK', {maximumFractionDigits: 6});
const format = (value: number | undefined) => value === undefined ? '—' : quantity.format(value);

export default function StockProductDetails({product}: {product: Product}) {
  const ideal = format(product.lowIdeal);
  const supplier = product.supplier || 'No supplier';
  return <div className="stock-product-details">
    <strong className="stock-item-name" title={product.name}>{product.name}</strong>
    <div className="stock-card-meta">
      <span className="stock-line-unit" title={product.unitLabel}>{product.unitLabel || '—'}</span>
      <span className="stock-card-separator" aria-hidden="true">-</span>
      <span className="stock-card-pack">PK {format(product.packQty)}</span>
      <span className="stock-card-separator" aria-hidden="true">-</span>
      <span className="stock-card-ideal" title="Ideal in packs"><span className="stock-inline-label">Ideal in packs </span>{ideal}</span>
      <span className="stock-card-separator" aria-hidden="true">-</span>
      <span className="stock-card-supplier" title={supplier}>{supplier}</span>
    </div>
  </div>;
}
