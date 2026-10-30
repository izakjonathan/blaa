import { del, get, put } from '@vercel/blob';
import { ensureSchema, sql } from '../../../../lib/content-db';
import { editorError, readJSON, requireSameOrigin } from '../../../../lib/editor-request';
import { processImage } from '../../../../lib/process-image';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function GET() {
  try {
    await ensureSchema();
    const rows = await sql()`SELECT id,width,height,alt FROM blaa_media ORDER BY created_at DESC LIMIT 250`;
    return Response.json({ assets:rows.map(row => ({src:`/media/${row.id}`,width:row.width,height:row.height,alt:row.alt,x:50,y:50})) }, { headers:{'Cache-Control':'no-store'} });
  } catch (error) { return editorError(error); }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const { id, alt } = await readJSON(request);
    if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id) || typeof alt !== 'string' || alt.length > 500) throw new Error('Invalid upload.');
    await ensureSchema();
    const db = sql();
    const [existing] = await db`SELECT * FROM blaa_media WHERE id=${id}`;
    if (existing) return Response.json({asset:{src:`/media/${id}`,width:existing.width,height:existing.height,alt:existing.alt,x:50,y:50}});
    const [ticket] = await db`SELECT * FROM blaa_uploads WHERE id=${id} AND created_at>now()-interval '1 hour'`;
    if (!ticket) throw new Error('Upload expired. Choose the image again.');
    const original = await get(ticket.pathname, { access:'private' });
    if (original?.statusCode !== 200) throw new Error('Upload is not available yet. Try again.');
    const input = Buffer.from(await new Response(original.stream).arrayBuffer());
    let processed;
    try { processed = await processImage(input); }
    catch(error) { await del(ticket.pathname).catch(()=>{}); throw error; }
    const image = await put(`images/${id}.webp`, processed.data, {access:'private',contentType:'image/webp',addRandomSuffix:false,allowOverwrite:true});
    await db`INSERT INTO blaa_media (id,pathname,width,height,alt) VALUES (${id},${image.pathname},${processed.info.width},${processed.info.height},${alt}) ON CONFLICT (id) DO NOTHING`;
    await db`UPDATE blaa_uploads SET finished=true WHERE id=${id}`;
    await del(ticket.pathname).catch(()=>{});
    return Response.json({asset:{src:`/media/${id}`,width:processed.info.width,height:processed.info.height,alt,x:50,y:50}});
  } catch(error) { return editorError(error); }
}
