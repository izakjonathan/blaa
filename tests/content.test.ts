import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fields, validateDocument, emptyDocument, requireRevision, safeLink, textValue } from '../lib/content-schema.ts';
import { requireSameOrigin } from '../lib/editor-request.ts';
import { PGlite } from '@electric-sql/pglite';
import { initStore, readStore, readPublishedStore, writeStore, type Query } from '../lib/content-store.ts';
import { processImage } from '../lib/process-image.ts';
import sharp from 'sharp';

const text = fields.find(f=>f.kind==='text')!.id;
const photo = fields.find(f=>f.kind==='image')!;
test('one multiline hero field preserves legacy titles and gives new saved titles precedence',()=>{
 const legacy=validateDocument({text:{'experience.hero.text2':'Your new','experience.hero.text3':'daily','experience.hero.text4':'*ritual.*'},images:{}});
 assert.equal(textValue(legacy,'experience.hero.title'),'Your new\ndaily\n*ritual.*');
 const combined=validateDocument({...legacy,text:{...legacy.text,'experience.hero.title':'One\n\nnew chapter'}});
 assert.equal(textValue(combined,'experience.hero.title'),'One\n\nnew chapter');
 assert.equal(textValue(emptyDocument,'experience.hero.title'),'Blågårds\n*Apotek.*');
 assert.equal(fields.filter(f=>f.id.startsWith('experience.hero.')&&f.label==='Heading'&&!f.hidden).length,1);
});
test('content validation accepts current text, imagery and crop values without changing defaults',()=>{
 const document={text:{[text]:'A new\n*chapter*'},images:{[photo.id]:{...(photo.default as object),x:25,y:80}}};
 assert.deepEqual(validateDocument(document),document);
 assert.deepEqual(emptyDocument,{text:{},images:{}});
});
test('unregistered fields, excessive text and remote or traversal image sources are rejected',()=>{
 assert.throws(()=>validateDocument({text:{unknown:'value'},images:{}}));
 assert.throws(()=>validateDocument({text:{[text]:'a'.repeat(12001)},images:{}}));
 for(const src of ['https://example.com/photo.jpg','/brand/../../secret','javascript:alert(1)'])assert.throws(()=>validateDocument({text:{},images:{[photo.id]:{...(photo.default as object),src}}}));
 assert.throws(()=>validateDocument({text:{},images:{[photo.id]:{...(photo.default as object),x:101}}}));
});
test('link validation blocks executable URLs, protocol-relative URLs and control characters',()=>{
 for(const url of ['/investors','#wine','https://example.com','mailto:hello@example.com','tel:+4512345678'])assert.equal(safeLink(url),true,url);
 for(const url of ['javascript:alert(1)','//example.com','/\\example.com','https://example.com\n','data:text/html,test'])assert.equal(safeLink(url),false,url);
});
test('revisions must be non-negative integers and writes must originate on this website',()=>{
 for(const value of [-1,1.1,'2',NaN])assert.throws(()=>requireRevision(value));
 assert.equal(requireRevision(0),0);
 assert.doesNotThrow(()=>requireSameOrigin(new Request('https://plaisir.example/api/editor/content',{headers:{origin:'https://plaisir.example'}})));
 assert.throws(()=>requireSameOrigin(new Request('https://plaisir.example/api/editor/content',{headers:{origin:'https://other.example'}})));
 assert.throws(()=>requireSameOrigin(new Request('https://plaisir.example/api/editor/content')));
});
test('Postgres save, publish, stale revisions, duplicate publish and restore preserve the correct versions',async()=>{
 const pg=await PGlite.create();
 const query:Query=async(strings,...values)=>{
   const sql=strings.reduce((result,part,index)=>result+(index?`$${index}`:'')+part,'');
   return (await pg.query<Record<string,unknown>>(sql,values)).rows;
 };
 try{
  await initStore(query);await initStore(query);
  const first=validateDocument({text:{[text]:'First version'},images:{[photo.id]:{...(photo.default as object),overlay:true,overlayOpacity:35}}});
  const second=validateDocument({text:{[text]:'Second version'},images:{[photo.id]:{...(photo.default as object),overlay:false,overlayOpacity:70}}});
  assert.equal((await readStore(query)).revision,0);
  const saved=await writeStore(query,'save',0,first);
  assert.deepEqual(saved.published,emptyDocument);
  assert.deepEqual(saved.draft,first);
  await assert.rejects(()=>writeStore(query,'publish',0,second),/CONFLICT/);
  const published=await writeStore(query,'publish',saved.revision,first);
  assert.deepEqual(published.published,first);
  const next=await writeStore(query,'publish',published.revision,second);
  assert.deepEqual(next.previous,first);
  const repeated=await writeStore(query,'publish',next.revision,second);
  assert.deepEqual(repeated.previous,first);
  const restored=await writeStore(query,'restore',repeated.revision);
  assert.deepEqual(restored.published,first);
  assert.deepEqual(restored.draft,first);
  assert.deepEqual(restored.previous,second);
  await pg.query("UPDATE blaa_content SET draft='null'::jsonb, previous='null'::jsonb WHERE id=1");
  assert.deepEqual(await readPublishedStore(query),first,'invalid draft/history must not replace valid public content');
  await assert.rejects(()=>readStore(query),/invalid/i);
  const missing={text:{},images:{[photo.id]:{...(photo.default as object),src:'/media/00000000-0000-4000-8000-000000000001'}}};
  await assert.rejects(()=>writeStore(query,'save',restored.revision,validateDocument(missing)),/no longer available/);
 }finally{await pg.close();}
});
test('image processing removes metadata, constrains large photographs and preserves normal dimensions',async()=>{
 const original=await sharp({create:{width:3000,height:1500,channels:3,background:'#2b3d17'}}).jpeg().withMetadata({exif:{IFD0:{Artist:'Private camera metadata'}}}).toBuffer();
 const result=await processImage(original),meta=await sharp(result.data).metadata();
 assert.equal(result.info.width,2400);assert.equal(result.info.height,1200);assert.equal(meta.format,'webp');assert.equal(meta.exif,undefined);
 const small=await sharp({create:{width:320,height:480,channels:3,background:'#d19c36'}}).png().toBuffer();
 const output=await processImage(small);assert.equal(output.info.width,320);assert.equal(output.info.height,480);
 await assert.rejects(()=>processImage(Buffer.from('<not an image>')),/could not be read/);
});

