import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDocument, validateDocument } from '../lib/content-schema.ts';
import { heroVideoSettings } from '../lib/hero-video.ts';

test('existing documents gain video defaults without changing saved content', () => {
  const legacy = validateDocument({text: {'experience.hero.title': 'Existing title'}, images: {}});
  assert.deepEqual(heroVideoSettings(legacy), {color:'#1A1E3A', opacity:55, saturation:100});
  assert.equal(legacy.text['experience.hero.title'], 'Existing title');
  assert.deepEqual(heroVideoSettings(emptyDocument), heroVideoSettings(legacy));
});

test('video treatment survives validation and rejects invalid editor values', () => {
  const text = {'brand.photoTreatment':'per-image','experience.hero.videoOverlayColor':'#3366ff', 'experience.hero.videoOverlayOpacity':'0', 'experience.hero.videoSaturation':'200'};
  const roundtrip = validateDocument(JSON.parse(JSON.stringify(validateDocument({text, images:{}}))));
  assert.deepEqual(heroVideoSettings(roundtrip), {color:'#3366ff',opacity:0,saturation:200});
  for (const [key,value] of [['videoOverlayColor','red'], ['videoOverlayColor','#fff;display:none'], ['videoOverlayOpacity','101'], ['videoOverlayOpacity','-1'], ['videoSaturation','201'], ['videoSaturation','NaN'], ['videoSaturation','']]) {
    assert.throws(() => validateDocument({text:{['experience.hero.'+key]:value},images:{}}));
  }
});

