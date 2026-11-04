import {emptyStock,validateStock,checkStockChange,type Stock} from './stock.ts';
import type {Query} from './content-store.ts';
export async function initStock(db:Query){
 await db`CREATE TABLE IF NOT EXISTS blaa_stock_state(id integer PRIMARY KEY,revision integer NOT NULL,document jsonb NOT NULL)`;
 await db`CREATE TABLE IF NOT EXISTS blaa_stock_audit(revision integer PRIMARY KEY,document jsonb NOT NULL,reason text NOT NULL,saved_at timestamptz NOT NULL DEFAULT now())`;
 await db`INSERT INTO blaa_stock_state(id,revision,document) VALUES(1,0,${JSON.stringify(emptyStock)}::jsonb) ON CONFLICT(id) DO NOTHING`;
}
export async function readStock(db:Query){const rows=await db`SELECT revision,document FROM blaa_stock_state WHERE id=1`;return {revision:Number(rows[0].revision),document:validateStock(rows[0].document)};}
export async function saveStock(db:Query,revision:number,document:Stock,reason:string){
 const previous=await readStock(db);if(previous.revision!==revision)throw Error('CONFLICT: Stock data changed on another device. Export your edits, then reload before saving.');
 checkStockChange(previous.document,document,reason);
 const rows=await db`WITH changed AS (UPDATE blaa_stock_state SET revision=revision+1,document=${JSON.stringify(document)}::jsonb WHERE id=1 AND revision=${revision} RETURNING revision,document)
 INSERT INTO blaa_stock_audit(revision,document,reason) SELECT revision,document,${reason} FROM changed RETURNING revision`;
 if(!rows.length)throw Error('CONFLICT: Stock data changed on another device. Export your edits, then reload before saving.');return Number(rows[0].revision);
}
