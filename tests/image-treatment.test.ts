import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyDocument,fields,validateDocument,type ContentImageValue} from '../lib/content-schema.ts';
import {imageOverlayOpacity,imageOverlayStrength} from '../lib/image-treatment.ts';
const image=fields.find(f=>f.kind==='image')!.default as ContentImageValue;
test('image opacity inherits global strength and retains explicit overrides and off switches',()=>{
 const doc=validateDocument({text:{'brand.overlayOpacity':'40'},images:{}});
 assert.equal(imageOverlayOpacity(emptyDocument,image),55);
 assert.equal(imageOverlayStrength(doc,image),.4);
 assert.equal(imageOverlayStrength(doc,{...image,overlayOpacity:75}),.75);
 assert.equal(imageOverlayStrength(doc,{...image,overlayOpacity:0}),0);
 assert.equal(imageOverlayStrength(doc,{...image,overlay:false}),0);
 const reset={...image,overlayOpacity:75} as ContentImageValue;delete reset.overlayOpacity;
 assert.equal(imageOverlayOpacity(doc,reset),40);
 for(const value of ['-1','101','nope'])assert.throws(()=>validateDocument({text:{'brand.overlayOpacity':value},images:{}}));
});

test('page photographs share overlay defaults while concert posters remain clear',()=>{
 for(const field of fields.filter(field=>field.kind==='image')){
  const image=field.default as ContentImageValue;
  assert.equal(image.overlay,!/^events\.item\.\d+\.image$/.test(field.id),field.id);
 }
});
