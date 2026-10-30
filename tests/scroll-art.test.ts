import {test} from 'node:test';
import assert from 'node:assert/strict';
import {headerSurfaceTone} from '../lib/scroll-art.ts';
test('a photo within a yellow split section keeps controls yellow until the content surface reaches them',()=>{
 const section={left:0,right:390,top:-500,bottom:900,photo:false,gold:true};
 const photo={left:0,right:390,top:-500,bottom:100,photo:true,gold:false};
 assert.equal(headerSurfaceTone([section,photo],340,60),'gold');
 assert.equal(headerSurfaceTone([section,photo],340,120),'dark');
 assert.equal(headerSurfaceTone([{...photo,right:195},section],340,60),'dark');
 assert.equal(headerSurfaceTone([],340,60),undefined);
});
