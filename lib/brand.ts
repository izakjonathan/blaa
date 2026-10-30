import { textValue, type ContentDocument } from './content-schema.ts';

export function brandColors(document: ContentDocument) {
  const color = (id: string, fallback: string) => {
    const value = textValue(document, id);
    return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  };
  return { green: color('brand.green', '#1A1E3A'), gold: color('brand.gold', '#DB8C59') };
}

// Strict hex validation keeps stored values safe inside the server-rendered stylesheet.
export function brandStyle(document: ContentDocument) {
  const { green, gold } = brandColors(document);
  const grain=Math.max(0,Math.min(100,Number(textValue(document,'brand.grain'))||0));
  const rgb = [1, 3, 5].map(index => parseInt(green.slice(index, index + 2), 16)).join(' ');
  return `:root{--brand-grain-opacity:${grain/100*.18};--brand-green:${green};--brand-gold:${gold};--brand-green-rgb:${rgb};--brand-dark:color-mix(in srgb,${green} 66%,black);--brand-deep:color-mix(in srgb,${green} 78%,black);}`;
}
