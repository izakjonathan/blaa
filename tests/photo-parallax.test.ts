import {test} from 'node:test';
import assert from 'node:assert/strict';
import {photoParallaxGeometry,followPhoto,photoParallaxSettings} from '../lib/photo-parallax.ts';
import {emptyDocument,validateDocument} from '../lib/content-schema.ts';

test('photo travel is bounded, reverses smoothly and has sufficient image overscan',()=>{
 for(const height of [80,250,900,1400])for(const travel of [0,20,32,120]){
  const entering=photoParallaxGeometry(2000,844,height,travel),leaving=photoParallaxGeometry(-2000,844,height,travel);
  assert.equal(entering.shift,-travel/2);assert.equal(leaving.shift,travel/2);
  assert.equal(photoParallaxGeometry(422,844,height,travel).shift,0);
  assert.ok(height*(entering.scale-1)/2>=travel/2-1e-6);
 }
});
test('smoothing follows input without overshoot and is frame-rate independent',()=>{
 const one=followPhoto(0,10,32,120),two=followPhoto(followPhoto(0,10,16,120),10,16,120);
 assert.ok(Math.abs(one-two)<1e-9);assert.ok(one>0&&one<10);
 assert.ok(followPhoto(one,-10,16,120)<one);assert.equal(followPhoto(0,10,16,0),10);
});
test('parallax settings persist and inherit safe defaults, respecting the master switch',()=>{
 assert.deepEqual(photoParallaxSettings(emptyDocument),{enabled:true,mobile:20,desktop:32,smoothing:120});
 const doc=validateDocument({text:{'motion.parallax':'false','motion.parallaxMobile':'12','motion.parallaxDesktop':'40','motion.parallaxSmoothing':'200'},images:{}});
 assert.deepEqual(photoParallaxSettings(doc),{enabled:false,mobile:12,desktop:40,smoothing:200});
 assert.equal(photoParallaxSettings({text:{'motion.enabled':'false'},images:{}}).enabled,false);
 for(const value of ['-1','81','NaN'])assert.throws(()=>validateDocument({text:{'motion.parallaxMobile':value},images:{}}));
});