test('image overlay preferences persist and legacy images retain the overlay',()=>{
 const image={...(photo.default as object),overlay:false};
 const document=validateDocument({text:{},images:{[photo.id]:image}});
 assert.equal(document.images[photo.id].overlay,false);
 assert.equal(validateDocument({text:{},images:{[photo.id]:photo.default}}).images[photo.id].overlay,true);
 assert.throws(()=>validateDocument({text:{},images:{[photo.id]:{...image,overlay:'false'}}}));
});

test('editor JSON input enforces byte limits while streaming and returns useful invalid JSON errors',async()=>{
 const {readJSON}=await import('../lib/editor-request.ts');
 const request=(text:string)=>new Request('https://plaisir.example/api/editor/content',{method:'POST',headers:{'content-type':'application/json'},body:text});
 assert.deepEqual(await readJSON(request('{"label":"café"}')),{label:'café'});
 await assert.rejects(()=>readJSON(request('{')),/Invalid JSON/);
 await assert.rejects(()=>readJSON(request(JSON.stringify({text:'é'.repeat(160001)}))),/too large/);
 let cancelled=false;
 const body=new ReadableStream({pull(controller){controller.enqueue(new Uint8Array(160001));},cancel(){cancelled=true;}});
 await assert.rejects(()=>readJSON(new Request('https://plaisir.example/api/editor/content',{method:'POST',headers:{'content-type':'application/json'},body,duplex:'half'} as RequestInit)),/too large/);
 assert.equal(cancelled,true);
});

test('per-image overlay opacity accepts the endpoints and rejects invalid data',()=>{
 for(const overlayOpacity of [0,35,100]){
  const image={...(photo.default as object),overlayOpacity};
  assert.equal(validateDocument({text:{},images:{[photo.id]:image}}).images[photo.id].overlayOpacity,overlayOpacity);
 }
 for(const overlayOpacity of [-1,101,'50',null,NaN,Infinity]){
  assert.throws(()=>validateDocument({text:{},images:{[photo.id]:{...(photo.default as object),overlayOpacity}}}),/opacity/);
 }
 assert.equal(validateDocument({text:{},images:{[photo.id]:photo.default}}).images[photo.id].overlayOpacity,undefined);
});

test('editor requests reject non-object JSON and validate the Blob issuance payload',async()=>{
 const {readJSON,presignedUploadBody}=await import('../lib/editor-request.ts');
 for(const value of [null,[],42,'hello',true])await assert.rejects(()=>readJSON(new Request('https://plaisir.example',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value)})),/Invalid JSON request/);
 const body={type:'blob.generate-presigned-url',payload:{pathname:'pending/example.jpg',multipart:false,clientPayload:null}};
 assert.deepEqual(presignedUploadBody(body),body);
 for(const payload of [null,[],{}, {pathname:'x',multipart:'false'}])assert.throws(()=>presignedUploadBody({...body,payload}),/Invalid upload/);
});

test('investor controls are absent from the venue editor',()=>{assert.equal(fields.filter(field=>['numbers','story'].includes(field.page)).length,0);});
