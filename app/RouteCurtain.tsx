'use client';
import {useLayoutEffect,useRef,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {useContent} from './Content';
import {afterPaint} from '../lib/motion';
import {createRouteTransition,routeSettings,routeTarget,type CurtainPhase} from '../lib/route-transition';

export default function RouteCurtain(){
 const pathname=usePathname(),router=useRouter(),settings=routeSettings(useContent());
 const [phase,setPhase]=useState<CurtainPhase>('idle');
 const controller=useRef<ReturnType<typeof createRouteTransition>|null>(null);
 const path=useRef(pathname);path.current=pathname;
 useLayoutEffect(()=>{
  if(!settings.enabled)return;
  const root=document.documentElement,query=matchMedia('(prefers-reduced-motion: reduce)');
  const inert=new Map<HTMLElement,boolean>();
  let focusTarget:HTMLElement|null=null,sourceFocus:HTMLElement|null=null;
  const lock=()=>document.querySelectorAll<HTMLElement>('main,.brand-footer,.floating-header>*').forEach(element=>{
   if(!inert.has(element))inert.set(element,element.inert);element.inert=true;
  });
  const release=()=>{
   root.classList.remove('route-transitioning','route-covered');
   inert.forEach((value,element)=>{element.inert=value;});inert.clear();
  };
  const machine=createRouteTransition({cover:settings.cover,reveal:settings.reveal,
   phase:next=>{
    if(next==='covering')sourceFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    root.classList.toggle('route-transitioning',next!=='idle');
    root.classList.toggle('route-covered',next==='covering'||next==='waiting');
    if(next!=='idle')lock();setPhase(next);
   },
   warm:href=>router.prefetch(href),commit:href=>router.push(href,{scroll:false}),
   ready:href=>{
    lock();
    let anchor:HTMLElement|null=null;
    try{const hash=new URL(href,location.href).hash;if(hash)anchor=document.getElementById(decodeURIComponent(hash.slice(1)));}catch{/* Invalid hashes use the page top. */}
    if(anchor)anchor.scrollIntoView({behavior:'instant',block:'start'});
    else window.scrollTo({top:0,left:0,behavior:'instant'});
    focusTarget=anchor??document.querySelector<HTMLElement>('main h1,main');
    window.dispatchEvent(new Event('resize'));
   },
   done:completed=>{
    release();
    if(completed&&focusTarget?.isConnected){
     const previous=focusTarget.getAttribute('tabindex');focusTarget.setAttribute('tabindex','-1');focusTarget.focus({preventScroll:true});
     if(previous===null)focusTarget.removeAttribute('tabindex');else focusTarget.setAttribute('tabindex',previous);
    }
    if(!completed&&sourceFocus?.isConnected)sourceFocus.focus({preventScroll:true});
    focusTarget=null;sourceFocus=null;
   },
   timer:(fn,delay)=>window.setTimeout(fn,delay),clear:id=>window.clearTimeout(id),paint:afterPaint,
  });
  controller.current=machine;
  const click=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||query.matches||root.dataset.motion==='reduced'||root.classList.contains('menu-open'))return;
   const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href]'):null;
   if(!link||!link.closest('main,.brand-footer,.floating-header')||link.hasAttribute('download')||(link.target&&link.target!=='_self')||link.rel.split(/\s+/).includes('external')||link.hasAttribute('data-no-transition'))return;
   const target=routeTarget(link.href,location.href);if(!target)return;
   event.preventDefault();
   if(!machine.active)machine.start(target,path.current);
  };
  const cancel=()=>machine.cancel();
  const key=(event:KeyboardEvent)=>{if(machine.active&&event.key==='Escape'){event.preventDefault();cancel();}};
  const preference=()=>{if(query.matches)cancel();};
  document.addEventListener('click',click,true);document.addEventListener('keydown',key,true);
  window.addEventListener('popstate',cancel);query.addEventListener('change',preference);
  return()=>{
   machine.cancel();release();controller.current=null;
   document.removeEventListener('click',click,true);document.removeEventListener('keydown',key,true);
   window.removeEventListener('popstate',cancel);query.removeEventListener('change',preference);
  };
 },[router,settings.enabled,settings.cover,settings.reveal]);
 useLayoutEffect(()=>{controller.current?.arrive(pathname);},[pathname]);
 return <><div className="route-curtain" data-phase={phase} aria-hidden="true" onTransitionEnd={event=>{
   if(event.target!==event.currentTarget||event.propertyName!=='transform')return;
   if(phase==='covering')controller.current?.covered();
   else if(phase==='revealing')controller.current?.revealed();
  }}><span>{phase==='waiting'?'Indlæser…':''}</span></div><span className="route-status" role="status">{phase==='waiting'?'Indlæser siden…':''}</span></>;
}
