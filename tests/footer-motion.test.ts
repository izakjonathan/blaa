import {test} from 'node:test';
import assert from 'node:assert/strict';
import {footerMotion} from '../lib/footer-motion.ts';

test('moving arrivals preserve incoming speed, finish stationary and never overshoot',()=>{
 for(const curve of ['cosine','cubic','linear','ease-out'])for(const velocity of [.05,.5,2,8]){
  const distance=700,motion=footerMotion(distance,velocity,1500,curve),epsilon=.0001;
  assert.equal(motion.duration,1500);
  const initial=distance*motion.ease(epsilon)/(epsilon*motion.duration);
  assert.ok(Math.abs(initial-velocity)/velocity<.025,`${curve}: ${initial} vs ${velocity}`);
  assert.ok(distance*(1-motion.ease(1-epsilon))/(epsilon*motion.duration)<.01);
  let previous=0;
  for(let i=0;i<=500;i++){const next=motion.ease(i/500);assert.ok(next>=previous&&next<=1);previous=next;}
 }
});
test('stationary arrivals keep the configured easing and duration',()=>{
 const motion=footerMotion(700,0,2500,'linear');assert.equal(motion.duration,2500);assert.equal(motion.ease(.25),.25);
});
