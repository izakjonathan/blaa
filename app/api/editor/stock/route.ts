import {sql,databaseConfigured} from '../../../../lib/content-db';
import {initStock,readStock,saveStock} from '../../../../lib/stock-store';
import {validateStock,emptyStock} from '../../../../lib/stock';
import {readJSON,requireSameOrigin,editorError} from '../../../../lib/editor-request';
import type {Query} from '../../../../lib/content-store';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
const db:Query=(strings,...values)=>sql()(strings,...values);
export async function GET(request:Request){
 if(!databaseConfigured())return Response.json({ready:false,revision:0,document:emptyStock,audit:[]},{headers});
 try{await initStock(db);const version=new URL(request.url).searchParams.get('version');if(version){const rows=await db`SELECT revision,document,reason,saved_at FROM blaa_stock_audit WHERE revision=${Number(version)}`;return Response.json({record:rows[0]??null},{headers});}
 const state=await readStock(db),audit=await db`SELECT revision,reason,saved_at FROM blaa_stock_audit ORDER BY revision DESC LIMIT 30`;return Response.json({ready:true,...state,audit},{headers});}catch(error){return editorError(error);}
}
export async function POST(request:Request){try{requireSameOrigin(request);const body=await readJSON(request,3000000);if(!Number.isSafeInteger(body.revision)||Number(body.revision)<0||typeof body.reason!=='string'||body.reason.length>1000)throw Error('Invalid stock save.');await initStock(db);const revision=await saveStock(db,Number(body.revision),validateStock(body.document),body.reason);return Response.json({revision},{headers});}catch(error){return editorError(error);}}
