import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
test('font readiness after a heading unmount cannot schedule fresh layout work',async()=>{
 let effect:()=>()=>void=()=>()=>{};let frames=0;
 let fontsReady:()=>void=()=>{};const ready=new Promise<void>(resolve=>{fontsReady=resolve;});
 const heading={classList:{remove(){}}};const text={parentElement:heading};const layer={replaceChildren(){}};let refs=0;
 const exports:Record<string,unknown>={};
 const code=ts.transpileModule(readFileSync(new URL('../app/Heading.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,require:(name:string)=>name==='react'?{useRef:()=>({current:refs++?layer:text}),useLayoutEffect:(fn:typeof effect)=>{effect=fn;}}:{jsx:()=>null,jsxs:()=>null},document:{fonts:{ready}},ResizeObserver:class{observe(){}disconnect(){}},MutationObserver:class{observe(){}disconnect(){}},requestAnimationFrame:()=>++frames,cancelAnimationFrame(){}});
 (exports.default as (props:object)=>unknown)({children:'Title'});const cleanup=effect();cleanup();const before=frames;
 fontsReady();await Promise.resolve();assert.equal(frames,before);
});
