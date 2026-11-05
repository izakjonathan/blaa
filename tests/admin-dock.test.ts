import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function dock(confirmed:boolean){
 const jsx=(type:unknown,props:Record<string,any>)=>({type,props});
 const exports:Record<string,any>={};let prompts=0;
 const code=ts.transpileModule(readFileSync(new URL('../app/admin/AdminDock.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,document:{documentElement:{dataset:{adminUnsaved:'true'}}},window:{confirm:()=>{prompts++;return confirmed;}},require:(name:string)=>name==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:'fragment'}:{default:'link'}});
 const tree=exports.default({pathname:'/admin/stock'});
 const links=tree.props.children;
 function click(href:string,extra={}){let prevented=false;links.find((link:any)=>link.props.href===href).props.onClick({preventDefault(){prevented=true;},metaKey:false,ctrlKey:false,shiftKey:false,altKey:false,...extra});return prevented;}
 return {click,links,prompts:()=>prompts};
}
for(const confirmed of [false,true])test(`admin dock ${confirmed?'allows':'cancels'} unsaved navigation`,()=>{
 const h=dock(confirmed);assert.equal(h.click('/admin/editor'),!confirmed);assert.equal(h.prompts(),1);
});
test('admin dock preserves modified clicks and marks the current tool',()=>{
 const h=dock(false);
 assert.equal(h.click('/admin/stock'),false);
 for(const key of ['metaKey','ctrlKey','shiftKey','altKey'])assert.equal(h.click('/admin/editor',{[key]:true}),false);
 assert.equal(h.prompts(),0);
 assert.deepEqual(Array.from(h.links,(link:any)=>[link.props.href,link.props['aria-current']]),[['/admin',undefined],['/admin/editor',undefined],['/admin/social-generator',undefined],['/admin/stock','page']]);
});
