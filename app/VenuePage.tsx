'use client';
import { useRef, useState } from 'react';
import { Copy, ContentImage, ContentLink, useContent } from './Content';
import { imageValue, textValue } from '../lib/content-schema';
import config from '../lib/venue-pages.json';
import Heading from './Heading';
import VenueDetails from './VenueDetails';

type PageID = 'events'|'about'|'gallery'|'play'|'art'|'contact';
function Concerts() {
 const content=useContent();
 const groups=new Map<string,number[]>();
 for(let i=0;i<config.events;i++) {const group=textValue(content,`events.${i}.group`);groups.set(group,[...(groups.get(group)??[]),i]);}
 return <section className="venue-programme">
  <div className="venue-section-intro"><Heading as="h2" data-reveal>Musikken på<br/>Apoteket.</Heading><p>Mandag: Jazz Jam kl. 20–23.<br/>Onsdag: Songwriters Playground kl. 20–23.<br/>Lørdag: livemusik kl. 21–00, entré 50 kr. i døren. Ingen forsalg.</p></div>
  {[...groups].map(([group,ids])=><div key={group} className="venue-event-group"><h2>{group}</h2><div className="venue-event-grid">{ids.map(i=><article key={i} className="venue-event">
   <ContentLink field={`events.${i}.link`}><ContentImage field={`events.${i}.image`} loading="lazy" sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"/></ContentLink>
   <h3><ContentLink field={`events.${i}.link`}><Copy field={`events.${i}.name`}/></ContentLink></h3>
   <p><Copy field={`events.${i}.date`}/>{textValue(content,`events.${i}.time`) && <> · kl. <Copy field={`events.${i}.time`}/></>}</p><p><Copy field={`events.${i}.note`}/></p>
  </article>)}</div></div>)}
 </section>;
}
function Gallery() {
 const content=useContent(),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement|null>(null);
 const [selected,setSelected]=useState(0);
 const image=imageValue(content,`gallery.${selected}.image`);
 const change=(step:number)=>setSelected(i=>(i+step+config.gallery)%config.gallery);
 return <section className="venue-gallery" aria-label="Billeder fra Blågårds Apotek">
  {Array.from({length:config.gallery},(_,i)=><button key={i} type="button" className="venue-gallery-open" aria-label={`Åbn billede ${i+1}`} onClick={e=>{trigger.current=e.currentTarget;setSelected(i);dialog.current?.showModal();}}><ContentImage field={`gallery.${i}.image`} loading="lazy" sizes="(max-width: 600px) 100vw, 50vw"/></button>)}
  <dialog className="venue-lightbox" ref={dialog} onClose={()=>trigger.current?.focus()} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}} onKeyDown={e=>{if(e.key==='ArrowRight')change(1);if(e.key==='ArrowLeft')change(-1);}}>
   <button type="button" className="venue-lightbox-close" onClick={()=>dialog.current?.close()} aria-label="Luk billede">Luk ×</button>
   <img src={image.src} width={image.width} height={image.height} alt={image.alt}/>
   <div className="venue-lightbox-controls"><button type="button" onClick={()=>change(-1)}>← Forrige</button><span>{selected+1} / {config.gallery}</span><button type="button" onClick={()=>change(1)}>Næste →</button></div>
  </dialog>
 </section>;
}
export default function VenuePage({page}:{page:PageID}) {
 const paragraphs=page==='about'||page==='play'||page==='art'?config.paragraphs[page]:0;
 return <main id="main" className="experience venue-page">
  <section className="scene venue-hero"><ContentImage field={`${page}.hero`} className="scene-photo" loading="eager" fetchPriority="high" sizes="100vw"/><div className="scene-shade"/><div className="scene-content"><p className="eyebrow">Blågårds Apotek · Kroteket</p><Heading as="h1" data-reveal><Copy field={`${page}.title`}/></Heading><p><Copy field={`${page}.intro`}/></p></div></section>
  {paragraphs>0&&<section className="venue-editorial gold-section"><div className="venue-prose">{Array.from({length:paragraphs},(_,i)=><p key={i} data-reveal><Copy field={`${page}.body.${i}`}/></p>)}
   {page==='play'&&<div className="venue-actions"><ContentLink className="pill" field="play.booking.link"><Copy field="play.booking.label"/></ContentLink><ContentLink className="pill" field="play.feature.link"><Copy field="play.feature.label"/></ContentLink></div>}
   {page==='art'&&<ContentLink className="pill" field="art.enquiry.link"><Copy field="art.enquiry.label"/></ContentLink>}
  </div></section>}
  {page==='events'&&<Concerts/>}
  {page==='gallery'&&<Gallery/>}
  {page==='art'&&<section className="venue-exhibition"><Heading as="h2" data-reveal>Månedens udstilling</Heading><ContentImage field="art.poster" loading="lazy" sizes="(max-width: 600px) 100vw, 70vw"/></section>}
  {page==='contact'&&<><section className="venue-contact gold-section"><div className="venue-contact-grid">{[0,1,2,3].map(i=><div key={i}><h2><Copy field={`contact.${i}.label`}/></h2><ContentLink field={`contact.${i}.link`}><Copy field={`contact.${i}.email`}/></ContentLink></div>)}</div><VenueDetails/></section></>}
 </main>;
}
