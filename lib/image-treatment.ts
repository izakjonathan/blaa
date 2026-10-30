import {textValue,type ContentDocument,type ContentImageValue} from './content-schema.ts';

/** Missing per-image opacity inherits the brand setting; explicit zero is retained. */
export function imageOverlayOpacity(document:ContentDocument,image:ContentImageValue):number {
 const global=Number(textValue(document,'brand.overlayOpacity'));
 return image.overlayOpacity ?? (Number.isFinite(global)?Math.max(0,Math.min(100,global)):100);
}
export function imageOverlayStrength(document:ContentDocument,image:ContentImageValue):number {
 return image.overlay===false?0:imageOverlayOpacity(document,image)/100;
}
