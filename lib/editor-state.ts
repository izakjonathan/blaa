import type { ContentDocument } from './content-schema.ts';

/** Apply the acknowledged server state without losing edits made after submission. */
export function mergePendingEdits(current: ContentDocument, submitted: ContentDocument, acknowledged: ContentDocument): ContentDocument {
 const result: ContentDocument = {text:{...acknowledged.text}, images:{...acknowledged.images}};
 for (const id of new Set([...Object.keys(submitted.text), ...Object.keys(current.text)])) {
  if (current.text[id] === submitted.text[id]) continue;
  if (current.text[id] === undefined) delete result.text[id];
  else result.text[id] = current.text[id];
 }
 for (const id of new Set([...Object.keys(submitted.images), ...Object.keys(current.images)])) {
  if (JSON.stringify(current.images[id]) === JSON.stringify(submitted.images[id])) continue;
  if (current.images[id] === undefined) delete result.images[id];
  else result.images[id] = current.images[id];
 }
 return result;
}
