'use client';
import Link from 'next/link';
import Image, { type ImageProps } from 'next/image';
import { createContext, useContext, useId, useEffect, useState, Fragment, type ReactNode, type AnchorHTMLAttributes, type CSSProperties } from 'react';
import { emptyDocument, textValue, imageValue, fieldMap, validateDocument, type ContentDocument, type ContentImageValue } from '../lib/content-schema';

import { imageOverlayStrength } from '../lib/image-treatment';
import { brandStyle } from '../lib/brand';

const Context = createContext<ContentDocument>(emptyDocument);
export function ContentProvider({ value, children }: { value: ContentDocument; children: ReactNode }) {
  const [draft, setDraft] = useState<ContentDocument | null>(null);
  useEffect(() => {
    if (new URLSearchParams(location.search).get('preview') !== 'draft') return;
    const controller = new AbortController();
    let receivedLiveDraft = false;
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== 'plaisir-preview') return;
      try { const next = validateDocument(event.data.document); receivedLiveDraft = true; setDraft(next); } catch { /* Ignore malformed preview messages. */ }
    };
    window.addEventListener('message', receive);
    fetch('/api/editor/content', { cache: 'no-store', signal: controller.signal }).then(r => r.json()).then(data => { if (data.state && !receivedLiveDraft) setDraft(validateDocument(data.state.draft)); }).catch(() => {});
    if (window.parent !== window) window.parent.postMessage({ type:'plaisir-preview-ready' }, location.origin);
    return () => { controller.abort(); window.removeEventListener('message', receive); };
  }, []);
  return <Context.Provider value={draft ?? value}><style data-brand-palette>{brandStyle(draft ?? value)}</style>{children}</Context.Provider>;
}
export function useContent() { return useContext(Context); }
export function Copy({ field }: { field: string }) {
  const value = textValue(useContent(), field);
  return <FormattedText value={value}/>;
}
function FormattedText({ value }: { value: string }) {
  // Deliberately limited formatting; never render stored HTML.
  const breaks = (text: string) => text.split('\n').map((line,index)=><Fragment key={index}>{index>0 ? <br/> : null}{line}</Fragment>);
  return <>{value.replace(/\r\n?/g,'\n').split(/(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g).map((part, i) => part === '\n' ? <br key={i}/> : part.startsWith('**') ? <strong key={i}>{breaks(part.slice(2,-2))}</strong> : part.startsWith('*') && part.endsWith('*') ? <em key={i}>{breaks(part.slice(1,-1))}</em> : <Fragment key={i}>{part}</Fragment>)}</>;
}
export function TitleLines({ field }: { field: string }) {
  const lines = textValue(useContent(), field).replace(/\r\n?/g,'\n').split('\n');
  return <>{lines.map((line,index)=><span className="hero-line" key={index} style={{'--hero-line-delay':`${300+Math.min(index,8)*140}ms`} as CSSProperties}><span><FormattedText value={line || '\u00a0'}/></span></span>)}</>;
}
export function ContentImage({ field, style, ...props }: { field: string } & Omit<ImageProps,'src'|'alt'|'width'|'height'>) {
  const document = useContent();
  const treatmentId = useId();
  const image = imageValue(document, field);
  const original = fieldMap.get(field)?.default as ContentImageValue;
  const customCrop = (document.images[field] || (field === 'splash.background' && document.images['experience.hero.image1'])) && (image.src !== original.src || image.x !== original.x || image.y !== original.y);
  // Version the restored-alpha artwork URL so existing optimized JPEG mattes expire.
  const displaySrc = /^\/brand\/collection\/(menu-(not-wine|wine|food)|coaster-(script|bottle))\.webp$/.test(image.src) ? image.src.replace(/\.webp$/, "-cutout.webp") : image.src;
  const opacity = imageOverlayStrength(document,image);
  return <><style>{`:is(.scene,.split-photo,.photo-story figure,.company-photo,.brand-splash,.splash-backdrop,.collection-photos figure,.collection-paper figure,.collection-backdrop):has(> img[data-image-treatment="${treatmentId}"]) { --image-overlay-strength: ${opacity}; }`}</style><Image {...props} data-image-treatment={treatmentId} data-overlay={image.overlay === false ? "off" : "on"} src={displaySrc} alt={image.alt} width={image.width} height={image.height} style={{...style, ...(customCrop ? {objectPosition:`${image.x}% ${image.y}%`} : {})}}/></>;
}
export function ContentLink({ field, ...props }: { field: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const href = textValue(useContent(), field);
  return href.startsWith('/') ? <Link {...props} href={href}/> : <a {...props} href={href}/>;
}
