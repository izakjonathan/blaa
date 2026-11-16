import {after} from 'next/server';
import {mailStatus,processStockMail} from '../../../../lib/stock-mail';
import {sql,databaseConfigured} from '../../../../lib/content-db';
import {initStock,readStock,saveStock} from '../../../../lib/stock-store';
import {validateStock,emptyStock} from '../../../../lib/stock';
import {readJSON,requireSameOrigin,editorError} from '../../../../lib/editor-request';
import {mergeSheetProducts,readStockSheet,stockAccessAllowed,stockSheetEnabled} from '../../../../lib/stock-sheet';
import type {Query} from '../../../../lib/content-store';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
const locked=()=>Response.json({error:'Enter the Stock Control access key.'},{status:401,headers});
const db:Query=(strings,...values)=>sql()(strings,...values);
export async function GET(request:Request){
 if(!stockAccessAllowed(request))return locked();
 if(!databaseConfigured())return Response.json({ready:false,revision:0,document:emptyStock,audit:[]},{headers});
 try{await initStock(db);const version=new URL(request.url).searchParams.get('version');if(version){const rows=await db`SELECT revision,document,reason,saved_at FROM blaa_stock_audit WHERE revision=${Number(version)}`;return Response.json({record:rows[0]??null},{headers});}
 const state=await readStock(db),audit=await db`SELECT revision,reason,saved_at FROM blaa_stock_audit ORDER BY revision DESC LIMIT 30`;return Response.json({ready:true,sheetEnabled:stockSheetEnabled(),...state,audit,mail:await mailStatus(db)},{headers});}catch(error){return editorError(error);}
}
export async function POST(request:Request){
 if(!stockAccessAllowed(request))return locked();
 try{requireSameOrigin(request);const body=await readJSON(request,3000000);if(body.action==='sync-sheet'){
 const rows=await readStockSheet();
 await initStock(db);
 const state=await readStock(db);
 if(body.revision!==state.revision)throw Error('CONFLICT: Stock data changed. Reload before syncing.');
 const {document,added,updated}=mergeSheetProducts(state.document,rows);
 const revision=added||updated?await saveStock(db,state.revision,document,'Synced products from Google Sheets'):state.revision;
 return Response.json({revision,document,added,updated},{headers});
 }if(body.action==='retry-email'){await initStock(db);await processStockMail(db);return Response.json({mail:await mailStatus(db)},{headers});}if(!Number.isSafeInteger(body.revision)||Number(body.revision)<0||typeof body.reason!=='string'||body.reason.length>1000)throw Error('Invalid stock save.');await initStock(db);const revision=await saveStock(db,Number(body.revision),validateStock(body.document),body.reason);after(async()=>{try{await processStockMail(db);}catch{/* The durable outbox remains available for retry. */}});return Response.json({revision,mail:await mailStatus(db)},{headers});}catch(error){return editorError(error);}}
