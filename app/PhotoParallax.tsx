'use client';
import {useLayoutEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {useContent} from './Content';
import {followPhoto,photoParallaxGeometry,photoParallaxSettings} from '../lib/photo-parallax';

const frames='.scene,.split-photo,.photo-story figure,.company-photo,.collection-photos figure,.collection-paper figure,.venue-gallery figure,.venue-exhibition';
type Photo={image:HTMLImageElement;frame:HTMLElement;shift:number;height:number};

/** Only the bitmap moves. Layout, overlays, captions and reveal containers stay put. */
export default function PhotoParallax(){
 const pathname=usePathname(),settings=photoParallaxSettings(useContent());
 const [systemReduced,setSystemReduced]=useState(false);
 useLayoutEffect(()=>{
  const query=matchMedia('(prefers-reduced-motion: reduce)');
  const change=()=>setSystemReduced(query.matches);
  change();query.addEventListener('change',change);
  return()=>query.removeEventListener('change',change);
 },[]);
 useLayoutEffect(()=>{
  const main=document.querySelector('main');
  if(!main||!settings.enabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let active=true,animation=0,layout=0,lastTime=0;
  const photos=new Map<HTMLImageElement,Photo>(),visible=new Set<Photo>();
  let viewport=window.innerHeight;
  const travel=()=>window.innerWidth<=600?settings.mobile:settings.desktop;
  const target=(photo:Photo)=>{
   const rect=photo.frame.getBoundingClientRect();
   return photoParallaxGeometry(rect.top+rect.height/2,viewport,photo.height,travel()).shift;
  };
  const paint=(photo:Photo)=>photo.image.style.setProperty('--photo-parallax-shift',`${photo.shift.toFixed(3)}px`);
  const tick=(time:number)=>{
   animation=0;
   if(!active)return;
   const elapsed=lastTime?Math.min(64,time-lastTime):1000/60;lastTime=time;
   let moving=false;
   for(const photo of visible){
    const next=target(photo);
    photo.shift=followPhoto(photo.shift,next,elapsed,settings.smoothing);
    if(Math.abs(next-photo.shift)<.025)photo.shift=next;else moving=true;
    paint(photo);
   }
   if(moving)animation=requestAnimationFrame(tick);
  };
  const schedule=()=>{if(active&&!animation){lastTime=0;animation=requestAnimationFrame(tick);}};
  const enter=(photo:Photo)=>{
   visible.add(photo);photo.image.dataset.parallaxActive='true';
   photo.shift=target(photo);paint(photo);schedule();
  };
  const intersection=new IntersectionObserver(entries=>{
   for(const entry of entries){
    const photo=Array.from(photos.values()).find(photo=>photo.frame===entry.target);
    if(!photo)continue;
    if(entry.isIntersecting){if(!visible.has(photo))enter(photo);}
    else{visible.delete(photo);delete photo.image.dataset.parallaxActive;}
   }
  },{rootMargin:'120px 0px'});
  const measure=()=>{
   viewport=window.innerHeight;
   for(const photo of photos.values()){
    photo.height=photo.image.clientHeight;
    if(photo.height<=0)continue;
    photo.frame.dataset.parallaxFrame='true';photo.image.dataset.photoParallax='true';
    const geometry=photoParallaxGeometry(0,viewport,photo.height,travel());
    photo.image.style.setProperty('--photo-parallax-scale',String(geometry.scale));
    // Clamp an old desktop offset immediately when switching to a smaller range.
    photo.shift=Math.max(-travel()/2,Math.min(travel()/2,photo.shift));paint(photo);
   }
   schedule();
  };
  const scheduleMeasure=()=>{if(active&&!layout)layout=requestAnimationFrame(()=>{layout=0;measure();});};
  const resize=new ResizeObserver(scheduleMeasure);
  const clear=(photo:Photo)=>{
   intersection.unobserve(photo.frame);resize.unobserve(photo.frame);visible.delete(photo);
   delete photo.frame.dataset.parallaxFrame;delete photo.image.dataset.photoParallax;delete photo.image.dataset.parallaxActive;
   photo.image.style.removeProperty('--photo-parallax-shift');photo.image.style.removeProperty('--photo-parallax-scale');
  };
  const refresh=()=>{
   const images=new Set(Array.from(main.querySelectorAll<HTMLImageElement>('img[data-image-treatment]')).filter(image=>!image.closest('.venue-posters,.brand-splash,.hero-video-layer')&&image.parentElement?.matches(frames)));
   for(const [image,photo] of photos)if(!images.has(image)){clear(photo);photos.delete(image);}
   for(const image of images)if(!photos.has(image)){
    const photo={image,frame:image.parentElement as HTMLElement,height:image.clientHeight,shift:0};photos.set(image,photo);
    resize.observe(photo.frame);intersection.observe(photo.frame);
    const rect=photo.frame.getBoundingClientRect();
    if(rect.bottom>-120&&rect.top<viewport+120)enter(photo);
   }
   measure();
  };
  const mutation=new MutationObserver(records=>{
   const hasPhoto=(node:Node)=>node instanceof Element&&(node.matches('img[data-image-treatment]')||Boolean(node.querySelector('img[data-image-treatment]')));
   if(records.some(record=>[...record.addedNodes,...record.removedNodes].some(hasPhoto)))refresh();
  });
  refresh();mutation.observe(main,{subtree:true,childList:true});
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',scheduleMeasure,{passive:true});
  main.addEventListener('load',scheduleMeasure,true);
  const settled=(event:TransitionEvent)=>{if(event.propertyName==='transform')schedule();};
  main.addEventListener('transitionend',settled);
  return()=>{
   active=false;cancelAnimationFrame(animation);cancelAnimationFrame(layout);
   window.removeEventListener('scroll',schedule);window.removeEventListener('resize',scheduleMeasure);
   main.removeEventListener('load',scheduleMeasure,true);main.removeEventListener('transitionend',settled);
   mutation.disconnect();photos.forEach(clear);intersection.disconnect();resize.disconnect();photos.clear();visible.clear();
  };
 },[pathname,systemReduced,settings.enabled,settings.mobile,settings.desktop,settings.smoothing]);
 return null;
}
