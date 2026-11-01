import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {frameGeometry} from '../lib/editorial-motion.ts';

function harness({reduced=false,enabled=true,frames=true,zoom=true}={}){
 const effects:Array<()=>void|(()=>void)>=[],cleanups:Array<()=>void>=[],jobs=new Map<number,()=>void>(),events=new Map<string,()=>void>();
 let next=0,top=800,covered=false;
 const values=new Map<string,string>();
 const image={dataset:{} as Record<string,string>,style:{transform:'translateY(3px)',objectPosition:'35% 60%'}};
 const frame={dataset:{} as Record<string,string>,style:{setProperty:(k:string,v:string)=>values.set(k,v),removeProperty:(k:string)=>values.delete(k)},matches:()=>true,querySelector:()=>image,getBoundingClientRect:()=>({top,bottom:top+500})};
 const main={querySelectorAll:()=>[frame],addEventListener(){},removeEventListener(){}};
 const observed=new Set<unknown>();
 class Observer{constructor(_fn:unknown){}observe(node:unknown){observed.add(node);}unobserve(node:unknown){observed.delete(node);}disconnect(){observed.clear();}}
 const queue=(fn:()=>void)=>{jobs.set(++next,fn);return next;};
 const exports:Record<string,any>={};
 const code=ts.transpileModule(readFileSync(new URL('../app/EditorialPhotos.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{exports,window:{innerHeight:800,addEventListener:(k:string,fn:()=>void)=>events.set(k,fn),removeEventListener:(k:string)=>events.delete(k)},document:{querySelector:()=>main,documentElement:{classList:{contains:()=>covered}}},matchMedia:()=>({matches:reduced,addEventListener(){},removeEventListener(){}}),ResizeObserver:Observer,MutationObserver:Observer,Element:class{},requestAnimationFrame:queue,cancelAnimationFrame:(id:number)=>jobs.delete(id),require:(name:string)=>name==='react'?{useState:()=>[false,()=>{}],useLayoutEffect:(fn:()=>void)=>effects.push(fn)}:name==='next/navigation'?{usePathname:()=>'/galleri'}:name==='./Content'?{useContent:()=>({})}:name==='../lib/editorial-motion'?{frameGeometry,editorialSettings:()=>({enabled,frames,zoom,end:35,inset:24,radius:18})}:{afterPaint:(fn:()=>void)=>{const id=queue(fn);return()=>jobs.delete(id);}}});
 exports.default();effects.forEach(fn=>{const cleanup=fn();if(cleanup)cleanups.push(cleanup);});
 return {frame,image,values,jobs,events,observed,scroll:(y:number)=>{top=y;events.get('scroll')?.();},cover:(value:boolean)=>{covered=value;},paint:()=>{const list=[...jobs.values()];jobs.clear();list.forEach(fn=>fn());},cleanup:()=>cleanups.reverse().forEach(fn=>fn())};
}
test('framing follows both scroll directions, zoom settles once, and cleanup preserves crop/parallax',()=>{
 const h=harness();assert.equal(h.values.get('--editorial-inset'),'24.00px');assert.equal(h.image.dataset.photoZoom,'pending');
 h.scroll(540);h.paint();h.paint();assert.equal(h.values.get('--editorial-inset'),'12.00px');assert.equal(h.image.dataset.photoZoom,'settled');
 h.scroll(100);h.paint();assert.equal(h.values.get('--editorial-inset'),'0.00px');
 h.scroll(800);h.paint();assert.equal(h.values.get('--editorial-inset'),'24.00px');assert.equal(h.image.dataset.photoZoom,'settled');
 h.cleanup();assert.equal(h.jobs.size,0);assert.equal(h.events.size,0);assert.equal(h.observed.size,0);assert.equal(h.values.size,0);assert.equal(h.image.dataset.photoZoom,undefined);assert.equal(h.frame.dataset.editorialFrame,undefined);assert.equal(h.frame.dataset.editorialPhoto,undefined);
 assert.equal(h.image.style.transform,'translateY(3px)');assert.equal(h.image.style.objectPosition,'35% 60%');
});
test('master and system reduced motion prevent enrollment; individual switches remain independent',()=>{
 for(const h of [harness({reduced:true}),harness({enabled:false})]){assert.deepEqual(h.frame.dataset,{});assert.deepEqual(h.image.dataset,{});assert.equal(h.events.size,0);h.cleanup();}
 const zoomOnly=harness({frames:false});assert.equal(zoomOnly.frame.dataset.editorialFrame,undefined);assert.equal(zoomOnly.frame.dataset.editorialPhoto,'true');assert.equal(zoomOnly.image.dataset.photoZoom,'pending');zoomOnly.cleanup();
 const framesOnly=harness({zoom:false});assert.equal(framesOnly.frame.dataset.editorialFrame,'true');assert.deepEqual(framesOnly.image.dataset,{});framesOnly.cleanup();
});
test('menu coverage postpones new photo zoom and unmount cancels pending paints',()=>{
 const h=harness();h.cover(true);h.scroll(540);h.paint();assert.equal(h.image.dataset.photoZoom,'pending');h.cover(false);h.scroll(500);h.paint();assert.ok(h.jobs.size>0);h.cleanup();assert.equal(h.jobs.size,0);
});
