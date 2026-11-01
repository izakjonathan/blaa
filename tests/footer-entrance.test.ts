import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function harness(reduced=false){
 let top=1100, cleanup=()=>{}, pulses=0, frameId=0;
 const listeners=new Map<string,(event?:unknown)=>void>(),frames=new Map<number,(time:number)=>void>(),scrolls:Array<{top:number;behavior:string}>=[];
 const footer={dataset:{} as Record<string,string>,getBoundingClientRect:()=>({top}),removeAttribute:()=>{delete footer.dataset.entered;}};
 const window={scrollY:0,innerHeight:1000,scrollTo:(value:{top:number;behavior:string})=>{top-=value.top-window.scrollY;window.scrollY=value.top;scrolls.push(value);},addEventListener:(event:string,fn:(event?:unknown)=>void)=>listeners.set(event,fn),removeEventListener:(event:string)=>listeners.delete(event)};
 const exports:Record<string,any>={};
 const code=ts.transpileModule(readFileSync(new URL('../app/useFooterEntrance.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(code,{exports,window,getComputedStyle:()=>({paddingTop:"160px"}),document:{querySelector:(selector:string)=>selector==='.brand-footer'?footer:{animate:()=>{pulses++;return {cancel(){}};}},documentElement:{classList:{contains:()=>false}}},requestAnimationFrame:(fn:(time:number)=>void)=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:(id:number)=>frames.delete(id),require:(name:string)=>name==='react'?{useEffect:(fn:()=>()=>void)=>{cleanup=fn();}}:{isReducedMotion:()=>reduced}});
 exports.useFooterEntrance('/om-os');
 const tick=(time=0)=>{const work=[...frames.values()];frames.clear();work.forEach(fn=>fn(time));};
 return {footer,scrolls,listeners,tick,get pulses(){return pulses;},move:(y:number,nextTop:number)=>{window.scrollY=y;top=nextTop;listeners.get('scroll')?.();tick();},cleanup:()=>cleanup()};
}
test('footer arrival takes 1500ms and accelerates then decelerates into its overscan target',()=>{
 const h=harness();h.move(100,850);assert.equal(h.footer.dataset.entered,'true');assert.equal(h.scrolls.length,0);
 h.move(250,700);assert.equal(h.pulses,1);h.tick(0);assert.equal(h.scrolls.at(-1)?.top,250);
 h.tick(375);const quarter=h.scrolls.at(-1)!.top;assert.ok(quarter>250&&quarter<465);
 h.tick(750);assert.ok(Math.abs(h.scrolls.at(-1)!.top-680)<.01);
 h.tick(1125);const threeQuarters=h.scrolls.at(-1)!.top;assert.ok(threeQuarters>895&&threeQuarters<1110);
 h.tick(1500);assert.equal(h.scrolls.at(-1)?.top,1110);
 const count=h.scrolls.length;h.tick(2000);assert.equal(h.scrolls.length,count);assert.ok(h.scrolls.every(s=>s.behavior==='instant'),'browser smoothing must not compete with the controlled animation');h.cleanup();
});
test('upward input cancels the arrival without recapturing until the footer has been left',()=>{
 const h=harness();h.move(250,700);h.tick(0);h.tick(300);const count=h.scrolls.length;
 h.listeners.get('wheel')?.({deltaY:-20});h.tick(1500);assert.equal(h.scrolls.length,count);
 h.move(200,750);h.move(300,650);assert.equal(h.pulses,1);
 h.move(0,1050);assert.equal(h.footer.dataset.entered,undefined);h.move(350,700);assert.equal(h.pulses,2);
 h.cleanup();h.tick(2000);assert.equal(h.listeners.size,0);assert.equal(h.scrolls.length,count);
});
test('new touch input cancels queued arrival frames immediately',()=>{
 const h=harness();h.move(250,700);h.tick(0);h.listeners.get('touchstart')?.();const count=h.scrolls.length;h.tick(1500);assert.equal(h.scrolls.length,count);h.cleanup();
});
test('reduced motion reveals the footer without automatic scrolling or a logo pulse',()=>{
 const h=harness(true);h.move(350,700);h.tick(0);h.tick(1500);
 assert.equal(h.footer.dataset.entered,'true');assert.equal(h.scrolls.length,0);assert.equal(h.pulses,0);h.cleanup();
});
