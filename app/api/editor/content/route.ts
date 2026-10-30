import { databaseConfigured, mediaConfigured, readState, writeContent } from '../../../../lib/content-db';
import { requireRevision, validateDocument } from '../../../../lib/content-schema';
import { editorError, readJSON, requireSameOrigin } from '../../../../lib/editor-request';
import { revalidatePath } from 'next/cache';
export const dynamic = 'force-dynamic';
export async function GET() {
  if (!databaseConfigured()) return Response.json({ ready:false, mediaReady:mediaConfigured(), error:'Connect Neon Postgres in Vercel Storage, then redeploy to enable saving.' }, { headers:{'Cache-Control':'no-store'} });
  try { return Response.json({ ready:true, mediaReady:mediaConfigured(), state:await readState() }, { headers:{'Cache-Control':'no-store'} }); }
  catch (error) { return editorError(error); }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const body = await readJSON(request);
    const action=body.action;
    if (action!=='save' && action!=='publish' && action!=='restore') throw new Error('Invalid action.');
    const state = await writeContent(action, requireRevision(body.revision), body.action==='restore' ? undefined : validateDocument(body.document));
    if (body.action !== 'save') revalidatePath('/', 'layout');
    return Response.json({ state }, { headers:{'Cache-Control':'no-store'} });
  } catch (error) { return editorError(error); }
}
