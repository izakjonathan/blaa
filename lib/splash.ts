import { textValue, type ContentDocument } from './content-schema.ts';

export function splashSettings(document: ContentDocument) {
  return {
    enabled: textValue(document, 'splash.enabled') !== 'false' && textValue(document,'motion.enabled') !== 'false',
    overlay: Number(textValue(document, 'splash.overlay')),
    logoScale: Number(textValue(document, 'splash.logoScale')),
    duration: Number(textValue(document, 'splash.duration')),
    showLogo: textValue(document, 'splash.showLogo') !== 'false',
  };
}
