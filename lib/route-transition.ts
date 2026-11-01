import {textValue,type ContentDocument} from './content-schema.ts';

export function routeSettings(document:ContentDocument){
 return {enabled:textValue(document,'motion.enabled')!=='false'&&textValue(document,'motion.routeTransition')!=='false',cover:Number(textValue(document,'motion.routeCover')),reveal:Number(textValue(document,'motion.routeReveal'))};
}

/** Only ordinary same-origin page changes belong to the transition controller. */
export function routeTarget(href:string,current:string){
 let next:URL,from:URL;
 try{from=new URL(current);next=new URL(href,from);}catch{return null;}
 if(next.pathname.replace(/\/+$/,'')==='/1671-2')next.pathname='/spil-hos-os';
 const normal=(path:string)=>path.replace(/\/+$/,'')||'/';
 if(!['http:','https:'].includes(next.protocol)||next.origin!==from.origin||normal(next.pathname)===normal(from.pathname))return null;
 if(/^\/(admin|api|media)(\/|$)/.test(next.pathname)||/\.[a-z0-9]+$/i.test(next.pathname))return null;
 return next.pathname+next.search+next.hash;
}

export type CurtainPhase='idle'|'covering'|'waiting'|'revealing';
type Driver={cover:number;reveal:number;phase:(phase:CurtainPhase)=>void;warm:(href:string)=>void;commit:(href:string)=>void;ready:(href:string)=>void;done:(completed:boolean)=>void;timer:(fn:()=>void,delay:number)=>number;clear:(id:number)=>void;paint:(fn:()=>void)=>()=>void};

/** Start data prefetch on click; commit beneath the opaque panel, then reveal.
 * A timeout, interruption or unmount always releases the overlay and scroll lock.
 */
export function createRouteTransition(driver:Driver){
 let phase:CurtainPhase='idle',source='',target='',timer=0,cancelPaint:undefined|(()=>void);
 const clear=()=>{driver.clear(timer);cancelPaint?.();cancelPaint=undefined;};
 const finish=(completed:boolean)=>{clear();phase='idle';driver.phase(phase);driver.done(completed);};
 const covered=()=>{
  if(phase!=='covering')return;
  driver.clear(timer);phase='waiting';driver.phase(phase);
  timer=driver.timer(()=>finish(false),8000);
  try{driver.commit(target);}catch{finish(false);}
 };
 return {
  get active(){return phase!=='idle';},
  covered,
  revealed(){if(phase==='revealing')finish(true);},
  start(href:string,pathname:string){
   if(phase!=='idle')return false;
   source=pathname;target=href;phase='covering';driver.phase(phase);
   try{driver.warm(href);}catch{/* Prefetch failure must not prevent navigation. */}
   timer=driver.timer(covered,driver.cover+80);
   return true;
  },
  arrive(pathname:string){
   if(phase==='idle'||pathname===source)return;
   // Browser history or another navigation can interrupt an unfinished cover.
   if(phase!=='waiting'){finish(false);return;}
   if(cancelPaint)return;
   driver.clear(timer);
   cancelPaint=driver.paint(()=>{
    cancelPaint=undefined;driver.ready(target);phase='revealing';driver.phase(phase);
    timer=driver.timer(()=>finish(true),driver.reveal+80);
   });
  },
  cancel(){if(phase!=='idle')finish(false);else clear();},
 };
}
