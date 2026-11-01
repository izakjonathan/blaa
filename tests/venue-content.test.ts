import {test} from 'node:test';
import assert from 'node:assert/strict';
import pages from '../lib/venue-pages.json' with {type:'json'};
import {fieldMap,validateDocument,emptyDocument,type Field} from '../lib/content-schema.ts';

test('venue composition and registered editor fields remain reconciled',()=>{
 const expect=(id:string,kind:Field['kind'])=>assert.equal(fieldMap.get(id)?.kind,kind,id);
 for(const [slug,page] of Object.entries(pages)){
  expect(`${slug}.title`,'text');expect(`${slug}.intro`,'text');expect(`${slug}.hero`,'image');
  for(const id of page.copy)expect(id,'text');
  if('photos' in page)for(const id of page.photos)expect(id,'image');
  if('events' in page)for(const event of page.events){expect(event.id+'.name','text');expect(event.id+'.date','text');expect(event.id+'.image','image');if(event.linked)expect(event.id+'.link','link');}
 }
});
test('removed footer caption stays compatible with saved history but is hidden from editing',()=>{
 assert.equal(fieldMap.get('shared.shell.text3')?.hidden,true);
 assert.equal(validateDocument({...emptyDocument,text:{'shared.shell.text3':'Legacy caption'}}).text['shared.shell.text3'],'Legacy caption');
});
