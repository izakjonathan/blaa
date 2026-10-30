import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runSplashSequence,type SplashTarget} from '../lib/splash-sequence.ts';
test('splash orders backdrop, separate marks, mark exit and direct hero crossfade',async()=>{
 const calls:string[]=[];
 await runSplashSequence({active:()=>true,showBottle:true,showLogo:true,hold:1450,
 animate:async(target,visible,duration,delay=0)=>{calls.push(`${target}:${visible}:${duration}:${delay}`);},
 wait:async(ms)=>{calls.push(`hold:${ms}`);},hero:()=>calls.push('hero'),complete:()=>calls.push('complete')});
 assert.deepEqual(calls,['backdrop:true:850:0','bottle:true:850:0','logo:true:850:250','hold:1450','logo:false:450:0','bottle:false:500:100','hero','plate:false:850:0','complete']);
});
test('interruption prevents later phases and disabled marks are never animated',async()=>{
 let active=true;const calls:SplashTarget[]=[];
 await runSplashSequence({active:()=>active,showBottle:false,showLogo:false,hold:500,
 animate:async(target)=>{calls.push(target);},wait:async()=>{active=false;},hero:()=>assert.fail('stale hero handoff'),complete:()=>assert.fail('stale completion')});
 assert.deepEqual(calls,['backdrop']);
});

test('hero readiness gates the handoff while the splash backdrop stays visible',async()=>{
 const calls:string[]=[];let release!:()=>void;
 const ready=new Promise<void>(resolve=>{release=resolve;});
 const running=runSplashSequence({active:()=>true,showBottle:false,showLogo:false,hold:0,
 animate:async(target,visible)=>{calls.push(`${target}:${visible}`);},wait:async()=>{},
 prepareHero:()=>ready,hero:()=>calls.push('hero'),complete:()=>calls.push('complete')});
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(calls,['backdrop:true']);
 release();await running;
 assert.deepEqual(calls,['backdrop:true','hero','plate:false','complete']);
});
