import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function harness(reduced=false){
 let top=1100, cleanup=()=>{}, pulses=0;
 const listeners=new Map<string,(event?:unknown)=>void>(),frames:Array<()=>void>=[],scrolls:Array<{top:number;behavior:string}>=[];
 const footer={dataset:{} as Record<string,string>,getBoundingClientRect:()=>({top}),removeAttribute:()=>{delete footer.dataset.entered;}};
 const window={scrollY:0,innerHeight:1000,scrollTo:(value:{top:number;behavior:string})=>scrolls.push(value),addEventListener:(event:string,fn:(event?:unknown)=>void)=>listeners.set(event,fn),removeEventListener:(event:string)=>listeners.delete(event)};
 const exports:Record<string,any>={};
 const code=ts.transpileModule(readFileSync(new URL('../app/useFooterEntrance.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(code,{exports,window,getComputedStyle:()=>({paddingTop:"160px"}),document:{querySelector:(selector:string)=>selector==='.brand-footer'?footer:{animate:()=>{pulses++;return {cancel(){}};}},documentElement:{classList:{contains:()=>false}}},requestAnimationFrame:(fn:()=>void)=>{frames.push(fn);return frames.length;},cancelAnimationFrame(){},require:(name:string)=>name==='react'?{useEffect:(fn:()=>()=>void)=>{cleanup=fn();}}:{isReducedMotion:()=>reduced}});
 exports.useFooterEntrance('/om-os');
 return {footer,scrolls,listeners,get pulses(){return pulses;},move:(y:number,nextTop:number)=>{window.scrollY=y;top=nextTop;listeners.get('scroll')?.();frames.shift()?.();},cleanup:()=>cleanup()};
}
test('footer reveals early, settles once per downward approach and releases upward input',()=>{
 const h=harness();
 h.move(100,850);assert.equal(h.footer.dataset.entered,'true');assert.equal(h.scrolls.length,0);
 h.move(250,700);assert.equal(h.scrolls.length,1);assert.equal(h.scrolls[0].top,1110);assert.equal(h.scrolls[0].behavior,'smooth');assert.equal(h.pulses,1);
 h.listeners.get('wheel')?.({deltaY:-20});assert.equal(h.scrolls[1].behavior,'instant');
 h.move(200,750);h.move(300,650);assert.equal(h.pulses,1,'no recapture during an interrupted arrival');
 h.move(0,1050);assert.equal(h.footer.dataset.entered,undefined);
 h.move(350,700);assert.equal(h.pulses,2,'rearm only after leaving the footer');
 h.cleanup();assert.equal(h.listeners.size,0);
});
test('reduced motion reveals the footer without automatic scrolling or a logo pulse',()=>{
 const h=harness(true);h.move(350,700);
 assert.equal(h.footer.dataset.entered,'true');assert.equal(h.scrolls.length,0);assert.equal(h.pulses,0);h.cleanup();
});
