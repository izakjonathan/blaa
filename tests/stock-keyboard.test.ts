import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('stock editing hides the save bar for a soft keyboard, restores it on blur and cleans up listeners',()=>{
 let open=false,editing=false,cleanup:()=>void=()=>{};
 const listeners=new Map<string,()=>void>(),frames=new Map<number,()=>void>();let frame=0;
 const surface=(prefix:string)=>({addEventListener:(name:string,fn:()=>void)=>listeners.set(prefix+name,fn),removeEventListener:(name:string)=>listeners.delete(prefix+name)});
 const viewport={height:800,...surface('viewport:')},window={innerHeight:800,visualViewport:viewport,...surface('window:')};
 const exports:any={};
 const source=ts.transpileModule(readFileSync(new URL('../app/admin/stock/useStockKeyboard.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(source,{exports,window,document:{activeElement:{matches:()=>editing},...surface('document:')},requestAnimationFrame:(fn:()=>void)=>{frames.set(++frame,fn);return frame;},cancelAnimationFrame:(id:number)=>frames.delete(id),require:()=>({useState:()=>[open,(value:boolean)=>{open=value;}],useEffect:(effect:()=>()=>void)=>{cleanup=effect();}})});
 exports.useStockKeyboard();assert.equal(open,false);
 editing=true;listeners.get('document:focusin')!();for(const fn of frames.values())fn();frames.clear();assert.equal(open,false,'hardware keyboard leaves the full-height viewport available');
 window.innerHeight=420;viewport.height=420;listeners.get('viewport:resize')!();assert.equal(open,true,'a resizing WebView must still detect the keyboard');
 editing=false;listeners.get('document:focusout')!();for(const fn of frames.values())fn();assert.equal(open,false);
 window.innerHeight=800;viewport.height=800;listeners.get('window:resize')!();assert.equal(open,false);
 cleanup();assert.equal(listeners.size,0);assert.equal(frames.size,0);
});
