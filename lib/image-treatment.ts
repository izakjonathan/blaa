import {textValue,type ContentDocument,type ContentImageValue} from './content-schema.ts';

export function uniformPhotoOverlay(document:ContentDocument){return textValue(document,'brand.photoTreatment')!=='per-image';}
/** Uniform mode deliberately ignores legacy per-photo off/opacity overrides. */
export function imageOverlayOpacity(document:ContentDocument,image:ContentImageValue):number {
 const global=Number(textValue(document,'brand.overlayOpacity'));
 return (uniformPhotoOverlay(document)?undefined:image.overlayOpacity) ?? (Number.isFinite(global)?Math.max(0,Math.min(100,global)):100);
}
export function imageOverlayStrength(document:ContentDocument,image:ContentImageValue):number {
 return !uniformPhotoOverlay(document)&&image.overlay===false?0:imageOverlayOpacity(document,image)/100;
}
