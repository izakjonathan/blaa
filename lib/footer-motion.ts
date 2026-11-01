/** Preserve incoming velocity with a monotone cubic Bezier and a stationary finish. */
export function footerMotion(distance:number,velocity:number,duration:number,curve:string){
 const speed=Math.max(0,velocity);
 if(speed<.01||distance<=0)return {duration,ease:(t:number)=>curve==='linear'?t:curve==='ease-out'?1-(1-t)**3:curve==='cubic'?(t<.5?4*t**3:1-(-2*t+2)**3/2):(1-Math.cos(Math.PI*t))/2};
 const [preferredX1,x2]=curve==='cubic'?[.65,.35]:curve==='ease-out'?[.22,.36]:curve==='linear'?[1/3,2/3]:[.42,.58];
 const time=duration;
 const x1=Math.min(preferredX1,distance/(speed*time));
 const y1=Math.min(1,speed*time/distance*x1);
 const cubic=(t:number,a:number,b:number)=>3*(1-t)**2*t*a+3*(1-t)*t*t*b+t**3;
 return {duration:time,ease:(progress:number)=>{
  if(progress<=0)return 0;if(progress>=1)return 1;
  let lo=0,hi=1;
  for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(cubic(mid,x1,x2)<progress)lo=mid;else hi=mid;}
  return cubic((lo+hi)/2,y1,1);
 }};
}
