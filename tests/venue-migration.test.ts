import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fields, emptyDocument, imageValue, textValue, validateDocument } from '../lib/content-schema.ts';
import config from '../lib/venue-pages.json' with { type: 'json' };

test('all migrated images exist locally with valid dimensions and can be saved together',()=>{
 const images=Object.fromEntries(fields.filter(f=>f.kind==='image').map(f=>{
  const image=imageValue(emptyDocument,f.id);
  assert.ok(existsSync(new URL('../public'+image.src,import.meta.url)),image.src);
  return [f.id,image];
 }));
 assert.deepEqual(validateDocument({text:{},images}).images,images);
});
test('venue navigation has no investor destinations and every public route has a page',()=>{
 assert.equal(config.navigation.length,7);
 for(const item of config.navigation) {
  assert.ok(existsSync(new URL(`../app${item.href==='/'?'':item.href}/page.tsx`,import.meta.url)));
  assert.ok(!/investor|financial/.test(item.href));
 }
 assert.equal(fields.some(f=>['story','numbers'].includes(f.page)),false);
});
test('the complete concert snapshot preserves names, dates, posters and safe external links',()=>{
 assert.equal(config.events,20);
 const text:Record<string,string>={};
 for(let i=0;i<config.events;i++)for(const key of ['name','date','time','note','group','link'])text[`events.${i}.${key}`]=textValue(emptyDocument,`events.${i}.${key}`);
 assert.doesNotThrow(()=>validateDocument({text,images:{}}));
 const dated=Array.from({length:config.events},(_,i)=>text[`events.${i}.date`]).filter(Boolean);
 assert.ok(dated.includes('2026-10-30'));
 assert.equal(config.gallery,32);
});
test('venue editor storage is isolated from the template database tables',()=>{
 const source=readFileSync(new URL('../lib/content-store.ts',import.meta.url),'utf8');
 assert.match(source,/CREATE TABLE IF NOT EXISTS blaa_content/);
 assert.doesNotMatch(source,/plaisir_(content|media|uploads)/);
});
