import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkStockChange, emptyStock, newWeek, orderPacksForLowIdeal} from '../lib/stock.ts';
import {mergeSheetProducts} from '../lib/stock-sheet.ts';

const headers = ['Name', 'Supplier', 'Type', 'Unit', 'Pack', 'SKU', 'Active'];

test('sheet merges hide removed products and preserve stock history, local fields and IDs', () => {
  const {document} = mergeSheetProducts(emptyStock, [
    headers, ['Pilsner', 'Supplier', 'Keg', 'L', 20, 'keg-1'], ['Tonic', 'Supplier', 'Bottle'],
  ]);
  document.products[0].packCost = 500;
  document.weeks.push(newWeek(document, '2026-11-02T04:00', '2026-11-09T04:00', 'week-1'));
  const tonicId = document.products[1].id;
  document.sales.push({id: 'tonic-sale', name: 'Tonic', sku: '', ingredients: [{productId: tonicId, quantity: 1}]});
  const rows = [headers, ['Renamed pilsner', 'Supplier', 'Keg', '', '', 'keg-1', false]];
  const merged = mergeSheetProducts(document, rows);
  assert.equal(merged.added, 0);
  assert.equal(merged.updated, 1);
  assert.equal(merged.removed, 1);
  const [keg, tonic] = merged.document.products;
  assert.equal(keg.id, document.products[0].id);
  assert.equal(keg.packCost, 500);
  assert.equal(keg.pack, 20);
  assert.equal(keg.active, false);
  assert.equal(tonic.pack, 1);
  assert.equal(tonic.sheetMissing, true);
  assert.deepEqual(merged.document.sales, document.sales);
  assert.doesNotThrow(() => checkStockChange(document, merged.document, 'Synced from Google Sheets'));
  const next = newWeek(merged.document, '2026-11-09T04:00', '2026-11-16T04:00', 'week-2');
  assert.deepEqual(next.rows, []);
  assert.deepEqual(next.sales, []);
  assert.deepEqual(merged.document.weeks, document.weeks);
  const repeat = mergeSheetProducts(merged.document, rows);
  assert.equal(repeat.updated, 0);
  assert.equal(repeat.removed, 0);

  const restored = mergeSheetProducts(merged.document, [...rows, ['Tonic', 'Supplier', 'Bottle']]);
  assert.equal(restored.added, 0);
  assert.equal(restored.updated, 1);
  assert.equal(restored.document.products[1].id, tonicId);
  assert.equal(restored.document.products[1].sheetMissing, undefined);
  assert.equal(newWeek(restored.document, next.start, next.end, next.id).sales[0].item.id, 'tonic-sale');
});

test('a valid header-only sheet clears the catalog and missing headers fail sync', () => {
  const {document} = mergeSheetProducts(emptyStock, [headers, ['Pilsner', 'Supplier', 'Keg', 'L', 20]]);
  const cleared = mergeSheetProducts(document, [headers]);
  assert.equal(cleared.removed, 1);
  assert.ok(cleared.document.products.every(product => product.sheetMissing));
  assert.equal(mergeSheetProducts(cleared.document, [headers]).removed, 0);
  assert.throws(() => mergeSheetProducts(document, []), /expected exactly one/);
  assert.equal(document.products[0].sheetMissing, undefined);
});

test('sheet rejects duplicate rows, invalid packs and changes to units in historical counts', () => {
  const row = ['Pilsner', 'Supplier', 'Keg', 'L', 20];
  assert.throws(() => mergeSheetProducts(emptyStock, [headers, row, row]), /duplicate product/);
  assert.throws(() => mergeSheetProducts(emptyStock, [headers, [...row.slice(0, 4), 0]]), /Invalid sheet row 2/);
  const {document} = mergeSheetProducts(emptyStock, [headers, row]);
  document.weeks.push(newWeek(document, '2026-11-02T04:00', '2026-11-09T04:00', 'week-1'));
  assert.throws(() => mergeSheetProducts(document, [headers, [...row.slice(0, 3), 'each', 1]]), /changed product unit/);
});

test('ideal columns sync in purchase packs and distinguish blank from zero', () => {
  const columns = [...headers, 'High ideal', 'Low ideal'];
  const row = ['Pilsner', 'Supplier', 'Keg', 'L', 20, 'keg-1', true, 8, '2,1'];
  const first = mergeSheetProducts(emptyStock, [columns, row]);
  assert.equal(first.document.products[0].highIdeal, 8);
  assert.equal(first.document.products[0].lowIdeal, 2.1);
  assert.equal(orderPacksForLowIdeal(first.document.products[0].lowIdeal!, 1.1), 1);
  assert.equal(orderPacksForLowIdeal(4, 2.5), 2);
  assert.equal(orderPacksForLowIdeal(4, 5), 0);
  const zero = mergeSheetProducts(first.document, [columns, [...row.slice(0, -1), 0]]);
  assert.equal(zero.document.products[0].lowIdeal, 0);
  const blank = mergeSheetProducts(zero.document, [columns, row.slice(0, -1)]);
  assert.equal(blank.document.products[0].lowIdeal, undefined);
  assert.throws(() => mergeSheetProducts(blank.document, [columns, [...row.slice(0, -1), -1]]), /Invalid sheet row 2/);
});

test('sheet unit descriptions and pack quantities are separate from pack totals and targets', () => {
  const columns = ['Name', 'Supplier', 'Unit', 'Unit size (l.)', 'Pack qty', 'Low ideal', 'High ideal'];
  const rows = [columns, ['Pilsner', 'Supplier', 'Bottle', .33, 24, 4, 6]];
  const {document} = mergeSheetProducts(emptyStock, rows);
  const [product] = document.products;
  assert.equal(product.unitLabel, 'Bottle');
  assert.equal(product.unitSizeL, .33);
  assert.equal(product.packQty, 24);
  assert.equal(product.unit, 'L');
  assert.equal(product.pack, .33 * 24);
  assert.equal(product.lowIdeal, 4);
  assert.equal(orderPacksForLowIdeal(product.lowIdeal!, 2.5), 2);
  assert.equal(mergeSheetProducts(document, rows).updated, 0);
  assert.throws(() => mergeSheetProducts(emptyStock, [columns, ['Pilsner', 'Supplier', 'Bottle', .33, 1.5]]), /positive whole number/);
});

test('pack metadata sync retains existing product ID and the base unit of historical counts', () => {
  const {document} = mergeSheetProducts(emptyStock, [headers, ['Pilsner', 'Supplier', 'Keg']]);
  document.weeks.push(newWeek(document, '2026-11-02T04:00', '2026-11-09T04:00', 'week-1'));
  const rows = [
    ['Name', 'Supplier', 'Unit', 'Unit size (l.)', 'Pack qty'],
    ['Pilsner', 'Supplier', 'Keg', 25, 1],
  ];
  const merged = mergeSheetProducts(document, rows);
  assert.equal(merged.added, 0);
  assert.equal(merged.document.products[0].id, document.products[0].id);
  assert.equal(merged.document.products[0].unit, 'each');
  assert.equal(merged.document.products[0].unitSizeL, 25);
  assert.deepEqual(merged.document.weeks, document.weeks);
});
