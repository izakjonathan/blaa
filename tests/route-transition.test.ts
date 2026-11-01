import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRouteTransition,routeTarget,routeSettings,type CurtainPhase} from '../lib/route-transition.ts';
import {emptyDocument,validateDocument} from '../lib/content-schema.ts';
import {animationStyle} from '../lib/animation-settings.ts';

function clock({warmFails=false,commitFails=false}={}){
 let now=0,id=0;
 const timers=new Map<number,{at:number;fn:()=>void}>(),paints=new Map<number,()=>void>();
 const phases:CurtainPhase[]=[],events:string[]=[],done:boolean[]=[];
 const machine=createRouteTransition({cover:300,reveal:400,phase:phase=>phases.push(phase),warm:href=>{events.push('warm:'+href);if(warmFails)throw Error('prefetch');},commit:href=>{events.push('commit:'+href);if(commitFails)throw Error('navigation');},ready:href=>events.push('ready:'+href),done:value=>done.push(value),timer:(fn,delay)=>{timers.set(++id,{at:now+delay,fn});return id;},clear:id=>{timers.delete(id);},paint:fn=>{const key=++id;paints.set(key,fn);return()=>{paints.delete(key);};}});
 const advance=(ms:number)=>{now+=ms;for(const [key,timer] of [...timers])if(timer.at<=now){timers.delete(key);timer.fn();}};
 const paint=()=>{const work=[...paints.values()];paints.clear();work.forEach(fn=>fn());};
 return {machine,events,phases,done,timers,paints,advance,paint};
}
test('prefetch starts immediately, routing waits for cover, and reveal waits for the new route and paint',()=>{
 const h=clock();h.machine.start('/events','/');assert.deepEqual(h.events,['warm:/events']);assert.deepEqual(h.phases,['covering']);
 h.advance(299);assert.equal(h.events.length,1);h.advance(1);h.machine.covered();assert.equal(h.phases.at(-1),'waiting');assert.equal(h.events.at(-1),'commit:/events');
 h.advance(500);assert.equal(h.phases.at(-1),'waiting');
 h.machine.arrive('/events');h.machine.arrive('/events');assert.equal(h.paints.size,1);assert.ok(!h.events.some(e=>e.startsWith('ready')));
 h.paint();assert.equal(h.events.at(-1),'ready:/events');assert.equal(h.phases.at(-1),'revealing');h.advance(399);assert.ok(h.machine.active);h.advance(1);h.machine.revealed();
 assert.equal(h.machine.active,false);assert.deepEqual(h.done,[true]);assert.equal(h.timers.size,0);
});
test('rapid activation is ignored and cancelling a cover never starts navigation',()=>{
 const h=clock();assert.equal(h.machine.start('/events','/'),true);assert.equal(h.machine.start('/kunst','/'),false);h.machine.cancel();h.advance(1000);
 assert.deepEqual(h.events,['warm:/events']);assert.deepEqual(h.done,[false]);assert.equal(h.machine.active,false);
});
test('history interruption, slow routes, thrown navigation and unmount always release the curtain',()=>{
 const interrupted=clock();interrupted.machine.start('/events','/');interrupted.machine.arrive('/om-os');assert.deepEqual(interrupted.done,[false]);
 const slow=clock();slow.machine.start('/events','/');slow.advance(380);slow.advance(8000);assert.deepEqual(slow.done,[false]);assert.equal(slow.machine.active,false);
 const broken=clock({commitFails:true});broken.machine.start('/events','/');broken.advance(380);assert.deepEqual(broken.done,[false]);assert.equal(broken.timers.size,0);
 const unmount=clock();unmount.machine.start('/events','/');unmount.advance(380);unmount.machine.arrive('/events');unmount.machine.cancel();unmount.paint();assert.ok(!unmount.events.some(e=>e.startsWith('ready')));assert.equal(unmount.paints.size,0);
});
test('a failed prefetch still navigates; redirects reveal the committed destination',()=>{
 const h=clock({warmFails:true});h.machine.start('/1671-2','/');h.advance(380);assert.equal(h.events.at(-1),'commit:/1671-2');h.machine.arrive('/spil-hos-os');h.paint();h.advance(480);assert.deepEqual(h.done,[true]);
});
test('only same-origin, different-page web links are eligible',()=>{
 const current='https://example.com/om-os?preview=draft';
 for(const href of ['#content','/om-os#more','?intro=replay','mailto:a@example.com','tel:123','https://other.com/events','/admin','/admin/editor','/api/editor/content','/media/photo','/file.pdf'])assert.equal(routeTarget(href,current),null,href);
 assert.equal(routeTarget('/om-os/',current),null);
 assert.equal(routeTarget('/1671-2','https://example.com/spil-hos-os'),null);
 assert.equal(routeTarget('/1671-2',current),'/spil-hos-os');
 assert.equal(routeTarget('/events#programme',current),'/events#programme');
 assert.equal(routeTarget('/galleri?preview=draft',current),'/galleri?preview=draft');
});
test('legacy documents get short default transitions and editor values remain validated',()=>{
 assert.deepEqual(routeSettings(emptyDocument),{enabled:true,cover:300,reveal:400});
 const doc=validateDocument({text:{'motion.routeCover':'500','motion.routeReveal':'600','motion.routeColor':'gold','motion.routeCoverEase':'linear'},images:{}});
 assert.match(animationStyle(doc),/--route-cover-duration:500ms/);assert.match(animationStyle(doc),/--route-curtain-color:var\(--brand-gold\)/);assert.match(animationStyle(doc),/--route-menu-duration:600ms/);
 for(const text of [{'motion.routeCover':'0'},{'motion.routeReveal':'1050'},{'motion.routeColor':'red;display:none'}])assert.throws(()=>validateDocument({text,images:{}}));
 assert.equal(routeSettings({text:{'motion.enabled':'false'},images:{}}).enabled,false);
 assert.equal(routeSettings({text:{'motion.routeTransition':'false'},images:{}}).enabled,false);
 assert.match(animationStyle({text:{'motion.routeTransition':'false'},images:{}}),/--route-menu-duration:680ms/);
});
