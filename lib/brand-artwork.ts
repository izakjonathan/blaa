import { brandColors } from './brand.ts';
import type { ContentDocument } from './content-schema.ts';
export const venueLogo = '/kroteket/5f84ffc1-logoblaagardsapotekh-1300x768-1.png';
const artworkSources = new Set([venueLogo, '/kroteket/cac052ae-logo-shadow.png', '/kroteket/6c6d53aa-guitar.png', '/kroteket/5a192dae-painting.png']);
export function isBrandArtwork(src: string) { return artworkSources.has(src); }
export function artworkStyle(document: ContentDocument, src: string, tone: 'green' | 'gold' = 'gold') {
 if (!isBrandArtwork(src)) throw new Error('Unknown brand artwork.');
 return { backgroundColor: brandColors(document)[tone], maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` };
}
