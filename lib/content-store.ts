import { validateDocument, type ContentDocument } from './content-schema.ts';
export type Query = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;
export async function initStore(db: Query) {
    await db`CREATE TABLE IF NOT EXISTS blaa_content (id integer PRIMARY KEY CHECK (id=1), revision integer NOT NULL DEFAULT 0, draft jsonb NOT NULL DEFAULT '{"text":{},"images":{}}', published jsonb NOT NULL DEFAULT '{"text":{},"images":{}}', previous jsonb, updated_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz)`;
    await db`CREATE TABLE IF NOT EXISTS blaa_media (id uuid PRIMARY KEY, pathname text NOT NULL UNIQUE, width integer NOT NULL, height integer NOT NULL, alt text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now())`;
    await db`CREATE TABLE IF NOT EXISTS blaa_uploads (id uuid PRIMARY KEY, pathname text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), finished boolean NOT NULL DEFAULT false)`;
    await db`INSERT INTO blaa_content (id) VALUES (1) ON CONFLICT DO NOTHING`;
}
export type ContentState = { revision: number; draft: ContentDocument; published: ContentDocument; previous: ContentDocument | null; updatedAt: string; publishedAt: string | null };
export async function readStore(db: Query): Promise<ContentState> {
  const [row] = await db`SELECT * FROM blaa_content WHERE id=1`;
  return { revision: Number(row.revision), draft: validateDocument(row.draft), published: validateDocument(row.published), previous: row.previous ? validateDocument(row.previous) : null, updatedAt: String(row.updated_at), publishedAt: row.published_at ? String(row.published_at) : null };
}
export async function writeStore(db: Query, action: 'save' | 'publish' | 'restore', revision: number, document?: ContentDocument): Promise<ContentState> {
  if (document) {
    const ids = Object.values(document.images).map(image => image.src).filter(src => src.startsWith('/media/')).map(src => src.split('/').at(-1)!);
    if (ids.length) {
      const rows = await db`SELECT id::text FROM blaa_media WHERE id=ANY(${ids}::uuid[])`;
      if (new Set(rows.map(row => row.id)).size !== new Set(ids).size) throw new Error('An image is no longer available. Choose another image.');
    }
  }
  const data = JSON.stringify(document);
  const rows = action === 'restore'
    ? await db`UPDATE blaa_content SET draft=previous, published=previous, previous=published, revision=revision+1, updated_at=now(), published_at=now() WHERE id=1 AND revision=${revision} AND previous IS NOT NULL RETURNING id`
    : action === 'publish'
      ? await db`UPDATE blaa_content SET draft=${data}::jsonb, previous=CASE WHEN published IS DISTINCT FROM ${data}::jsonb THEN published ELSE previous END, published=${data}::jsonb, revision=revision+1, updated_at=now(), published_at=now() WHERE id=1 AND revision=${revision} RETURNING id`
      : await db`UPDATE blaa_content SET draft=${data}::jsonb, revision=revision+1, updated_at=now() WHERE id=1 AND revision=${revision} RETURNING id`;
  if (!rows.length) throw new Error('CONFLICT: Content changed on another device, or there is no previous version. Reload before saving again.');
  return readStore(db);
}

/** Public rendering must not depend on draft or restore-history validity. */
export async function readPublishedStore(db:Query):Promise<ContentDocument> {
 const [row]=await db`SELECT published FROM blaa_content WHERE id=1`;
 if(!row)throw new Error('Content row is missing.');
 return validateDocument(row.published);
}
