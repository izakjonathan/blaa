import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bottleOffset,BOTTLE_TRAVEL,headerSurfaceTone} from '../lib/scroll-art.ts';
test('bottle movement reverses with scrolling and stays inside reserved text clearance',()=>{
 assert.equal(bottleOffset(600,800,1000),0);
 assert.ok(bottleOffset(700,800,1000)<0);
 assert.ok(bottleOffset(500,800,1000)>0);
 assert.equal(bottleOffset(10000,800,1000),-BOTTLE_TRAVEL);
 assert.equal(bottleOffset(0,800,1000),BOTTLE_TRAVEL);
 assert.equal(bottleOffset(700,800,1000,true),0);
});
test('a photo within a yellow split section keeps controls yellow until the content surface reaches them',()=>{
 const section={left:0,right:390,top:-500,bottom:900,photo:false,gold:true};
 const photo={left:0,right:390,top:-500,bottom:100,photo:true,gold:false};
 assert.equal(headerSurfaceTone([section,photo],340,60),'gold');
 assert.equal(headerSurfaceTone([section,photo],340,120),'dark');
 assert.equal(headerSurfaceTone([{...photo,right:195},section],340,60),'dark');
 assert.equal(headerSurfaceTone([],340,60),undefined);
});

test('bottle anchors remain unique even when Story has only two photos',async()=>{
 const {bottlePhotoIndex}=await import('../lib/scroll-art.ts');
 for(let count=0;count<=8;count++){
  const indices=[0,1,2].map(i=>bottlePhotoIndex(i,count)).filter(i=>i!==undefined);
  assert.equal(new Set(indices).size,indices.length);
  assert.ok(indices.every(i=>i<count));
 }
 assert.equal(bottlePhotoIndex(2,2),undefined);
});
test('decorative placement favors a cropped gesture and rejects near-complete bottles',async()=>{
 const {bottleClipScore}=await import('../lib/scroll-art.ts');
 assert.equal(bottleClipScore(180,240),undefined);
 assert.equal(bottleClipScore(10,240),undefined);
 assert.ok(bottleClipScore(65,240)!>bottleClipScore(100,240)!);
});
