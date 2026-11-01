import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import {frameGeometry,letterDelay,editorialSettings} from '../lib/editorial-motion.ts';
import {animationStyle} from '../lib/animation-settings.ts';
import {emptyDocument,validateDocument} from '../lib/content-schema.ts';

test('frame progress is bounded, reversible and independent of page layout',()=>{
 assert.deepEqual(frameGeometry(900,800,35,24,18),{inset:24,radius:18});
 assert.deepEqual(frameGeometry(280,800,35,24,18),{inset:0,radius:0});
 const middle=frameGeometry(540,800,35,24,18);
 assert.deepEqual(middle,{inset:12,radius:9});
 for(let top=-500;top<=1500;top+=5){
  const value=frameGeometry(top,800,35,24,18);
  assert.ok(value.inset>=0&&value.inset<=24);
  assert.ok(value.radius>=0&&value.radius<=18);
 }
 assert.deepEqual(frameGeometry(540,800,35,24,18),middle,'scroll reversal has no retained momentum');
});
test('long headings cap the letter cascade at 300ms',()=>{
 assert.equal(letterDelay(5,10,18),90);
 assert.equal(letterDelay(99,100,40),300);
 assert.equal(letterDelay(0,1,18),0);
});
test('editorial controls validate, round-trip and inherit defaults',()=>{
 assert.equal(editorialSettings(emptyDocument).letters,true);
 const doc=validateDocument(JSON.parse(JSON.stringify({text:{'motion.headingLetters':'false','motion.frameInset':'40','motion.frameEnd':'50','motion.photoZoomAmount':'8','motion.menuDividers':'false'},images:{}})));
 assert.equal(editorialSettings(doc).letters,false);assert.equal(editorialSettings(doc).inset,40);
 assert.match(animationStyle(doc),/--photo-zoom-start:1.08/);
 assert.match(animationStyle(doc),/transition:none;transform:scaleX\(1\)/);
 for(const [id,value] of [['frameInset','61'],['headingStagger','-1'],['photoZoomAmount','100'],['frameEnd','0']])assert.throws(()=>validateDocument({text:{['motion.'+id]:value},images:{}}));
});
test('menu label preserves one accessible formatted source and hides rolling duplicates',()=>{
 const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const exports:Record<string,any>={};
 const code=ts.transpileModule(readFileSync(new URL('../app/MenuLabel.tsx',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,require:(name:string)=>name==='./Content'?{useContent:()=>emptyDocument,Copy:()=>React.createElement('span',null,'Om os')}:name==='../lib/content-schema'?{textValue:()=> 'Om os'}:name==='../lib/editorial-motion'?{editorialSettings:()=>({roll:true})}:require(name)});
 const html=renderToStaticMarkup(React.createElement(exports.default,{field:'shared.menu.2.label'}));
 assert.match(html,/menu-label-source"><span>Om os<\/span>/);
 assert.match(html,/menu-label-visual" aria-hidden="true"/);
 assert.equal((html.match(/class="menu-letter-track"/g)||[]).length,5);
});
