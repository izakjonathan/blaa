import {textValue,type ContentDocument} from './content-schema.ts';

export function editorialSettings(document:ContentDocument){
 const on=(id:string)=>textValue(document,'motion.'+id)!=='false';
 const n=(id:string)=>Number(textValue(document,'motion.'+id));
 return {enabled:on('enabled'),letters:on('headingLetters')&&on('reveals'),frames:on('photoFrames'),inset:n('frameInset'),radius:n('frameRadius'),end:n('frameEnd'),zoom:on('photoZoom'),roll:on('menuRoll')&&on('menu')};
}

/** Native scroll progress: zero at entry, one at the chosen viewport line. */
export function frameGeometry(top:number,viewport:number,endPercent:number,inset:number,radius:number){
 const distance=Math.max(1,viewport*(1-endPercent/100));
 const progress=Math.max(0,Math.min(1,(viewport-top)/distance));
 // Smooth endpoints without adding a second scroll or inertia controller.
 const remaining=1-progress*progress*(3-2*progress);
 return {inset:Math.max(0,inset)*remaining,radius:Math.max(0,radius)*remaining};
}

/** Cap the entire letter cascade for long, editable headings. */
export function letterDelay(index:number,count:number,stagger:number){
 return index*Math.min(stagger,count>1?300/(count-1):0);
}
