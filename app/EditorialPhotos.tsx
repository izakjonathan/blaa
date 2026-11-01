'use client';
import {useLayoutEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {useContent} from './Content';
import {editorialSettings,frameGeometry} from '../lib/editorial-motion';
import {afterPaint} from '../lib/motion';

const seen=new WeakSet<HTMLImageElement>();
const selector='.split-photo,.photo-story figure,.collection-photos figure,.venue-gallery figure,.venue-exhibition';
const expandable='.collection-wide,.venue-gallery figure:first-child,.venue-exhibition';
type Photo={frame:HTMLElement;image:HTMLImageElement;expand:boolean};

/** Native scroll owns framing; individual CSS scale owns zoom, separate from parallax. */
export default function EditorialPhotos(){
 const pathname=usePathname(),settings=editorialSettings(useContent());
 const [reduced,setReduced]=useState(false);
 useLayoutEffect(()=>{
  const query=matchMedia('(prefers-reduced-motion: reduce)');
  const change=()=>setReduced(query.matches);change();query.addEventListener('change',change);
  return()=>query.removeEventListener('change',change);
 },[]);
 useLayoutEffect(()=>{
  const main=document.querySelector('main');
  if(!main||!settings.enabled||(!settings.frames&&!settings.zoom)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let active=true,job=0;
  const photos=new Map<HTMLElement,Photo>(),paints=new Set<()=>void>();
  const covered=()=>document.documentElement.classList.contains('menu-open');
  const update=()=>{
   job=0;if(!active)return;
   const viewport=window.innerHeight;
   for(const photo of photos.values()){
    const rect=photo.frame.getBoundingClientRect();
    if(photo.expand){
     const shape=frameGeometry(rect.top,viewport,settings.end,settings.inset,settings.radius);
     photo.frame.style.setProperty('--editorial-inset',`${shape.inset.toFixed(2)}px`);
     photo.frame.style.setProperty('--editorial-radius',`${shape.radius.toFixed(2)}px`);
    }
    if(settings.zoom&&!seen.has(photo.image)&&rect.top<viewport*.95&&rect.bottom>0&&!covered()){
     seen.add(photo.image);
     const cancel=afterPaint(()=>{paints.delete(cancel);if(active&&photos.has(photo.frame))photo.image.dataset.photoZoom='settled';});
     paints.add(cancel);
    }
   }
  };
  const schedule=()=>{if(active&&!job)job=requestAnimationFrame(update);};
  const release=(photo:Photo)=>{
   resize.unobserve(photo.frame);delete photo.frame.dataset.editorialFrame;delete photo.frame.dataset.editorialPhoto;delete photo.image.dataset.photoZoom;
   photo.frame.style.removeProperty('--editorial-inset');photo.frame.style.removeProperty('--editorial-radius');
  };
  const resize=new ResizeObserver(schedule);
  const refresh=()=>{
   const frames=new Set(Array.from(main.querySelectorAll<HTMLElement>(selector)));
   for(const [frame,photo] of photos)if(!frames.has(frame)){release(photo);photos.delete(frame);}
   for(const frame of frames){
    if(photos.has(frame))continue;
    const image=frame.querySelector<HTMLImageElement>(':scope > img[data-image-treatment]');
    if(!image)continue;
    const expand=settings.frames&&frame.matches(expandable);
    photos.set(frame,{frame,image,expand});resize.observe(frame);frame.dataset.editorialPhoto='true';
    if(expand)frame.dataset.editorialFrame='true';
    if(settings.zoom)image.dataset.photoZoom=seen.has(image)?'settled':'pending';
   }
   update();
  };
  const mutation=new MutationObserver(records=>{
   if(records.some(record=>[...record.addedNodes,...record.removedNodes].some(node=>node instanceof Element&&(node.matches('img')||node.querySelector('img')))))refresh();
  });
  const menu=new MutationObserver(schedule);
  refresh();mutation.observe(main,{subtree:true,childList:true});menu.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});main.addEventListener('load',schedule,true);
  return()=>{
   active=false;cancelAnimationFrame(job);paints.forEach(cancel=>cancel());mutation.disconnect();menu.disconnect();photos.forEach(release);resize.disconnect();
   window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);main.removeEventListener('load',schedule,true);
  };
 },[pathname,reduced,settings.enabled,settings.frames,settings.zoom,settings.inset,settings.radius,settings.end]);
 return null;
}