// Exercise playback policy with a controlled browser environment, including
// rejected autoplay, media readiness, non-interaction and background tabs.
test('background starts without gestures, has no controls and resumes when visible', async () => {
  const {readFileSync} = await import('node:fs');
  const {default: ts} = await import('typescript');
  const {default: vm} = await import('node:vm');
  const source = readFileSync(new URL('../app/HeroVideo.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  let effect: (() => (() => void)) | undefined;
  let dependencies: unknown[] = [];
  let playCalls = 0, pauseCalls = 0;
  let playing = false;
  let stateCalls = 0;
  let blocked = true;
  const mediaListeners: Record<string,()=>void> = {};
  const media = {paused:true, muted:false, defaultMuted:false, playsInline:false,
    play(){playCalls++;if(blocked)return Promise.reject(new Error('Autoplay blocked'));this.paused=false;return Promise.resolve();},
    pause(){pauseCalls++;this.paused=true;},
    addEventListener(name:string,fn:()=>void){mediaListeners[name]=fn;},
    removeEventListener(name:string){delete mediaListeners[name];}};
  const listeners: Record<string,()=>void> = {};
  const document = {hidden:false,addEventListener(name:string,fn:()=>void){listeners[name]=fn;},removeEventListener(name:string){delete listeners[name];}};
  const jsx = (type:unknown,props:Record<string,unknown>) => ({type,props});
  const exports: {default?: (props?: {revealed?: boolean}) => {props:{children:{type:unknown;props:Record<string,unknown>}[]}}} = {};
  vm.runInNewContext(compiled,{exports,document,matchMedia:()=>({matches:true}),require:(name:string)=>{
    if(name==='react')return {useEffect:(fn:typeof effect,deps:unknown[])=>{effect=fn;dependencies=deps;},useRef:()=>({current:media}),useState:()=>stateCalls++%2===0?[playing,(value:boolean)=>{playing=value;}]:[false,()=>{}]};
    if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'fragment'};
    if(name==='./Content')return {useContent:()=>emptyDocument};
    if(name==='../lib/hero-video')return {heroVideoSettings};
    throw new Error(name);
  }});
  const tree = exports.default!({revealed:false});
  assert.equal(dependencies[0],false);
  const cleanup = effect!();
  await Promise.resolve();
  assert.equal(playCalls,1); // Autoplay is attempted immediately, even with reduced motion.
  assert.equal(pauseCalls,0);
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
  assert.equal(video.onClick,undefined);
  assert.equal(video.onTouchEnd,undefined);
  assert.equal(video.onPointerDown,undefined);
  assert.deepEqual(Object.keys(listeners),['visibilitychange']);
  blocked=false;mediaListeners.canplay();await Promise.resolve();
  assert.equal(playCalls,2); // Media readiness retries without a user gesture.
  mediaListeners.loadeddata();assert.equal(playCalls,2); // No redundant play calls.
  document.hidden=true;listeners.visibilitychange();assert.equal(media.paused,true);
  mediaListeners.pause();assert.equal(playCalls,2); // Hidden tabs stay paused.
  document.hidden=false;listeners.visibilitychange();await Promise.resolve();assert.equal(playCalls,3);
  media.paused=true;mediaListeners.pause();await Promise.resolve();assert.equal(playCalls,4);
  const {readFileSync:readCSS}=await import('node:fs');
  assert.match(readCSS(new URL('../app/landing.css',import.meta.url),'utf8'), /\.hero-video\s*\{[^}]*pointer-events:\s*none/);
  cleanup();assert.deepEqual(listeners,{});
  assert.deepEqual(mediaListeners,{});
  // A splash reveal retries even if readiness events already fired while hidden.
  exports.default!({revealed:true});
  assert.equal(dependencies[0],true);
  const revealCleanup=effect!();
  await Promise.resolve();
  assert.equal(playCalls,5);
  assert.equal(media.paused,false);
  revealCleanup();
});

test('native MP4 image selection handles cached loads and decoding failure without leaving a video player', async () => {
  const {readFileSync} = await import('node:fs');
  const {default: ts} = await import('typescript');
  const {default: vm} = await import('node:vm');
  const compiled = ts.transpileModule(readFileSync(new URL('../app/HeroVideo.tsx', import.meta.url), 'utf8'),
    {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  type Element = {type:string;props:Record<string,unknown>};
  const exports: {default?: () => {props:{children:Element[]}}} = {};
  const states = [false,false];
  let stateIndex=0, refIndex=0, playCalls=0;
  const effects: Array<()=>void | (()=>void)> = [];
  const image = {complete:true,naturalWidth:1920,currentSrc:'https://example.test/kroteket/hero-original-v4.mp4'};
  const media = {paused:true,muted:false,defaultMuted:false,playsInline:false,
    play(){playCalls++;this.paused=false;return Promise.resolve();},pause(){this.paused=true;},
    addEventListener(){},removeEventListener(){}};
  const refs = [media,image];
  const jsx = (type:string,props:Record<string,unknown>)=>({type,props});
  vm.runInNewContext(compiled,{exports,document:{hidden:false,addEventListener(){},removeEventListener(){}},require:(name:string)=>{
    if(name==='react')return {
      useRef:()=>({current:refs[refIndex++]}),
      useState:()=>{const index=stateIndex++;return [states[index],(value:boolean)=>{states[index]=value;}];},
      useEffect:(effect:()=>void | (()=>void))=>{effects.push(effect);},
    };
    if(name==='react/jsx-runtime')return {jsx,jsxs:jsx};
    if(name==='./Content')return {useContent:()=>emptyDocument};
    if(name==='../lib/hero-video')return {heroVideoSettings};
    throw new Error(name);
  }});
  const render = () => {stateIndex=0;refIndex=0;effects.length=0;return exports.default!();};
  const pictureIn = (tree:ReturnType<typeof render>) => tree.props.children.find(child=>child.type==='picture')!;
  const imageIn = (tree:ReturnType<typeof render>) => (pictureIn(tree).props.children as Element[]).find(child=>child.type==='img')!;
  const serverTree=render();
  const source=(pictureIn(serverTree).props.children as Element[]).find(child=>child.type==='source')!;
  assert.equal(source.props.type,'video/mp4');
  assert.equal(source.props.srcSet,'/kroteket/hero-original-v4.mp4');
  assert.equal(imageIn(serverTree).props.loading,'eager');
  // The cached image completed before React attached onLoad; mount still finds it.
  effects[0]();
  assert.equal(states[1],true);
  const nativeTree=render();
  assert.equal(pictureIn(nativeTree).props['data-active'],true);
  assert.equal(nativeTree.props.children.some(child=>child.type==='video'),false);
  effects[1]();assert.equal(playCalls,0); // No video-player playback on the image path.
  const img=imageIn(nativeTree).props;
  assert.equal(img.onClick,undefined);assert.equal(img.onTouchEnd,undefined);
  (img.onError as ()=>void)();
  const failedTree=render();
  assert.equal(pictureIn(failedTree).props['data-active'],false);
  assert.equal(failedTree.props.children.some(child=>child.type==='video'),true);
  // Browsers choosing the JPEG fallback must retain the regular video renderer.
  image.currentSrc='https://example.test/kroteket/hero-poster-v4.jpg';
  (imageIn(failedTree).props.onLoad as (event:{currentTarget:typeof image})=>void)({currentTarget:image});
  assert.equal(states[1],false);
  const fallbackTree=render();
  const cleanup=effects[1]();await Promise.resolve();assert.equal(playCalls,1);
  if(cleanup)cleanup();
  image.currentSrc='https://example.test/kroteket/hero-original-v4.mp4';image.naturalWidth=0;
  (imageIn(fallbackTree).props.onLoad as (event:{currentTarget:typeof image})=>void)({currentTarget:image});
  assert.equal(states[1],false); // A failed decode never displaces the working fallback.
});
