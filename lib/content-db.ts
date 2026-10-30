import { neon } from '@neondatabase/serverless';
import { cache } from 'react';
import { emptyDocument, type ContentDocument } from './content-schema';
import { initStore, readStore, readPublishedStore, writeStore, type Query } from './content-store';

export function databaseConfigured() { return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL); }
export function mediaConfigured() { return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID); }
export function sql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error('Connect a Neon Postgres database in this project’s Vercel Storage tab, then redeploy.');
  return neon(url);
}
const query: Query = (strings, ...values) => sql()(strings, ...values);
let schema: Promise<void> | undefined;
export function ensureSchema(): Promise<void> {
  if (!schema) schema = initStore(query).catch(error => { schema = undefined; throw error; });
  return schema;
}
export type { ContentState } from './content-store';
export async function readState() { await ensureSchema(); return readStore(query); }
export const readPublished = cache(async (): Promise<ContentDocument> => {
  if (!databaseConfigured()) return emptyDocument;
  try { await ensureSchema(); return await readPublishedStore(query); }
  catch { console.error('Plaisir content database unavailable; displaying original content.'); return emptyDocument; }
});
export async function writeContent(action: 'save' | 'publish' | 'restore', revision: number, document?: ContentDocument) {
  await ensureSchema(); return writeStore(query, action, revision, document);
}
