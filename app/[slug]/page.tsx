import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import Heading from '../Heading';
import { Copy, ContentImage, ContentLink } from '../Content';
import pages from '../../lib/venue-pages.json';

type VenuePage = {label:string;copy:string[];events?:{id:string;section:string;linked:boolean}[];photos?:string[]};
const records:Record<string,VenuePage> = pages;
export function generateStaticParams() { return Object.keys(records).map(slug=>({slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata> {
 const {slug}=await params;
 return {title:records[slug] ? `${records[slug].label} · Blågårds Apotek` : 'Blågårds Apotek'};
}
export default async function VenuePage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
 if(slug==='1671-2') permanentRedirect('/spil-hos-os');
 const page=records[slug]; if(!page) notFound();
 const sections=[...new Set(page.events?.map(event=>event.section))];
 return <main id="main" className="experience venue-page">
  <section className="scene venue-hero">
   <ContentImage field={`${slug}.hero`} className="scene-photo" loading="eager" fetchPriority="high" sizes="100vw"/>
   <div className="scene-shade"/>
   <div className="scene-content"><h1><Copy field={`${slug}.title`}/></h1><p><Copy field={`${slug}.intro`}/></p><a href="#content" className="pill">Læs mere <span aria-hidden="true">↓</span></a></div>
  </section>
  <div id="content">
   {page.copy.length>0 && <section className="venue-prose gold-section">{page.copy.map((id,index)=><p key={id} data-reveal className={index===0?'venue-lead':undefined}><Copy field={id}/></p>)}
    {slug==='spil-hos-os' && <div className="venue-actions"><a className="pill" href="mailto:booker@kroteket.dk">Booking ↗</a><a className="pill" href="mailto:benjaminaggerbeck@gmail.com">Singer-songwriter ↗</a></div>}
    {slug==='kunst' && <a className="pill" href="mailto:kunst@kroteket.dk">Send din portefølje ↗</a>}
   </section>}
   {slug==='events' && sections.map(section=><section className="brand-world" key={section}><div className="world-heading"><Heading as="h2" data-reveal>{section}</Heading></div><div className="venue-posters">{page.events?.filter(event=>event.section===section).map(event=><article key={event.id} data-reveal><figure><ContentImage field={event.id+'.image'} loading="lazy" sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"/></figure><h3><Copy field={event.id+'.name'}/></h3><p><Copy field={event.id+'.date'}/></p>{event.linked && <ContentLink className="pill" field={event.id+'.link'}>Se event ↗</ContentLink>}</article>)}</div></section>)}
   {slug==='galleri' && <section className="venue-gallery" aria-label="Billeder fra Blågårds Apotek">{page.photos?.map(id=><figure key={id} data-reveal><ContentImage field={id} loading="lazy" sizes="(max-width:600px) 100vw, 50vw"/></figure>)}</section>}
   {slug==='kunst' && <section className="brand-world"><div className="world-heading"><Heading as="h2" data-reveal>Månedens udstilling</Heading></div><figure className="venue-exhibition"><ContentImage field="kunst.exhibition" loading="lazy" sizes="(max-width:600px) 100vw, 70vw"/></figure></section>}
   {slug==='kontakt' && <section className="venue-prose gold-section"><Heading as="h2" data-reveal>Skriv til os.</Heading><div className="venue-contacts">{['general','press','booking','art'].map(id=><div key={id}><h3><Copy field={`kontakt.${id}.label`}/></h3><ContentLink field={`kontakt.${id}.link`}><Copy field={`kontakt.${id}.email`}/></ContentLink></div>)}</div><p><Copy field="shared.address"/></p><p><Copy field="shared.hours"/></p><ContentLink field="shared.phoneLink" className="pill"><Copy field="shared.phone"/></ContentLink><ContentLink field="kontakt.map" className="pill">Find vej ↗</ContentLink></section>}
  </div>
 </main>;
}
