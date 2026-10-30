export type HSL = { h:number; s:number; l:number };
export function hexToHsl(hex:string):HSL {
  if(!/^#[0-9a-f]{6}$/i.test(hex))hex='#263D32';
  const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
  const h=d===0?0:((max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4)*60);
  return {h,s:d===0?0:d/(1-Math.abs(2*l-1))*100,l:l*100};
}
export function hslToHex({h,s,l}:HSL):string {
  h=((h%360)+360)%360;s=Math.max(0,Math.min(100,s))/100;l=Math.max(0,Math.min(100,l))/100;
  const a=s*Math.min(l,1-l);
  const channel=(n:number)=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0');};
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
