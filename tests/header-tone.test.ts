import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('header samples nested surfaces independently and restores contrast in both scroll directions',()=>{
 let state={logo:'gold',menu:'gold'}, phase='hero';
 const listeners=new Map<string,()=>void>(),frames:Array<()=>void>=[];
 const surface=(light:boolean)=>({matches:()=>light});
 const exports:Record<string,any>={};
 const code=ts.transpileModule(readFileSync(new URL('../app/useHeaderTone.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const root={dataset:{} as Record<string,string>};
 const document={documentElement:root,
  querySelector:(selector:string)=>selector.includes('brand-logo')?{getBoundingClientRect:()=>({left:20,top:20,width:100,height:60})}:selector.includes('burger-button')?{getBoundingClientRect:()=>({left:320,top:20,width:48,height:48})}:null,
  elementsFromPoint:(x:number)=>[{closest:(selector:string)=>selector==='main,.brand-footer'?{}:surface(phase==='footer'||phase==='nested-light'||(phase==='split'&&x<200))}],
  addEventListener(){},removeEventListener(){}};
 vm.runInNewContext(code,{exports,document,window:{addEventListener:(event:string,fn:()=>void)=>listeners.set(event,fn),removeEventListener(){}},ResizeObserver:class{observe(){}disconnect(){}},requestAnimationFrame:(fn:()=>void)=>{frames.push(fn);return frames.length;},cancelAnimationFrame(){},require:(name:string)=>name==='react'?{useState:()=>[state,(fn:(value:typeof state)=>typeof state)=>{state=fn(state);}],useLayoutEffect:(fn:()=>void)=>fn()}:{afterPaint:()=>()=>{}}});
 exports.useHeaderTone('/om-os');
 const visit=(next:string)=>{phase=next;listeners.get('scroll')?.();frames.shift()?.();};
 assert.deepEqual(state,{logo:'gold',menu:'gold'});
 visit('nested-light');assert.equal(state.logo,'dark');assert.equal(state.menu,'dark');
 visit('footer');assert.equal(root.dataset.headerTone,'dark');
 visit('nested-light');assert.equal(state.menu,'dark');
 visit('hero');assert.equal(state.menu,'gold');
 visit('split');assert.equal(state.logo,'dark');assert.equal(state.menu,'gold');
});
