import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyStock, newWeek, orderPacksForLowIdeal} from '../lib/stock.ts';
import {mergeSheetProducts} from '../lib/stock-sheet.ts';

const headers = ['Name', 'Supplier', 'Type', 'Unit', 'Pack', 'SKU', 'Active'];

test('sheet merges preserve stock history, local fields, IDs and missing rows', () => {
  const {document} = mergeSheetProducts(emptyStock, [
    headers, ['Pilsner', 'Supplier', 'Keg', 'L', 20, 'keg-1'], ['Tonic', 'Supplier', 'Bottle'],
  ]);
  document.products[0].packCost = 500;
  document.weeks.push(newWeek(document, '2026-11-02T04:00', '2026-11-09T04:00', 'week-1'));
  const rows = [headers, ['Renamed pilsner', 'Supplier', 'Keg', '', '', 'keg-1', false]];
  const merged = mergeSheetProducts(document, rows);
  assert.equal(merged.added, 0);
  assert.equal(merged.updated, 1);
  const [keg, tonic] = merged.document.products;
  assert.equal(keg.id, document.products[0].id);
  assert.equal(keg.packCost, 500);
  assert.equal(keg.pack, 20);
  assert.equal(keg.active, false);
  assert.equal(tonic.pack, 1);
  assert.deepEqual(merged.document.weeks, document.weeks);
  assert.equal(mergeSheetProducts(merged.document, rows).updated, 0);
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
