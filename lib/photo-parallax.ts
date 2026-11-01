import {textValue,type ContentDocument} from './content-schema.ts';

export function photoParallaxSettings(document:ContentDocument){
 return {
  enabled:textValue(document,'motion.enabled')!=='false' && textValue(document,'motion.parallax')!=='false',
  mobile:Number(textValue(document,'motion.parallaxMobile')),
  desktop:Number(textValue(document,'motion.parallaxDesktop')),
  smoothing:Number(textValue(document,'motion.parallaxSmoothing')),
 };
}
/** Travel means the total sweep from entering to leaving the viewport. */
export function photoParallaxGeometry(center:number,viewport:number,height:number,travel:number){
 const sweep=Math.max(0,travel),size=Math.max(1,height);
 const progress=Math.max(-1,Math.min(1,(viewport/2-center)/((viewport+size)/2)));
 return {shift:progress*sweep/2,scale:sweep===0?1:1+(sweep+4)/size};
}
export function followPhoto(current:number,target:number,elapsed:number,smoothing:number){
 return smoothing<=0?target:current+(target-current)*(1-Math.exp(-Math.max(0,elapsed)/smoothing));
}
