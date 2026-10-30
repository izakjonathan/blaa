import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('first-visit splash loads the masked logo without calling image methods on its span', async () => {
  const source = readFileSync(new URL('../app/LandingHero.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  let effect: (()=>void) | undefined;
  let decoded = '';
  const root={dataset:{},classList:{add(){},remove(){}}};
  const exports: Record<string, any> = {};
  const sandbox={exports,require:(name:string)=>{
    if(name==='react')return {useState:()=>['splash',()=>{}],useRef:()=>({current:{querySelector:()=>({tagName:'SPAN'}),querySelectorAll:()=>[{decode:()=>new Promise(()=>{})}]}}),useLayoutEffect:(callback:()=>void)=>{effect=callback;}};
    if(name==='react/jsx-runtime')return {jsx:()=>null,jsxs:()=>null};
    if(name==='./Content')return {useContent:()=>({})};
    if(name==='../lib/splash')return {splashSettings:()=>({enabled:true,duration:1000,showLogo:true,showBottle:true})};
    if(name==='../lib/motion')return {isReducedMotion:()=>false};
    return {};
  },document:{documentElement:root,fonts:{ready:Promise.resolve()},addEventListener(){},removeEventListener(){}},window:{scrollY:0},matchMedia:()=>({addEventListener(){},removeEventListener(){}}),location:{hash:'',search:''},sessionStorage:{getItem:()=>null,setItem(){}},URLSearchParams,Image:class{src='';decode(){decoded=this.src;return Promise.resolve();}},setTimeout:()=>1,clearTimeout(){}};
  vm.runInNewContext(compiled,sandbox);
  exports.default();
  assert.ok(effect);
  let cleanup: unknown;
  assert.doesNotThrow(()=>{cleanup=effect!();});
  await Promise.resolve();
  assert.equal(decoded,'/kroteket/5f84ffc1-logoblaagardsapotekh-1300x768-1.png');
  assert.equal((root.dataset as Record<string,string>).introBoot,'running');
  if(typeof cleanup==='function')cleanup();
});
