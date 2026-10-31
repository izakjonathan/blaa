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
// rejected autoplay, gesture retries, reduced motion and background tabs.
test('background autoplay has no controls and respects reduced motion and visibility', async () => {
  const {readFileSync} = await import('node:fs');
  const {default: ts} = await import('typescript');
  const {default: vm} = await import('node:vm');
  const source = readFileSync(new URL('../app/HeroVideo.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  let effect: (() => (() => void)) | undefined;
  let playCalls = 0, pauseCalls = 0;
  let playing = false;
  let blocked = true;
  const mediaListeners: Record<string,()=>void> = {};
  const media = {paused:true, muted:false, defaultMuted:false, playsInline:false,
    play(){playCalls++;if(blocked)return Promise.reject(new Error('Autoplay blocked'));this.paused=false;return Promise.resolve();},
    pause(){pauseCalls++;this.paused=true;},
    addEventListener(name:string,fn:()=>void){mediaListeners[name]=fn;},
    removeEventListener(name:string){delete mediaListeners[name];}};
  const reduced = {matches:true, addEventListener(_name:string,fn:()=>void){listeners.reduced=fn;},removeEventListener(){delete listeners.reduced;}};
  const listeners: Record<string,()=>void> = {};
  const document = {hidden:false,addEventListener(name:string,fn:()=>void){listeners[name]=fn;},removeEventListener(name:string){delete listeners[name];}};
  const jsx = (type:unknown,props:Record<string,unknown>) => ({type,props});
  const exports: {default?: () => {props:{children:{type:unknown;props:Record<string,unknown>}[]}}} = {};
  vm.runInNewContext(compiled,{exports,document,matchMedia:()=>reduced,require:(name:string)=>{
    if(name==='react')return {useEffect:(fn:typeof effect)=>{effect=fn;},useRef:()=>({current:media}),useState:()=>[playing,(value:boolean)=>{playing=value;}]};
    if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'fragment'};
    if(name==='./Content')return {useContent:()=>emptyDocument};
    if(name==='../lib/hero-video')return {heroVideoSettings};
    throw new Error(name);
  }});
  const tree = exports.default!();
  const cleanup = effect!();
  assert.equal(playCalls,0);
  assert.equal(pauseCalls,1);
  assert.equal(media.muted,true);
  assert.equal(media.defaultMuted,true);
  assert.equal(media.playsInline,true);
  const video=tree.props.children.find(child=>child.type==='video')!.props;
  assert.equal(video.autoPlay,true);
  assert.equal(video.muted,true);
  assert.equal(video.loop,true);
  assert.equal(video.playsInline,true);
  assert.equal(video.controls,false);
  assert.equal(video['data-playing'],false); // Native overlay stays hidden until actual playback.
  const onPlaying=video.onPlaying as ()=>void;
  const onPause=video.onPause as ()=>void;
  const onError=video.onError as ()=>void;
  onPlaying();assert.equal(playing,true);
  assert.equal(exports.default!().props.children.find(child=>child.type==='video')!.props['data-playing'],true);
  onPause();assert.equal(playing,false);
  onPlaying();onError();assert.equal(playing,false);
  assert.equal(tree.props.children.some(child=>child.type==='button'),false);
  listeners.pointerdown();assert.equal(playCalls,0); // Taps respect reduced motion.
  reduced.matches=false;listeners.reduced();await Promise.resolve();
  assert.equal(playCalls,1); // Rejection is handled without breaking the page.
  blocked=false;listeners.touchend();await Promise.resolve();assert.equal(playCalls,2);
  mediaListeners.loadeddata();listeners.pointerdown();assert.equal(playCalls,2); // No redundant play calls.
  document.hidden=true;listeners.visibilitychange();assert.equal(media.paused,true);
  listeners.pointerdown();assert.equal(playCalls,2); // Hidden tabs stay paused.
  document.hidden=false;listeners.visibilitychange();await Promise.resolve();assert.equal(playCalls,3);
  reduced.matches=true;listeners.reduced();assert.equal(media.paused,true);
  cleanup();assert.deepEqual(listeners,{});
  assert.deepEqual(mediaListeners,{});
});
