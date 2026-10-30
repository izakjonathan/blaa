// Login is deliberately not required in this version. Add authorization here later.
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const target = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const expected = forwardedHost ? `${target.protocol}//${forwardedHost}` : target.origin;
  if (!origin || (origin !== target.origin && origin !== expected) || request.headers.get('sec-fetch-site') === 'cross-site') throw new Error('This request must come from the editor on this website.');
}
export async function readJSON(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('Expected JSON.');
  const limit = 320000;
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > limit) throw new Error('Request is too large.');
  if (!request.body) throw new Error('Invalid JSON request.');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0, text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new Error('Request is too large.');
      }
      text += decoder.decode(value, { stream:true });
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  let parsed: unknown;
  try { parsed = JSON.parse(text); }
  catch { throw new Error('Invalid JSON request.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid JSON request: expected an object.');
  return parsed as Record<string, unknown>;
}
export function editorError(error: unknown) {
  const message = error instanceof Error ? error.message : 'The request could not be completed.';
  const known = /^(CONFLICT:|Invalid |Use |Content |An image |This request |Expected |Request |Connect |Upload |Choose |Image |Too many |No previous)/.test(message);
  return Response.json({ error: known ? message : 'Storage could not complete the request. Check the database and Blob connection in Vercel.' }, { status: message.startsWith('CONFLICT:') ? 409 : known ? 400 : 503, headers: { 'Cache-Control':'no-store' } });
}

export function presignedUploadBody(body:Record<string,unknown>) {
 if(body.type!=='blob.generate-presigned-url' || !body.payload || typeof body.payload!=='object' || Array.isArray(body.payload)) throw new Error('Invalid upload request.');
 const payload=body.payload as Record<string,unknown>;
 if(typeof payload.pathname!=='string' || typeof payload.multipart!=='boolean' || (payload.clientPayload!==null && payload.clientPayload!==undefined && typeof payload.clientPayload!=='string')) throw new Error('Invalid upload request.');
 return {type:'blob.generate-presigned-url' as const,payload:{pathname:payload.pathname,multipart:payload.multipart,clientPayload:typeof payload.clientPayload==='string'?payload.clientPayload:null}};
}
