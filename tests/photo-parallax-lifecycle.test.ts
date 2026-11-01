import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as geometry from '../lib/photo-parallax.ts';

function harness(reduced=false,enabled=true){
 const effects:Array<()=>void|(()=>void)>=[],cleanups:Array<()=>void>=[],events=new Map<string,()=>void>(),jobs=new Map<number,(t:number)=>void>();
 let id=0,time=0;
 const win={scrollY:0,innerWidth:390,innerHeight:800,addEventListener:(name:string,fn:()=>void)=>events.set(name,fn),removeEventListener:(name:string)=>events.delete(name)};
 const values=new Map([['object-position','35% 60%'],['filter','brightness(.846)']]);
 const frame={dataset:{} as Record<string,string>,getBoundingClientRect:()=>({top:300-win.scrollY,bottom:800-win.scrollY,height:500})};
 const image={dataset:{} as Record<string,string>,parentElement:{...frame,matches:()=>true},clientHeight:500,closest:()=>null,style:{setProperty:(key:string,value:string)=>values.set(key,value),removeProperty:(key:string)=>values.delete(key)}};
 image.parentElement.dataset=frame.dataset;
 const excluded={...image,dataset:{},closest:()=>({})};
 const main={querySelectorAll:()=>[image,excluded],addEventListener(){},removeEventListener(){}};
 const observed=new Set<unknown>();
 class Observer{constructor(_callback:unknown){}observe(node:unknown){observed.add(node);}unobserve(node:unknown){observed.delete(node);}disconnect(){observed.clear();}}
 const exports:Record<string,any>={};
 const code=ts.transpileModule(readFileSync(new URL('../app/PhotoParallax.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{exports,window:win,document:{querySelector:()=>main},matchMedia:()=>({matches:reduced,addEventListener(){},removeEventListener(){}}),IntersectionObserver:Observer,ResizeObserver:Observer,MutationObserver:Observer,Element:class{},requestAnimationFrame:(fn:(t:number)=>void)=>{jobs.set(++id,fn);return id;},cancelAnimationFrame:(n:number)=>jobs.delete(n),require:(name:string)=>name==='react'?{useState:()=>[false,()=>{}],useLayoutEffect:(effect:()=>void|(()=>void))=>effects.push(effect)}:name==='next/navigation'?{usePathname:()=>'/galleri'}:name==='./Content'?{useContent:()=>({text:enabled?{}:{'motion.parallax':'false'},images:{}})}:geometry});
 exports.default();effects.forEach(effect=>{const cleanup=effect();if(cleanup)cleanups.push(cleanup);});
 const tick=()=>{time+=16;const queue=[...jobs.values()];jobs.clear();queue.forEach(fn=>fn(time));};
 return {image,frame,values,excluded,events,observed,jobs,tick,scroll:(y:number)=>{win.scrollY=y;events.get('scroll')?.();},cleanup:()=>cleanups.reverse().forEach(fn=>fn())};
}
test('the photo moves inside its unchanged frame, excludes non-photo media and releases resources',()=>{
 const h=harness();assert.equal(h.image.dataset.photoParallax,'true');assert.equal(h.frame.dataset.parallaxFrame,'true');assert.deepEqual(h.excluded.dataset,{});
 const before=Number.parseFloat(h.values.get('--photo-parallax-shift')!);const scale=Number(h.values.get('--photo-parallax-scale'));assert.ok(scale>1);
 h.scroll(450);for(let i=0;i<70;i++)h.tick();const after=Number.parseFloat(h.values.get('--photo-parallax-shift')!);assert.ok(after>before);assert.ok(after<=10);
 assert.equal(h.frame.getBoundingClientRect().top+450,300,'layout position must stay fixed');
 h.scroll(100);for(let i=0;i<70;i++)h.tick();assert.ok(Number.parseFloat(h.values.get('--photo-parallax-shift')!)<after);
 h.cleanup();assert.equal(h.image.dataset.photoParallax,undefined);assert.equal(h.frame.dataset.parallaxFrame,undefined);assert.equal(h.values.has('--photo-parallax-scale'),false);assert.equal(h.jobs.size,0);assert.equal(h.observed.size,0);assert.equal(h.events.size,0);
 assert.equal(h.values.get('object-position'),'35% 60%');assert.equal(h.values.get('filter'),'brightness(.846)');
});
test('device reduced motion and the editor off switch prevent parallax activation',()=>{
 for(const h of [harness(true),harness(false,false)]){assert.equal(h.image.dataset.photoParallax,undefined);assert.equal(h.jobs.size,0);h.cleanup();}
});
