export type Layer={id:string;name:string;type:'text'|'photo'|'image'|'rect';x:number;y:number;width:number;height:number;opacity:number;rotation:number;src:string;text:string;color:string;font:string;fontSize:number;minSize:number;align:'left'|'center'|'right';lineHeight:number;fit:'cover'|'contain';focusX:number;focusY:number};
export type SocialTemplate={version:1;id:string;name:string;width:number;height:number;background:string;fonts:{name:string;src:string}[];layers:Layer[]};
export const SOCIAL_LIMIT=3000000;
export function layer(type:Layer['type'],id:string):Layer{return {id,name:type,type,x:70,y:100,width:940,height:300,opacity:1,rotation:0,src:'',text:type==='text'?'Livemusik på Apoteket':'',color:'#DB8C59',font:'Agilera',fontSize:92,minSize:24,align:'left',lineHeight:1.12,fit:'cover',focusX:50,focusY:50};}
export function starter(story=false):SocialTemplate{
 const photo={...layer('photo','photo'),x:0,y:0,width:1080,height:story?1920:1080};
 const overlay={...layer('rect','overlay'),name:'Photo overlay',x:0,y:0,width:1080,height:photo.height,color:'#1A1E3A',opacity:.65};
 const title={...layer('text','headline'),name:'Headline',y:story?850:360,height:360};
 const body={...layer('text','details'),name:'Details',y:story?1330:780,height:180,font:'Bricolage',fontSize:36,text:'Fredag kl. 21\nBlågårds Apotek · Nørrebro'};
 return {version:1,id:story?'story':'square',name:story?'Apoteket · Story':'Apoteket · Square',width:1080,height:photo.height,background:'#1A1E3A',fonts:[],layers:[photo,overlay,title,body]};
}
const object=(v:unknown):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid template object.');return v as Record<string,unknown>;};
const str=(v:unknown,max:number)=>{if(typeof v!=='string'||v.length>max)throw Error('Invalid template text.');return v;};
const num=(v:unknown,min:number,max:number)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error('Invalid template number.');return v;};
const color=(v:unknown)=>{const c=str(v,9);if(!/^#[a-f0-9]{6}([a-f0-9]{2})?$/i.test(c))throw Error('Invalid template colour.');return c;};
export function validateTemplate(value:unknown):SocialTemplate{
 if(JSON.stringify(value).length>SOCIAL_LIMIT)throw Error('Invalid template: maximum size is 3 MB.');
 const t=object(value);if(t.version!==1)throw Error('Invalid template version.');
 const id=str(t.id,80);if(!/^[a-z0-9-]+$/i.test(id))throw Error('Invalid template id.');
 const width=num(t.width,1080,1080),height=num(t.height,1080,1920);if(![1080,1350,1920].includes(height))throw Error('Invalid template format.');
 if(!Array.isArray(t.fonts)||t.fonts.length>5||!Array.isArray(t.layers)||t.layers.length>30)throw Error('Invalid template layers/fonts.');
 const fonts=t.fonts.map(value=>{const f=object(value),name=str(f.name,80),src=str(f.src,600000);if(!/^Custom-[a-z0-9-]+$/i.test(name)||!/^data:font\/woff2?;base64,[a-z0-9+/]+=*$/i.test(src))throw Error('Invalid font asset.');return {name,src};});
 const ids=new Set<string>();
 const layers=t.layers.map(value=>{
  const l=object(value),id=str(l.id,80);if(!/^[a-z0-9-]+$/i.test(id)||Object.prototype.hasOwnProperty.call(Object.prototype,id))throw Error('Invalid layer id.');if(ids.has(id))throw Error('Invalid duplicate layer id.');ids.add(id);
  const type=str(l.type,10) as Layer['type'];if(!['text','photo','image','rect'].includes(type))throw Error('Invalid layer type.');
  const src=str(l.src,2800000);if(src&&!/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/]+=*$/i.test(src))throw Error('Invalid image asset. Use embedded PNG, JPEG or WebP.');
  const font=str(l.font,80);if(!['Agilera','Bricolage','Arial','Georgia',...fonts.map(f=>f.name)].includes(font))throw Error('Invalid font selection.');
  if(Number(l.minSize)>Number(l.fontSize))throw Error('Invalid minimum font size.');
  const align=str(l.align,6) as Layer['align'],fit=str(l.fit,7) as Layer['fit'];if(!['left','center','right'].includes(align)||!['cover','contain'].includes(fit))throw Error('Invalid layer alignment.');
  return {id,type,name:str(l.name,100),x:num(l.x,0,width),y:num(l.y,0,height),width:num(l.width,1,width),height:num(l.height,1,height),opacity:num(l.opacity,0,1),rotation:num(l.rotation,-180,180),src,text:str(l.text,4000),color:color(l.color),font,fontSize:num(l.fontSize,8,400),minSize:num(l.minSize,8,400),align,lineHeight:num(l.lineHeight,1,2),fit,focusX:num(l.focusX,0,100),focusY:num(l.focusY,0,100)};
 });
 return {version:1,id,name:str(t.name,100),width,height,background:color(t.background),fonts,layers};
}
/** Preserve newlines and split words that cannot fit on a line. */
export function wrapSocial(text:string,width:number,measure:(text:string)=>number){
 const lines:string[]=[];
 for(const paragraph of text.replace(/\r\n?/g,'\n').split('\n')){
  let current='';
  for(const word of paragraph.split(/\s+/).filter(Boolean)){
   if(current&&measure(current+' '+word)<=width){current+=' '+word;continue;}
   if(current){lines.push(current);current='';}
   for(const character of Array.from(word)){if(current&&measure(current+character)>width){lines.push(current);current='';}current+=character;}
  }
  lines.push(current);
 }
 return lines;
}
