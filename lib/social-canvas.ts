import {wrapSocial,type SocialTemplate,type Layer} from './social-template';
const fonts=new Map<string,Promise<void>>();
async function font(name:string,src:string){
 const key=name+src;
 if(!fonts.has(key))fonts.set(key,(async()=>{const face=new FontFace(name,`url("${src}")`);await face.load();document.fonts.add(face);})().catch(error=>{fonts.delete(key);throw error;}));
 await fonts.get(key);
}
async function decodeImage(src:string){const value=new Image();value.src=src;await value.decode();if(value.naturalWidth*value.naturalHeight>24000000)throw Error('Image is too large to render. Upload a smaller version.');return value;}
const images=new Map<string,Promise<HTMLImageElement>>();
async function image(src:string){
 if(!src.startsWith('data:'))return decodeImage(src);
 if(!images.has(src)){if(images.size>=6)images.delete(images.keys().next().value!);images.set(src,decodeImage(src).catch(error=>{images.delete(src);throw error;}));}
 return images.get(src)!;
}
export async function renderSocial(template:SocialTemplate,photos:Record<string,string>,texts:Record<string,string>){
 await Promise.all([font('Agilera','/fonts/Agilera.woff'),font('Bricolage','/fonts/BricolageGrotesque-variable.woff2'),...template.fonts.map(f=>font(f.name,f.src))]);
 const assets=new Map<string,HTMLImageElement>();
 await Promise.all(template.layers.filter(l=>l.type==='photo'||l.type==='image').map(async l=>{const src=l.type==='photo'?photos[l.id]||l.src:l.src;if(src)assets.set(l.id,await image(src));}));
 const canvas=document.createElement('canvas');canvas.width=template.width;canvas.height=template.height;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas rendering is unavailable in this browser.');
 ctx.fillStyle=template.background;ctx.fillRect(0,0,canvas.width,canvas.height);
 const warnings:string[]=[];
 for(const l of template.layers){
  ctx.save();ctx.globalAlpha=l.opacity;ctx.translate(l.x+l.width/2,l.y+l.height/2);ctx.rotate(l.rotation*Math.PI/180);ctx.translate(-l.width/2,-l.height/2);
  ctx.beginPath();ctx.rect(0,0,l.width,l.height);ctx.clip();
  if(l.type==='rect'){ctx.fillStyle=l.color;ctx.fillRect(0,0,l.width,l.height);}
  if(l.type==='image'||l.type==='photo'){
   const img=assets.get(l.id);
   if(img){const ratio=l.fit==='cover'?Math.max(l.width/img.naturalWidth,l.height/img.naturalHeight):Math.min(l.width/img.naturalWidth,l.height/img.naturalHeight);const w=img.naturalWidth*ratio,h=img.naturalHeight*ratio;ctx.drawImage(img,(l.width-w)*l.focusX/100,(l.height-h)*l.focusY/100,w,h);}
   else if(l.type==='photo')warnings.push(`Upload a photo for “${l.name}”.`);
  }
  if(l.type==='text'){
   const value=texts[l.id]??l.text;let size=l.fontSize,lines:string[]=[];
   for(;size>=l.minSize;size--){ctx.font=`${size}px "${l.font}"`;lines=wrapSocial(value,l.width,t=>ctx.measureText(t).width);if(lines.length*size*l.lineHeight<=l.height&&lines.every(t=>ctx.measureText(t).width<=l.width))break;}
   if(size<l.minSize){size=l.minSize;warnings.push(`Shorten “${l.name}” or enlarge its text box.`);}
   ctx.font=`${size}px "${l.font}"`;ctx.fillStyle=l.color;ctx.textAlign=l.align;ctx.textBaseline='top';
   const x=l.align==='left'?0:l.align==='center'?l.width/2:l.width;
   lines.forEach((line,i)=>ctx.fillText(line,x,i*size*l.lineHeight));
  }
  ctx.restore();
 }
 return {canvas,warnings};
}
/** Imported phone photos become bounded embedded raster assets; transparent PNGs stay transparent. */
export async function socialImage(file:File){
 if(file.size>25000000||!file.type.startsWith('image/')||file.type==='image/svg+xml')throw Error('Choose a raster image below 25 MB (PNG, JPEG or WebP recommended).');
 const url=URL.createObjectURL(file);
 try{const img=await image(url),ratio=Math.min(1,1920/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.round(img.width*ratio);canvas.height=Math.round(img.height*ratio);const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable.');ctx.drawImage(img,0,0,canvas.width,canvas.height);const result=canvas.toDataURL(file.type==='image/png'?'image/png':'image/jpeg',.88);if(result.length>2700000)throw Error('Image is too detailed for a template. Use a smaller image or JPEG.');return result;}finally{URL.revokeObjectURL(url);}
}
export function downloadSocial(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),60000);}
