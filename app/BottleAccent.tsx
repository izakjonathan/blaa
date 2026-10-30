"use client";
import { BOTTLE_TRAVEL, bottleOffset, bottlePhotoIndex, bottleClipScore } from "../lib/scroll-art";
import { useLayoutEffect, useRef } from "react";

/** Place whole, rotated outlines in photographic space; never cut holes around copy. */
export default function BottleAccent() {
  const art = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const canvas = art.current;
    const page = canvas?.parentElement;
    if (!canvas || !page) return;
    let frame = 0, motionFrame = 0;
    let active = true;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let viewportWidth=window.innerWidth, viewportHeight=window.innerHeight;
    let lastTime=0;
    type Placement={svg:SVGSVGElement;center:number;offset:number;x:number;y:number;angle:number;width:number};
    let placements: Placement[]=[];
    const animate = (time:number) => {
      const elapsed=lastTime?Math.min(64,time-lastTime):1000/60;
      lastTime=time;
      const scrollY=Math.max(0,Math.min(window.scrollY,Math.max(0,page.scrollHeight-viewportHeight)));
      const blend=1-Math.exp(-elapsed/120);
      motionFrame=0;
      let moving=false;
      for(const item of placements) {
        const target=bottleOffset(scrollY,viewportHeight,item.center,reduced.matches);
        item.offset=reduced.matches?0:item.offset+(target-item.offset)*blend;
        if(Math.abs(target-item.offset)<.05)item.offset=target;else moving=true;
        item.svg.style.translate=`0 ${item.offset.toFixed(2)}px`;
      }
      if(moving&&active)motionFrame=requestAnimationFrame(animate);
    };
    const scroll=()=>{if(active&&!motionFrame){lastTime=0;motionFrame=requestAnimationFrame(animate);}};
    const place = () => {
      if(!active)return;
      const previous=new Map(placements.map(item=>[item.svg,item]));
      placements=[];
      const bounds = page.getBoundingClientRect();
      const photos = Array.from(page.querySelectorAll<HTMLElement>('.split-photo,.photo-story,.company-photo'));
      const obstacles = Array.from(page.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,dt,dd,li,figcaption,.pl-team span,a,summary,button')).map(el => {
        const r=el.getBoundingClientRect();
        return {left:r.left-bounds.left-36,right:r.right-bounds.left+36,top:r.top-bounds.top-70-BOTTLE_TRAVEL,bottom:r.bottom-bounds.top+70+BOTTLE_TRAVEL};
      });

      canvas.querySelectorAll<SVGSVGElement>('svg').forEach((svg,index) => {
        const prior=previous.get(svg);
        const photoIndex=bottlePhotoIndex(index,photos.length);
        const photo=photoIndex===undefined?undefined:photos[photoIndex];
        if (!photo) {svg.style.opacity='0';return;}
        const r=photo.getBoundingClientRect();
        const anchor=r.top-bounds.top+r.height/2;
        const width=Math.min(1100,Math.max(360,r.height*.8));
        const scale=width/260,height=590*scale;
        const path=svg.querySelector('path')!;
        const length=path.getTotalLength();
        const points=Array.from({length:240},(_,i)=>path.getPointAtLength(length*i/239));
        let best: {score:number;x:number;y:number;angle:number}|undefined;
        const keep=prior?.width===width?prior:undefined;
        for(const angle of [...(keep?[keep.angle]:[]),...(index%2 ? [-90,-65,-100,-35,90,65,100,35] : [90,65,100,35,-90,-65,-100,-35])]) {
          const rad=angle*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad);
          for(const x of [...(keep?[keep.x]:[]),-width*.32,bounds.width-width*.68,-width*.65,bounds.width-width*.35,-width,-width*1.3,bounds.width,bounds.width+width*.3]) {
            for(const shift of [...(keep?[keep.y-anchor+height/2]:[]),0,-r.height*.2,r.height*.2]) {
              const y=anchor-height/2+shift;
              const projected=points.map(p=>{const px=p.x*scale-width/2,py=p.y*scale-height/2;return {x:x+width/2+px*c-py*s,y:y+height/2+px*s+py*c};});
              let count=0,collision=false;
              for(let i=1;i<projected.length;i++) {
                const a=projected[i-1],b=projected[i];
                if(Math.max(a.x,b.x)<0||Math.min(a.x,b.x)>bounds.width||Math.max(a.y,b.y)<0||Math.min(a.y,b.y)>bounds.height)continue;
                count++;
                if(obstacles.some(o=>Math.max(a.x,b.x)>o.left&&Math.min(a.x,b.x)<o.right&&Math.max(a.y,b.y)>o.top&&Math.min(a.y,b.y)<o.bottom)){collision=true;break;}
              }
              const clipScore=bottleClipScore(count,points.length);
              const score=(clipScore??0)+(keep&&angle===keep.angle&&x===keep.x&&Math.abs(y-keep.y)<.1?10000:0);
              if(!collision&&clipScore!==undefined&&(!best||score>best.score))best={score,x,y,angle};
            }
          }
        }
        // Keep an existing valid composition instead of selecting a new rotation.
        // Transient reveal transforms no longer trigger this search.
        svg.style.opacity=best?'1':'0';
        if(best)placements.push({svg,center:window.scrollY+bounds.top+anchor,offset:prior?.offset ?? bottleOffset(Math.max(0,window.scrollY),viewportHeight,window.scrollY+bounds.top+anchor,reduced.matches),x:best.x,y:best.y,angle:best.angle,width});
        if(best)Object.assign(svg.style,{width:`${width}px`,height:`${height}px`,left:`${best.x}px`,top:`${best.y}px`,transform:`rotate(${best.angle}deg)`});
      });
      scroll();
    };
    const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(place);};
    let layoutWidth=0,layoutHeight=0;
    const resize=new ResizeObserver(entries=>{
      const {width,height}=entries[0].contentRect;
      if(Math.abs(width-layoutWidth)<1&&Math.abs(height-layoutHeight)<1)return;
      layoutWidth=width;layoutHeight=height;schedule();
    });resize.observe(page);
    const viewportResize=()=>{
      // Browser chrome/keyboard height changes must not restart the animation.
      if(window.innerWidth===viewportWidth)return;
      viewportWidth=window.innerWidth;viewportHeight=window.innerHeight;schedule();
    };
    const mutation=new MutationObserver(schedule);mutation.observe(page,{childList:true,subtree:true,characterData:true});
    window.addEventListener('resize',viewportResize);
    window.addEventListener('scroll',scroll,{passive:true});
    reduced.addEventListener('change',scroll);
    page.addEventListener('toggle',schedule,true);
    page.addEventListener('load',schedule,true);
    document.fonts.ready.then(schedule);
    schedule();
    return ()=>{active=false;cancelAnimationFrame(frame);cancelAnimationFrame(motionFrame);window.removeEventListener('scroll',scroll);reduced.removeEventListener('change',scroll);resize.disconnect();mutation.disconnect();window.removeEventListener('resize',viewportResize);page.removeEventListener('toggle',schedule,true);page.removeEventListener('load',schedule,true);};
  }, []);
  return <div ref={art} className="bottle-page-art" aria-hidden="true">{[0,1,2].map(index =>
    <svg key={index} className="bottle-fragment" viewBox="0 0 260 590" fill="none" focusable="false">
      <path vectorEffect="non-scaling-stroke" d="M82 23C104 36 151 38 166 25C178 12 132 8 91 22C100 58 101 121 88 161C78 188 49 191 32 217C13 245 33 277 30 319C28 374 12 428 15 487C16 528 17 554 44 560C90 579 195 567 226 528C253 495 230 455 227 412C222 370 235 317 235 273C233 231 205 198 185 164C160 124 157 91 163 62M45 560C15 541 69 533 99 539C133 544 167 563 161 577C150 593 99 575 69 564" />
    </svg>
  )}</div>;
}
