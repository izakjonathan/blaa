import {databaseConfigured,sql} from '../../../../lib/content-db';
import {editorError,readJSON,requireSameOrigin} from '../../../../lib/editor-request';
import {validateTemplate,SOCIAL_LIMIT} from '../../../../lib/social-template';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
async function store(){const db=sql();await db`CREATE TABLE IF NOT EXISTS blaa_social_templates(id text PRIMARY KEY,name text NOT NULL,revision integer NOT NULL,document jsonb NOT NULL)`;return db;}
export async function GET(request:Request){
 if(!databaseConfigured())return Response.json({ready:false,templates:[]},{headers});
 try{
  const db=await store(),id=new URL(request.url).searchParams.get('id');
  const rows=id?await db`SELECT document,revision FROM blaa_social_templates WHERE id=${id}`:await db`SELECT id,name,revision FROM blaa_social_templates ORDER BY name LIMIT 100`;
  return Response.json(id?{ready:true,record:rows[0]??null}:{ready:true,templates:rows},{headers});
 }catch(error){return editorError(error);}
}
export async function POST(request:Request){
 try{
  requireSameOrigin(request);const body=await readJSON(request,SOCIAL_LIMIT+1000),template=validateTemplate(body.template);
  const revision=body.revision;if(!Number.isSafeInteger(revision)||Number(revision)<-1)throw Error('Invalid template revision.');
  const db=await store();
  const rows=await db`INSERT INTO blaa_social_templates(id,name,revision,document) VALUES(${template.id},${template.name},0,${JSON.stringify(template)}::jsonb)
   ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,document=EXCLUDED.document,revision=blaa_social_templates.revision+1 WHERE blaa_social_templates.revision=${revision as number} RETURNING revision`;
  if(!rows.length)throw Error('CONFLICT: This template changed elsewhere. Reload it before saving. Export your current template first to keep your changes.');
  return Response.json({revision:rows[0].revision},{headers});
 }catch(error){return editorError(error);}
}
