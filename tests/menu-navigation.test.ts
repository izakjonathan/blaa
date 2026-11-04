import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

type VNode={type:unknown;props:Record<string,any>};
function harness(initialPath='/',leaveConfirmed=true){
 let pathname=initialPath,cursor=0,tree:VNode;
 const dataset={adminUnsaved:'false'},confirmations:string[]=[];
 const slots:any[]=[],jobs:Array<()=>void>=[],frames=new Map<number,()=>void>(),classes=new Set<string>();
 const prefetches:string[]=[];
 const pushes:unknown[][]=[],scrolls:unknown[]=[];let frame=0;
 const schedule=(fn:()=>void,deps?:unknown[])=>{const i=cursor++,old=slots[i];if(!old||!deps||deps.some((v,j)=>v!==old.deps?.[j])){jobs.push(()=>{old?.cleanup?.();slots[i]={deps,cleanup:fn()};});}};
 const react={useState:(value:unknown)=>{const i=cursor++;if(!(i in slots))slots[i]=value;return [slots[i],(v:unknown)=>{slots[i]=v;}];},useRef:(value:unknown)=>{const i=cursor++;return slots[i]??(slots[i]={current:value});},useCallback:(fn:unknown)=>fn,useEffect:schedule,useLayoutEffect:schedule};
 const jsx=(type:unknown,props:Record<string,any>)=>({type,props});
 const motion={afterPaint:(fn:()=>void)=>{let second=0;const first=raf(()=>{second=raf(fn);});return()=>{frames.delete(first);frames.delete(second);};},isReducedMotion:()=>false,cssTimeMs:()=>480};
 function raf(fn:()=>void){frames.set(++frame,fn);return frame;}
 const exports:Record<string,any>={};
 const code=ts.transpileModule(readFileSync(new URL('../app/SiteShell.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,requestAnimationFrame:raf,setTimeout:()=>1,clearTimeout(){},document:{documentElement:{dataset,classList:{add:(c:string)=>classes.add(c),remove:(c:string)=>classes.delete(c),toggle:(c:string,on:boolean)=>on?classes.add(c):classes.delete(c)}},querySelectorAll:()=>[],addEventListener(){},removeEventListener(){},activeElement:null},window:{confirm:(message:string)=>{confirmations.push(message);return leaveConfirmed;},scrollTo:(o:unknown)=>scrolls.push(o)},require:(name:string)=>name==='react'?react:name==='react/jsx-runtime'?{jsx,jsxs:jsx,Fragment:'fragment'}:name==='next/navigation'?{usePathname:()=>pathname,useRouter:()=>({prefetch:(href:string)=>prefetches.push(href),push:(...args:unknown[])=>pushes.push(args)})}:name.includes('useHeaderTone')?{useHeaderTone:()=> ({logo:'gold',menu:'gold'})}:name.includes('useFooterEntrance')?{useFooterEntrance:()=>{}}:name.includes('motion')?motion:{default:'component'}});
 function render(){cursor=0;const shell=exports.default({children:null});tree=shell.type(shell.props);while(jobs.length)jobs.shift()!();return tree;}
 function nodes(node:any):VNode[]{if(!node||typeof node!=='object')return [];return [node,...[node.props?.children].flat(Infinity).flatMap(nodes)];}
 function menu(){return nodes(tree).find(n=>n.props.className==='site-menu');}
 function paint(){const work=[...frames.values()];frames.clear();work.forEach(fn=>fn());}
 function open(){render();nodes(tree).find(n=>n.props.className==='burger-button')!.props.onClick({detail:1});render();paint();paint();render();}
 function choose(href:string){nodes(tree).find(n=>n.props.href===href&&n.props.onClick&&Object.hasOwn(n.props,'aria-current'))!.props.onClick({preventDefault(){},metaKey:false,ctrlKey:false,shiftKey:false,altKey:false});}
 return {dataset,confirmations,open,choose,render,paint,menu,pushes,prefetches,scrolls,classes,route:(p:string)=>{pathname=p;render();},unmount:()=>slots.forEach(s=>s?.cleanup?.())};
}
test('menu route selection disables Next scrolling and jumps instantly before revealing the destination',()=>{
 const h=harness();h.open();h.choose('/om-os');
 assert.equal(JSON.stringify(h.pushes),JSON.stringify([['/om-os',{scroll:false}]]));
 assert.ok(h.classes.has('menu-navigating'));assert.equal(h.scrolls.length,0);
 h.route('/om-os');
 assert.equal(JSON.stringify(h.scrolls),JSON.stringify([{top:0,left:0,behavior:'instant'}]));
 assert.equal(h.menu()!.props['data-phase'],'open');
 h.paint();h.render();assert.equal(h.menu()!.props['data-phase'],'open');
 h.paint();h.render();assert.equal(h.menu()!.props['data-phase'],'closing');
 const target={};h.menu()!.props.onTransitionEnd({target,currentTarget:target,propertyName:'transform'});h.render();
 assert.equal(h.menu(),undefined);assert.ok(!h.classes.has('menu-navigating'));h.unmount();
});
test('choosing the current route closes the menu without any scrolling',()=>{
 const h=harness();h.open();h.choose('/');h.render();
 assert.equal(h.pushes.length,0);assert.equal(h.scrolls.length,0);assert.equal(h.menu()!.props['data-phase'],'closing');h.unmount();
});
test('unmount cancels the covered handoff and clears temporary scroll suppression',()=>{
 const h=harness();h.open();h.choose('/om-os');h.route('/om-os');h.unmount();h.paint();h.paint();
 assert.ok(!h.classes.has('menu-navigating'));assert.ok(!h.classes.has('menu-open'));
});

test('opening the menu warms every other destination before a selection',()=>{
 const h=harness();h.open();
 assert.deepEqual(h.prefetches,['/events','/om-os','/galleri','/spil-hos-os','/kunst','/kontakt']);
 h.unmount();
});

for(const confirmed of [false,true])test(`backend menu ${confirmed?'allows':'cancels'} leaving unsaved changes after confirmation`,()=>{
 const h=harness('/admin/editor',confirmed);h.open();h.dataset.adminUnsaved='true';h.choose('/admin/stock');
 assert.equal(h.confirmations.length,1);
 assert.equal(h.pushes.length,confirmed?1:0);
 assert.equal(h.classes.has('menu-navigating'),confirmed);h.unmount();
});
