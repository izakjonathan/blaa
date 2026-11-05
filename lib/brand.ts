import {uniformPhotoOverlay} from './image-treatment.ts';
import { textValue, type ContentDocument } from './content-schema.ts';

export function brandColors(document: ContentDocument) {
  const color = (id: string, fallback: string) => {
    const value = textValue(document, id);
    return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  };
  return { green: color('brand.green', '#1A1E3A'), gold: color('brand.gold', '#DB8C59') };
}

export function photoOverlayColor(document:ContentDocument){
 const value=textValue(document,'brand.overlayColor');
 return /^#[0-9a-f]{6}$/i.test(value)?value:brandColors(document).green;
}

// Strict hex validation keeps stored values safe inside the server-rendered stylesheet.
export function brandStyle(document: ContentDocument) {
  const { green, gold } = brandColors(document);
  const grain=Math.max(0,Math.min(100,Number(textValue(document,'brand.grain'))||0));
  const rgb = [1, 3, 5].map(index => parseInt(green.slice(index, index + 2), 16)).join(' ');
  const opacity=Math.max(0,Math.min(100,Number(textValue(document,'brand.overlayOpacity'))||0));
  return `:root{--backend-bg:${(/^#[0-9a-f]{6}$/i.test(textValue(document,'brand.adminBackground'))?textValue(document,'brand.adminBackground'):'#1A1E3A')};--hero-photo-brightness:${uniformPhotoOverlay(document)?1-.28*opacity/100:1};--photo-overlay-color:${photoOverlayColor(document)};--brand-grain-opacity:${grain/100*.18};--brand-green:${green};--brand-gold:${gold};--brand-green-rgb:${rgb};--brand-dark:color-mix(in srgb,${green} 66%,black);--brand-deep:color-mix(in srgb,${green} 78%,black);}`;
}
