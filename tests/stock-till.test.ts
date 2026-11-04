import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProduct} from '../lib/stock-product.ts';
import {newTillItem,servingAmount,servingUnit,storedAmount,tillProblem} from '../lib/stock-till.ts';
import {validateStock,newWeek,rowReport} from '../lib/stock.ts';

test('new till items link to the selected product and liquid portions need explicit entry',()=>{
 const beer={...newProduct('beer'),name:'Beer'};const sale=newTillItem(beer,'beer-sale');
 assert.equal(sale.name,'Beer');assert.equal(sale.ingredients[0].productId,'beer');assert.equal(sale.ingredients[0].quantity,1);assert.equal(tillProblem(sale),'');
 const gin={...beer,id:'gin',unit:'L' as const,pack:.7};assert.ok(tillProblem(newTillItem(gin,'gin-sale')));
});
test('staff enter ml, grams or items while existing stock storage retains its units',()=>{
 for(const [unit,display,stored,label] of [['L',40,.04,'ml'],['kg',125,.125,'g'],['each',2,2,'items']] as const){
  const p={...newProduct('p'),unit};assert.equal(servingUnit(p),label);assert.equal(servingAmount(p,stored),display);assert.equal(storedAmount(p,display),stored);
 }
});
test('a 40 ml till portion reconciles with litre stock without changing saved periods',()=>{
 const p={...newProduct('gin'),name:'House gin',unit:'L' as const,pack:.7,packCost:140};const s=newTillItem(p,'shot');s.ingredients[0].quantity=storedAmount(p,40);
 const stock=validateStock({products:[p],sales:[s],weeks:[]});const week=newWeek(stock,'2026-11-02T04:00','2026-11-09T04:00','week');
 week.sales[0].quantity=10;week.salesConfirmed=true;week.rows[0].opening=.7;week.rows[0].closing=.3;
 assert.equal(rowReport(week.rows[0],week).theoretical,.4);assert.ok(Math.abs(rowReport(week.rows[0],week).variance!)<1e-12);
 s.ingredients[0].quantity=.05;assert.equal(week.sales[0].item.ingredients[0].quantity,.04);
});
