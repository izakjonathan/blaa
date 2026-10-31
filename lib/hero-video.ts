import { textValue, type ContentDocument } from './content-schema.ts';

export function heroVideoSettings(document: ContentDocument) {
  const percent = (id: string, fallback: number, max: number) => {
    const value = Number(textValue(document, id));
    return Number.isFinite(value) ? Math.max(0, Math.min(max, value)) : fallback;
  };
  const color = textValue(document, 'experience.hero.videoOverlayColor');
  return {
    color: /^#[0-9a-f]{6}$/i.test(color) ? color : '#1A1E3A',
    opacity: percent('experience.hero.videoOverlayOpacity', 45, 100),
    saturation: percent('experience.hero.videoSaturation', 100, 200),
  };
}
