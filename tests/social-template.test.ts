import {test} from 'node:test';
import assert from 'node:assert/strict';
import {starter,validateTemplate,wrapSocial} from '../lib/social-template.ts';
import {readJSON} from '../lib/editor-request.ts';
test('templates round-trip all layer geometry and starter formats without third-party branding',()=>{
 for(const story of [true,false]){const template=starter(story);assert.deepEqual(validateTemplate(JSON.parse(JSON.stringify(template))),template);assert.equal(template.width,1080);assert.equal(template.height,story?1920:1080);assert.ok(!JSON.stringify(template).includes('Plaisir'));}
});
test('untrusted imports reject executable/remote assets, broken geometry and oversized documents',()=>{
 for(const mutate of [(t:any)=>t.layers[0].src='https://example.com/test.png',(t:any)=>t.layers[0].src='data:image/svg+xml;base64,AAAA',(t:any)=>t.layers[0].x=NaN,(t:any)=>t.layers[0].width=0,(t:any)=>t.layers[0].font='unknown',(t:any)=>t.layers[0].color='red;display:none',(t:any)=>t.layers.push(t.layers[0]),(t:any)=>t.fonts=[{name:'Bad',src:'javascript:alert(1)'}],(t:any)=>t.layers[0].text='x'.repeat(3000001)]){const t=starter();mutate(t);assert.throws(()=>validateTemplate(t));}
});
test('text wrapping keeps explicit newlines and splits overlong words without losing letters',()=>{
 const measure=(s:string)=>s.length*10;
 assert.deepEqual(wrapSocial('One two\n\nThree',70,measure),['One two','','Three']);
 const lines=wrapSocial('ÆØÅlangtord',30,measure);assert.equal(lines.join(''),'ÆØÅlangtord');assert.ok(lines.every(l=>measure(l)<=30));
});
test('social request limit can be raised without weakening the editor default',async()=>{
 const body=JSON.stringify({text:'x'.repeat(330000)}),request=()=>new Request('https://example.com',{method:'POST',headers:{'content-type':'application/json'},body});
 await assert.rejects(()=>readJSON(request()),/too large/);assert.equal(String((await readJSON(request(),400000)).text).length,330000);
});
