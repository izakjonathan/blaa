import { get } from '@vercel/blob';
import { databaseConfigured, ensureSchema, sql } from '../../../lib/content-db';
export const runtime = 'nodejs';
export async function GET(_request: Request, {params}: {params:Promise<{id:string}>}) {
  const {id} = await params;
  if (!databaseConfigured() || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) return new Response(null,{status:404});
  try {
    await ensureSchema();
    const [asset] = await sql()`SELECT pathname FROM blaa_media WHERE id=${id}`;
    if (!asset) return new Response(null,{status:404});
    const image = await get(asset.pathname, {access:'private'});
    if (image?.statusCode !== 200) return new Response(null,{status:404});
    return new Response(image.stream, { headers:{'Content-Type':'image/webp','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=31536000, immutable'} });
  } catch { return new Response(null,{status:503}); }
}
