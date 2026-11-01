import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as transitions from '../lib/route-transition.ts';

function harness(reduced=false,enabled=true){
 const effects:Array<()=>void|(()=>void)>=[],cleanups:Array<()=>void>=[],listeners=new Map<string,(event:any)=>void>(),classes=new Set<string>(),timers=new Map<number,()=>void>();
 const warm:string[]=[],pushes:string[]=[],phases:string[]=[];let id=0;
 const region={inert:false};
 const query={matches:reduced,addEventListener(){},removeEventListener(){}};
 class Link{
  href='https://example.com/events';target='';rel='';download=false;menu=false;
  closest(selector:string){return selector==='a[href]'?this:this.menu?null:this;}
  hasAttribute(name:string){return name==='download'&&this.download;}
 }
 const exports:Record<string,any>={};
 const code=ts.transpileModule(readFileSync(new URL('../app/RouteCurtain.tsx',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,location:{href:'https://example.com/'},Element:Link,HTMLElement:Link,matchMedia:()=>query,document:{documentElement:{dataset:{motion:'full'},classList:{contains:(c:string)=>classes.has(c),toggle:(c:string,value:boolean)=>value?classes.add(c):classes.delete(c),remove:(...cs:string[])=>cs.forEach(c=>classes.delete(c))}},querySelectorAll:()=>[region],addEventListener:(key:string,fn:(event:any)=>void)=>listeners.set(key,fn),removeEventListener:(key:string)=>listeners.delete(key)},window:{setTimeout:(fn:()=>void)=>{timers.set(++id,fn);return id;},clearTimeout:(key:number)=>timers.delete(key),addEventListener:(key:string,fn:()=>void)=>listeners.set(key,fn),removeEventListener:(key:string)=>listeners.delete(key)},require:(name:string)=>name==='react'?{useLayoutEffect:(fn:()=>void)=>effects.push(fn),useRef:(value:unknown)=>({current:value}),useState:()=>['idle',(value:string)=>phases.push(value)]}:name==='next/navigation'?{usePathname:()=> '/',useRouter:()=>({prefetch:(href:string)=>warm.push(href),push:(href:string)=>pushes.push(href)})}:name==='./Content'?{useContent:()=>({text:enabled?{}:{'motion.routeTransition':'false'},images:{}})}:name==='../lib/route-transition'?transitions:name==='../lib/motion'?{afterPaint:()=>()=>{}}:{jsx:()=>null,jsxs:()=>null}});
 exports.default();effects.forEach(fn=>{const cleanup=fn();if(cleanup)cleanups.push(cleanup);});
 const click=(change:Partial<Link>={},options:Record<string,unknown>={})=>{
  const link=Object.assign(new Link(),change);let prevented=false;
  listeners.get('click')?.({target:link,button:0,preventDefault:()=>{prevented=true;},...options});return prevented;
 };
 return {click,listeners,classes,warm,pushes,phases,region,timers,cleanup:()=>cleanups.reverse().forEach(fn=>fn())};
}
test('ordinary links start one cover, block repeat routing, and cleanup restores inert state and listeners',()=>{
 const h=harness();assert.equal(h.click(),true);assert.deepEqual(h.warm,['/events']);assert.equal(h.pushes.length,0);assert.equal(h.region.inert,true);assert.ok(h.classes.has('route-covered'));
 h.click();assert.equal(h.warm.length,1);h.cleanup();assert.equal(h.timers.size,0);assert.equal(h.region.inert,false);assert.equal(h.listeners.size,0);assert.equal(h.classes.size,0);
});
test('modified clicks, downloads, other tabs, anchors, external links and menu navigation keep native behaviour',()=>{
 const h=harness();
 for(const options of [{button:1},{metaKey:true},{ctrlKey:true},{shiftKey:true},{altKey:true},{defaultPrevented:true}])assert.equal(h.click({},options),false);
 for(const change of [{download:true},{target:'_blank'},{href:'https://other.com/events'},{href:'https://example.com/#welcome'},{href:'https://example.com/admin'},{rel:'external'}])assert.equal(h.click(change),false);
 h.classes.add('menu-open');assert.equal(h.click(),false);assert.equal(h.warm.length,0);h.cleanup();
});
test('system Reduce Motion and the editor switch bypass interception completely',()=>{
 for(const h of [harness(true),harness(false,false)]){assert.equal(h.click(),false);assert.equal(h.warm.length,0);assert.equal(h.region.inert,false);h.cleanup();}
});
