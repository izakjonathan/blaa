import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProduct,purchaseSizes,purchaseSize,productProblems,packsToUnits,unitsToPacks,packDescription} from '../lib/stock-product.ts';
import {newWeek,validateStock,rowReport,type Stock} from '../lib/stock.ts';

test('product setup starts as an invalid unnamed draft and needs no optional metadata or price',()=>{
 const draft=newProduct('beer');assert.ok(productProblems(draft).some(s=>s.includes('name')));
 const product={...draft,name:'Bottled beer'};assert.deepEqual(productProblems(product),[]);
 assert.equal(validateStock({products:[product],sales:[],weeks:[]}).products[0].packCost,0);
});
test('purchase presets store litres and individual items without changing stock report maths',()=>{
 for(const size of purchaseSizes){
  const product={...newProduct(size.id),...size,name:size.label,packCost:100};
  assert.equal(purchaseSize(product)?.id,size.id);assert.equal(packDescription(product),size.label);
  const stock:Stock={products:[product],sales:[],weeks:[]};
  const week=newWeek(stock,'2026-11-02T04:00','2026-11-09T04:00','week');
  const row=week.rows[0];row.opening=packsToUnits(product,2);row.closing=packsToUnits(product,.5);row.deliveryPacks=1;
  const report=rowReport(row,week);
  assert.ok(Math.abs(report.actual!-2.5*size.pack)<1e-10);
  assert.equal(unitsToPacks(product,row.closing),.5);
  assert.ok(Math.abs(report.cost*report.actual!-250)<1e-8);
 }
});
test('custom sizes and pack-based targets preserve stored base-unit amounts and reject bad inputs',()=>{
 const p={...newProduct('custom'),name:'Custom wine',unit:'L' as const,pack:.5};
 assert.equal(purchaseSize(p),undefined);assert.equal(packDescription(p),'0.5 L per pack');
 assert.equal(packsToUnits(p,6),3);assert.equal(unitsToPacks(p,3),6);
 for(const patch of [{pack:0},{pack:NaN},{packCost:-1},{par:-1},{threshold:101},{name:'   '}])assert.ok(productProblems({...p,...patch}).length);
});
