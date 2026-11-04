import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as helpers from '../lib/stock-product.ts';
import type {Product} from '../lib/stock.ts';

function harness(){
 let draft:Product|null=null,cursor=0;
 const states:any[]=[],added:Product[]=[];
 const jsx=(type:unknown,props:any)=>({type,props});
 const exports:any={};
 const source=ts.transpileModule(readFileSync(new URL('../app/admin/stock/Products.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(source,{exports,Intl,crypto:{randomUUID:()=> 'new-product'},require:(name:string)=>name==='react'?{useState:(initial:unknown)=>{const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],(value:unknown)=>{states[i]=value;}];}}:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:helpers});
 function nodes(node:any):any[]{return !node||typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(nodes)];}
 function render(){cursor=0;return exports.default({products:added,sales:[],onAddSale(){},onChangeSale(){},onRemoveSale(){},usedIds:new Set(),draft,setDraft:(next:Product|null)=>{draft=next;},onAdd:(p:Product)=>added.push(p),onChange(){}});}
 const click=(label:string)=>nodes(render()).find(node=>node.type==='button'&&node.props.children===label).props.onClick();
 return {click,added,nodes:()=>nodes(render()),draft:()=>draft};
}
test('new product opens a draft and Cancel discards it without adding a stock record',()=>{
 const h=harness();h.click('Add product');assert.ok(h.draft());assert.equal(h.added.length,0);
 h.click('Cancel');assert.equal(h.draft(),null);assert.equal(h.added.length,0);
});
test('Add requires a valid named product and commits exactly once before clearing the draft',()=>{
 const h=harness();h.click('Add product');h.click('Add product');assert.equal(h.added.length,0);
 assert.ok(h.nodes().some(n=>n.props.role==='alert'&&n.props.children.includes('product name')));
 h.draft()!.name='  House gin  ';h.click('Add product');assert.equal(h.added.length,1);assert.equal(h.added[0].name,'House gin');assert.equal(h.draft(),null);
});

test('a newly added product opens its own card with the connected till section',()=>{
 const h=harness();h.click('Add product');h.draft()!.name='Beer';h.click('Add product');
 const card=h.nodes().find(n=>n.props.className==='stock-product-row');assert.equal(card.props.open,true);
 assert.ok(h.nodes().some(n=>n.props.product?.id===h.added[0].id&&n.props.onAdd));
});
