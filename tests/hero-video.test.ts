import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDocument, validateDocument } from '../lib/content-schema.ts';
import { heroVideoSettings } from '../lib/hero-video.ts';

test('existing documents gain video defaults without changing saved content', () => {
  const legacy = validateDocument({text: {'experience.hero.title': 'Existing title'}, images: {}});
  assert.deepEqual(heroVideoSettings(legacy), {color:'#1A1E3A', opacity:45, saturation:100});
  assert.equal(legacy.text['experience.hero.title'], 'Existing title');
  assert.deepEqual(heroVideoSettings(emptyDocument), heroVideoSettings(legacy));
});

test('video treatment survives validation and rejects invalid editor values', () => {
  const text = {'experience.hero.videoOverlayColor':'#3366ff', 'experience.hero.videoOverlayOpacity':'0', 'experience.hero.videoSaturation':'200'};
  const roundtrip = validateDocument(JSON.parse(JSON.stringify(validateDocument({text, images:{}}))));
  assert.deepEqual(heroVideoSettings(roundtrip), {color:'#3366ff',opacity:0,saturation:200});
  for (const [key,value] of [['videoOverlayColor','red'], ['videoOverlayColor','#fff;display:none'], ['videoOverlayOpacity','101'], ['videoOverlayOpacity','-1'], ['videoSaturation','201'], ['videoSaturation','NaN'], ['videoSaturation','']]) {
    assert.throws(() => validateDocument({text:{['experience.hero.'+key]:value},images:{}}));
  }
});

// Exercise playback policy with a controlled browser environment, including
// rejected autoplay, reduced motion and the visitor's explicit pause choice.
test('playback respects reduced motion, visibility and manual pause', async () => {
  const {readFileSync} = await import('node:fs');
  const {default: ts} = await import('typescript');
  const {default: vm} = await import('node:vm');
  const source = readFileSync(new URL('../app/HeroVideo.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  let effect: (() => (() => void)) | undefined;
  let playCalls = 0, pauseCalls = 0;
  const media = {paused:true, play(){playCalls++;this.paused=false;return Promise.reject(new Error('Autoplay blocked'));},pause(){pauseCalls++;this.paused=true;}};
  const reduced = {matches:true, addEventListener(_name:string,fn:()=>void){listeners.reduced=fn;},removeEventListener(){delete listeners.reduced;}};
  const listeners: Record<string,()=>void> = {};
  const document = {hidden:false,addEventListener(_name:string,fn:()=>void){listeners.visibility=fn;},removeEventListener(){delete listeners.visibility;}};
  const jsx = (type:unknown,props:Record<string,unknown>) => ({type,props});
  const exports: {default?: () => {props:{children:{type:unknown;props:Record<string,unknown>}[]}}} = {};
  vm.runInNewContext(compiled,{exports,document,matchMedia:()=>reduced,require:(name:string)=>{
    if(name==='react')return {useEffect:(fn:typeof effect)=>{effect=fn;},useRef:(value:unknown)=>({current:value===null?media:value}),useState:()=>[false,()=>{}]};
    if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'fragment'};
    if(name==='./Content')return {useContent:()=>emptyDocument};
    if(name==='../lib/hero-video')return {heroVideoSettings};
    throw new Error(name);
  }});
  const tree = exports.default!();
  const cleanup = effect!();
  assert.equal(playCalls,0);
  assert.equal(pauseCalls,1);
  reduced.matches=false;listeners.reduced();await Promise.resolve();
  assert.equal(playCalls,1); // Rejection is handled without breaking the page.
  const toggle=tree.props.children.find(child=>child.type==='button')!.props.onClick as ()=>void;
  toggle(); // Explicitly pause the playing media.
  document.hidden=true;listeners.visibility();document.hidden=false;listeners.visibility();
  assert.equal(playCalls,1); // A return to the tab must not undo a manual pause.
  toggle();await Promise.resolve();assert.equal(playCalls,2);
  cleanup();assert.deepEqual(listeners,{});
});
