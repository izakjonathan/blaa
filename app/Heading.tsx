'use client';
import {useLayoutEffect,useRef,type HTMLAttributes} from 'react';

type Tag='h1'|'h2'|'h3'|'h4'|'h5'|'h6';
/** Keep React's text untouched; visual line copies are owned by this effect only. */
export default function Heading({as:Tag='h2',children,...props}:HTMLAttributes<HTMLHeadingElement>&{as?:Tag;"data-reveal"?:string|boolean}) {
 const source=useRef<HTMLSpanElement>(null),visual=useRef<HTMLSpanElement>(null);
 useLayoutEffect(()=>{
  const text=source.current,layer=visual.current,heading=text?.parentElement;
  if(!text||!layer||!heading)return;
  let active=true,frame=0,lastWidth=-1;
  const split=()=>{
   if(!active)return;
   layer.replaceChildren();
   const walker=document.createTreeWalker(text,NodeFilter.SHOW_TEXT);
   const chars:{node:Text;start:number;end:number;top:number}[]=[];
   let node:Node|null;
   const range=document.createRange();
   while((node=walker.nextNode())){
    const value=node.textContent??'';
    for(let i=0;i<value.length;i++){
     range.setStart(node,i);range.setEnd(node,i+1);
     const rect=range.getBoundingClientRect();
     if(rect.height&&value[i].trim())chars.push({node:node as Text,start:i,end:i+1,top:rect.top});
    }
   }
   const lines:typeof chars[]=[];
   for(const char of chars){
    const line=lines.at(-1);
    if(!line||Math.abs(line[0].top-char.top)>3)lines.push([char]);else line.push(char);
   }
   const origin=text.getBoundingClientRect();
   lines.forEach((line,index)=>{
    range.setStart(line[0].node,line[0].start);range.setEnd(line.at(-1)!.node,line.at(-1)!.end);
    const rect=range.getBoundingClientRect();
    const mask=document.createElement('span'),inner=document.createElement('span');
    mask.className='heading-line';inner.className='heading-line-inner';
    mask.style.top=`${rect.top-origin.top}px`;mask.style.left=`${rect.left-origin.left}px`;
    mask.style.height=`${rect.height+origin.height*.001}px`;
    inner.style.setProperty('--line-delay',`${index*140}ms`);
    inner.style.animation="none";inner.style.transform="none";
    inner.append(range.cloneContents());mask.append(inner);layer.append(mask);
    const copy=document.createRange();copy.selectNodeContents(inner);
    inner.style.position="relative";inner.style.top=`${rect.top-copy.getBoundingClientRect().top}px`;
    inner.style.removeProperty("animation");inner.style.removeProperty("transform");
   });
   heading.classList.toggle('heading-lines-ready',lines.length>0);
  };
  const schedule=()=>{if(!active)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(split);};
  const resize=new ResizeObserver(entries=>{
   const width=entries[0].contentRect.width;
   if(Math.abs(width-lastWidth)<1)return;lastWidth=width;schedule();
  });resize.observe(text);
  const mutation=new MutationObserver(schedule);mutation.observe(text,{childList:true,subtree:true,characterData:true});
  document.fonts.ready.then(schedule);schedule();
  return()=>{active=false;cancelAnimationFrame(frame);resize.disconnect();mutation.disconnect();layer.replaceChildren();heading.classList.remove('heading-lines-ready');};
 },[children]);
 return <Tag {...props} data-reveal={typeof props['data-reveal']==='string'?props['data-reveal']:''} className={`line-heading ${props.className??''}`}><span className="heading-source" ref={source}>{children}</span><span className="heading-visual" ref={visual} aria-hidden="true"/></Tag>;
}
