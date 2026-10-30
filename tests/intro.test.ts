import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { INTRO_BOOTSTRAP, createIntroBootstrap } from '../lib/intro-bootstrap.ts';

function boot(options: {path?:string; seen?:boolean; reduced?:boolean; hash?:string; search?:string; blockedStorage?:boolean; disabled?:boolean} = {}) {
  const dataset: Record<string,string> = {};
  const timers: {run:()=>void; delay:number}[] = [];
  const removed: string[] = [];
  runInNewContext(options.disabled ? createIntroBootstrap(false) : INTRO_BOOTSTRAP, {
    location:{pathname:options.path ?? '/',hash:options.hash ?? '',search:options.search ?? ''},
    document:{documentElement:{dataset,classList:{remove:(name:string)=>removed.push(name)}}},
    sessionStorage:{getItem:()=>{if(options.blockedStorage)throw new Error('Storage unavailable');return options.seen?'seen':null;}},
    matchMedia:()=>({matches:Boolean(options.reduced)}), URLSearchParams,
    window:{setTimeout:(run:()=>void,delay:number)=>timers.push({run,delay})},
  });
  return {dataset,timers,removed};
}
test('first home load is covered before hydration, even when storage is unavailable',()=>{
  for(const options of [{},{blockedStorage:true}]){
    const result=boot(options);
    assert.equal(result.dataset.introBoot,'splash');
    assert.equal(result.timers[0].delay,8000);
  }
});
test('early decision skips return visits, reduced motion, deep links and draft previews',()=>{
  for(const options of [{seen:true},{reduced:true},{hash:'#wine'},{search:'?preview=draft'}]){
    const result=boot(options);
    assert.equal(result.dataset.introBoot,'skip');
    assert.equal(result.timers.length,0);
  }
  assert.deepEqual(boot({path:'/investors'}).dataset,{});
  assert.deepEqual(boot({path:'/admin'}).dataset,{});
});
test('hydration failure releases the page, but never interrupts a normal splash exit',()=>{
  const failed=boot();failed.timers[0].run();
  assert.equal(failed.dataset.introBoot,'failed');
  assert.deepEqual(failed.removed,['brand-intro-active']);
  for(const phase of ['running','leaving','ready','skip']){
    const normal=boot();normal.dataset.introBoot=phase;normal.timers[0].run();
    assert.equal(normal.dataset.introBoot,phase);
    assert.deepEqual(normal.removed,[]);
  }
});


test('a published disabled splash skips before hydration without a covering frame', () => {
  const result = boot({ disabled:true });
  assert.equal(result.dataset.introBoot,'skip');
  assert.equal(result.timers.length,0);
});

test('explicit replay bypasses session memory but still respects reduced motion',()=>{
 assert.equal(boot({seen:true,search:'?intro=replay'}).dataset.introBoot,'splash');
 assert.equal(boot({seen:true,reduced:true,search:'?intro=replay'}).dataset.introBoot,'skip');
});
