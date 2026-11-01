import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyDocument,fields,validateDocument,type ContentImageValue} from '../lib/content-schema.ts';
import {imageOverlayOpacity,imageOverlayStrength} from '../lib/image-treatment.ts';
const image=fields.find(f=>f.kind==='image')!.default as ContentImageValue;
test('image opacity inherits global strength and retains explicit overrides and off switches',()=>{
 const doc=validateDocument({text:{'brand.overlayOpacity':'40','brand.photoTreatment':'per-image'},images:{}});
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

test('uniform photo mode overrides legacy off switches and custom opacity without rewriting them',()=>{
 const doc=validateDocument({text:{'brand.overlayOpacity':'70'},images:{}});
 const legacy={...image,overlay:false,overlayOpacity:0};
 assert.equal(imageOverlayStrength(doc,legacy),.7);assert.equal(legacy.overlay,false);assert.equal(legacy.overlayOpacity,0);
 const perImage=validateDocument({text:{...doc.text,'brand.photoTreatment':'per-image'},images:{}});assert.equal(imageOverlayStrength(perImage,legacy),0);
});
