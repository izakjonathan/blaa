export const BOTTLE_TRAVEL = 12;
export function bottleOffset(scrollY:number,viewportHeight:number,center:number,reduced=false) {
  return reduced?0:Math.max(-BOTTLE_TRAVEL,Math.min(BOTTLE_TRAVEL,(center-scrollY-viewportHeight/2)*.04));
}
export type Surface={left:number;right:number;top:number;bottom:number;photo:boolean;gold:boolean};
export function headerSurfaceTone(surfaces:Surface[],x:number,y:number):'dark'|'gold'|undefined {
 const hits=surfaces.filter(s=>s.left<=x&&s.right>x&&s.top<=y&&s.bottom>y);
 if(hits.some(s=>s.photo))return 'gold';
 return hits.length?(hits.some(s=>s.gold)?'dark':'gold'):undefined;
}

/** Never assign two decorative outlines to the same photographic anchor. */
export function bottlePhotoIndex(index:number,photoCount:number):number|undefined {
 const count=Math.min(3,photoCount);
 if(index>=count||count===0)return undefined;
 return count===1?0:Math.round(index*(photoCount-1)/(count-1));
}
/** Favor a partial edge gesture; showing most of a bottle defeats the composition. */
export function bottleClipScore(visibleSamples:number,totalSamples:number):number|undefined {
 const fraction=visibleSamples/totalSamples;
 if(fraction<.07||fraction>.45)return undefined;
 return 100-Math.abs(fraction-.27)*100;
}
