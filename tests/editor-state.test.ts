import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergePendingEdits} from '../lib/editor-state.ts';
import {fields,validateDocument,type ContentImageValue} from '../lib/content-schema.ts';

test('save acknowledgements retain newer text and image changes without mutating any snapshot',()=>{
 const field=fields.find(f=>f.kind==='text'&&!f.hidden)!;
 const photo=fields.find(f=>f.kind==='image')!;
 const image=photo.default as ContentImageValue;
 const submitted={text:{[field.id]:'Submitted'},images:{[photo.id]:image}};
 const current={text:{[field.id]:'Typed while saving'},images:{[photo.id]:{...image,x:73}}};
 const original=JSON.stringify({submitted,current});
 const acknowledged=validateDocument(submitted);
 const result=mergePendingEdits(current,submitted,acknowledged);
 assert.equal(result.text[field.id],'Typed while saving');assert.equal(result.images[photo.id].x,73);
 assert.equal(JSON.stringify({submitted,current}),original);
 assert.equal(acknowledged.text[field.id],'Submitted');assert.equal(acknowledged.images[photo.id].x,image.x);
});
test('reverting an image to its inherited default while saving remains an unsaved removal',()=>{
 const photo=fields.find(f=>f.kind==='image')!;
 const submitted={text:{},images:{[photo.id]:photo.default as ContentImageValue}};
 const result=mergePendingEdits({text:{},images:{}},submitted,submitted);
 assert.equal(result.images[photo.id],undefined);
});
test('an unedited client accepts acknowledged values, including restored fields',()=>{
 const submitted={text:{},images:{}};
 const field=fields.find(f=>f.kind==='text'&&!f.hidden)!;
 assert.deepEqual(mergePendingEdits(submitted,submitted,{text:{[field.id]:'Restored'},images:{}}),{text:{[field.id]:'Restored'},images:{}});
});
