'use client';
import {useEffect,useState} from 'react';

/** Reserve the small viewport for editing, including WebViews that resize innerHeight. */
export function useStockKeyboard(){
 const [open,setOpen]=useState(false);
 useEffect(()=>{
  const viewport=window.visualViewport;let baseline=window.innerHeight,frame=0;
  const update=()=>{
   const editing=Boolean(document.activeElement?.matches('input:not([type=checkbox]):not([type=file]),textarea,select'));
   if(!editing)baseline=window.innerHeight;
   setOpen(Boolean(editing&&viewport&&Math.max(baseline,window.innerHeight)-viewport.height>140));
  };
  const focus=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);};
  const rotate=()=>{baseline=window.innerHeight;update();};
  update();viewport?.addEventListener('resize',update);window.addEventListener('resize',update);window.addEventListener('orientationchange',rotate);document.addEventListener('focusin',focus);document.addEventListener('focusout',focus);
  return()=>{cancelAnimationFrame(frame);viewport?.removeEventListener('resize',update);window.removeEventListener('resize',update);window.removeEventListener('orientationchange',rotate);document.removeEventListener('focusin',focus);document.removeEventListener('focusout',focus);};
 },[]);
 return open;
}
