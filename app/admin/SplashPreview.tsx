'use client';
import {useLayoutEffect,useRef,useState} from 'react';
import BrandSplash from '../BrandSplash';
import {useContent} from '../Content';
import {splashSettings} from '../../lib/splash';
import {animationSettings} from '../../lib/animation-settings';
import {runSplashSequence,type SplashTarget} from '../../lib/splash-sequence';

/** Replay the real splash timeline without consuming the visitor's intro state. */
export default function SplashPreview(){
 const root=useRef<HTMLDivElement>(null),document=useContent();
 const settings=splashSettings(document);
 const {splashSpeed:speed,splashEase:easing}=animationSettings(document);
 const [finished,setFinished]=useState(false);
 useLayoutEffect(()=>{
  const container=root.current;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(!container||!settings.enabled||reduced.matches)return;
  const logo=container.querySelector<HTMLElement>('.splash-logo');
  if(logo)logo.style.opacity='0';
  let active=true;
  const animations:Animation[]=[],timers=new Map<ReturnType<typeof setTimeout>,()=>void>();
  setFinished(false);
  const animate=async(target:SplashTarget,visible:boolean,duration:number,delay=0)=>{
   if(!active)return;
   const element=container.querySelector<HTMLElement>({backdrop:'.splash-backdrop',logo:'.splash-logo',plate:'.brand-splash'}[target]);
   if(!element)return;
   const movement=target==='logo';
   const hidden={opacity:0,transform:movement?(visible?'translateY(16px)':'translateY(-10px)'):'none'},shown={opacity:1,transform:'none'};
   const animation=element.animate(visible?[hidden,shown]:[shown,hidden],{duration:duration*100/speed,delay:delay*100/speed,easing,fill:'both'});
   animations.push(animation);await animation.finished.catch(()=>{});
  };
  const wait=(ms:number)=>new Promise<void>(resolve=>{const timer=setTimeout(()=>{timers.delete(timer);resolve();},ms);timers.set(timer,resolve);});
  void runSplashSequence({active:()=>active,showLogo:settings.showLogo,hold:settings.duration,animate,wait,hero:()=>{},complete:()=>setFinished(true)});
  const stop=()=>{active=false;animations.forEach(animation=>animation.cancel());timers.forEach((resolve,timer)=>{clearTimeout(timer);resolve();});logo?.style.removeProperty('opacity');};
  reduced.addEventListener('change',stop);
  return()=>{reduced.removeEventListener('change',stop);stop();};
 },[settings.enabled,settings.showLogo,settings.duration,speed,easing]);
 return <div ref={root} className="editor-splash-sample"><BrandSplash preview/><p role="status">{finished?'Splash finished. Use Replay preview to watch it again.':'Splash preview uses your draft settings. Device Reduce Motion is respected.'}</p></div>;
}
