import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as templates from '../lib/social-template.ts';
import * as http from '../lib/editor-request.ts';
test('shared templates save, reload, reject stale revisions and refuse cross-origin writes',async()=>{
 const db=new PGlite();
 try{
  const query=async(strings:TemplateStringsArray,...values:unknown[])=>{const text=strings.reduce((out,s,i)=>out+(i?'$'+i:'')+s,'');return (await db.query(text,values)).rows;};
  const exports:Record<string,any>={};
  const source=ts.transpileModule(readFileSync(new URL('../app/api/editor/social/route.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(source,{exports,Response,URL,require:(name:string)=>name.endsWith('content-db')?{databaseConfigured:()=>true,sql:()=>query}:name.endsWith('editor-request')?{...http,editorError:(error:any)=>http.editorError(new Error(error.message))}:templates});
  const template=templates.starter(),post=(revision:number,origin='https://example.com')=>exports.POST(new Request('https://example.com/api/editor/social',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({template,revision})}));
  assert.equal((await post(-1)).status,200);assert.equal((await post(-1)).status,409);assert.equal((await post(0)).status,200);assert.equal((await post(1,'https://other.com')).status,400);
  const list=await (await exports.GET(new Request('https://example.com/api/editor/social'))).json();assert.equal(list.templates.length,1);assert.equal(list.templates[0].revision,1);
  const record=await (await exports.GET(new Request('https://example.com/api/editor/social?id=square'))).json();assert.deepEqual(record.record.document,template);
 }finally{await db.close();}
});
