'use client';
import {useEffect,useRef,useState,type CSSProperties,type ChangeEvent} from 'react';
import {starter,layer,validateTemplate,SOCIAL_LIMIT,type SocialTemplate,type Layer} from '../../../lib/social-template';
import {renderSocial,socialImage,downloadSocial} from '../../../lib/social-canvas';
import './studio.css';
type Saved={id:string;name:string;revision:number};
async function request(url:string,options?:RequestInit){const response=await fetch(url,{...options,cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'Could not complete the request.');return data;}
export default function Studio(){
 const [template,setTemplate]=useState<SocialTemplate>(()=>starter()),[photos,setPhotos]=useState<Record<string,string>>({}),[texts,setTexts]=useState<Record<string,string>>({});
 const [saved,setSaved]=useState<Saved[]>([]),[revision,setRevision]=useState(-1),[ready,setReady]=useState(false),[selected,setSelected]=useState('headline');
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[rendering,setRendering]=useState(true),[warnings,setWarnings]=useState<string[]>([]),[renderError,setRenderError]=useState('');
 const [designer,setDesigner]=useState(false);
 const output=useRef<HTMLCanvasElement|null>(null),drag=useRef<{x:number;y:number;left:number;top:number}|null>(null);
 const canvas=useRef<HTMLCanvasElement>(null),generation=useRef(0),load=useRef(0),photoLoad=useRef(0);
 const current=template.layers.find(l=>l.id===selected)??template.layers[0];
 useEffect(()=>{const abort=new AbortController();request('/api/editor/social',{signal:abort.signal}).then(data=>{setSaved(data.templates||[]);setReady(data.ready);}).catch(error=>{if(!abort.signal.aborted)setMessage(error.message);});return()=>abort.abort();},[]);
 useEffect(()=>{
  let active=true;const token=++generation.current;setRendering(true);setRenderError('');
  const timer=setTimeout(()=>{renderSocial(template,photos,texts).then(result=>{
   if(!active||generation.current!==token)return;
   const destination=canvas.current;if(destination){destination.width=result.canvas.width;destination.height=result.canvas.height;const ctx=destination.getContext('2d');ctx?.drawImage(result.canvas,0,0);if(designer&&current&&ctx){ctx.save();ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.setLineDash([12,8]);ctx.strokeRect(current.x,current.y,current.width,current.height);ctx.restore();}output.current=result.canvas;}
   setWarnings(result.warnings);setRendering(false);
  }).catch(error=>{if(active){setRenderError(error.message);setRendering(false);}});},80);
  return()=>{active=false;clearTimeout(timer);};
 },[template,photos,texts,designer,selected]);
 const update=(patch:Partial<SocialTemplate>)=>setTemplate(old=>({...old,...patch}));
 const edit=(patch:Partial<Layer>)=>setTemplate(old=>({...old,layers:old.layers.map(l=>l.id===current?.id?{...l,...patch}:l)}));
 const choose=(next:SocialTemplate,rev=-1)=>{++photoLoad.current;setTemplate(next);setRevision(rev);setPhotos({});setTexts({});setSelected(next.layers[0]?.id??'');setMessage('');};
 const defaults=()=>validateTemplate({...template,layers:template.layers.map(l=>({...l,text:texts[l.id]??l.text}))});
 const attempt=async(fn:()=>Promise<void>)=>{setBusy(true);setMessage('');try{await fn();}catch(error){setMessage(error instanceof Error?error.message:'Could not complete the action.');}finally{setBusy(false);}};
 const upload=(event:ChangeEvent<HTMLInputElement>,fn:(file:File)=>Promise<void>)=>{const file=event.target.files?.[0];event.target.value='';if(file)void attempt(()=>fn(file));};
 const number=(label:string,value:number,min:number,max:number,step:number,change:(value:number)=>void)=><label>{label}<input type="number" value={value} min={min} max={max} step={step} onChange={e=>change(Math.max(min,Math.min(max,Number(e.target.value)||min)))}/></label>;
 const move=(offset:number)=>{if(!current)return;const layers=[...template.layers],index=layers.indexOf(current),to=index+offset;if(to<0||to>=layers.length)return;[layers[index],layers[to]]=[layers[to],layers[index]];update({layers});};
 return <main id="main" className="social-studio">
  <header><div><h1>SoMe Generator</h1></div></header>
  <div className="social-workspace"><div className="social-controls"><fieldset className="social-form" disabled={busy}>
   <section><h2>1. Choose a template</h2><label>Template<select disabled={busy} value={template.id} onChange={event=>{const id=event.target.value,token=++load.current;if(id==='square'||id==='story'){choose(starter(id==='story'));return;}void attempt(async()=>{const data=await request('/api/editor/social?id='+encodeURIComponent(id));if(token!==load.current)return;if(!data.record)throw Error('Template is no longer available.');choose(validateTemplate(data.record.document),data.record.revision);});}}>
    <option value="square">Starter · Square</option><option value="story">Starter · Story</option>{saved.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}{!['square','story',...saved.map(t=>t.id)].includes(template.id)&&<option value={template.id}>{template.name} (unsaved)</option>}
   </select></label>
   <label>Import editable template (.json)<input type="file" accept=".json,application/json" disabled={busy} onChange={e=>upload(e,async file=>{if(file.size>SOCIAL_LIMIT)throw Error('Template must be below 3 MB.');choose(validateTemplate(JSON.parse(await file.text())));})}/></label>
   <p>Upload backgrounds and transparent graphics in Layout below. A flattened image can be used as artwork; editable text positions and fonts come from a template JSON file.</p></section>
   <section><h2>2. Add your content</h2>{template.layers.filter(l=>l.type==='text').map(l=><label key={l.id}>{l.name}<textarea maxLength={4000} rows={3} value={texts[l.id]??l.text} onChange={e=>setTexts(old=>({...old,[l.id]:e.target.value}))}/></label>)}
    {template.layers.filter(l=>l.type==='photo').map(l=><div key={l.id}><label>{l.name}<input type="file" accept="image/*" disabled={busy} onChange={e=>upload(e,async file=>{const token=++photoLoad.current,src=await socialImage(file);if(token===photoLoad.current)setPhotos(old=>({...old,[l.id]:src}));})}/></label>{photos[l.id]&&<button onClick={()=>setPhotos(old=>{const next={...old};delete next[l.id];return next;})}>Remove photo</button>}</div>)}
   </section>
   <details onToggle={e=>setDesigner(e.currentTarget.open)}><summary>Layout & template designer</summary>
    <label>Template name<input maxLength={100} value={template.name} onChange={e=>update({name:e.target.value})}/></label>
    <label>Format<select value={template.height} onChange={e=>{const height=Number(e.target.value);update({height,layers:template.layers.map(l=>({...l,y:Math.min(l.y,height),height:Math.min(l.height,height)}))});}}><option value={1080}>Square · 1080 × 1080</option><option value={1350}>Portrait · 1080 × 1350</option><option value={1920}>Story · 1080 × 1920</option></select></label>
    <label>Background colour<input type="color" value={template.background.slice(0,7)} onChange={e=>update({background:e.target.value})}/></label>
    <div className="social-buttons">{(['text','photo','image','rect'] as const).map(type=><button disabled={template.layers.length>=30} key={type} onClick={()=>{const next=layer(type,crypto.randomUUID());update({layers:[...template.layers,next]});setSelected(next.id);}}>Add {type==='image'?'artwork':type==='rect'?'overlay / shape':type}</button>)}</div>
    <label>Layer (bottom to top)<select value={current?.id??''} onChange={e=>setSelected(e.target.value)}>{template.layers.map((l,i)=><option key={l.id} value={l.id}>{i+1}. {l.name} · {l.type}</option>)}</select></label>
    {current&&<fieldset><legend>{current.name}</legend>
     <label>Layer name<input maxLength={100} value={current.name} onChange={e=>edit({name:e.target.value})}/></label>
     <div className="social-numbers">{number('X',current.x,0,1080,1,x=>edit({x}))}{number('Y',current.y,0,template.height,1,y=>edit({y}))}{number('Width',current.width,1,1080,1,width=>edit({width}))}{number('Height',current.height,1,template.height,1,height=>edit({height}))}{number('Opacity',current.opacity,0,1,.05,opacity=>edit({opacity}))}{number('Rotation',current.rotation,-180,180,1,rotation=>edit({rotation}))}</div>
     {(current.type==='rect'||current.type==='text')&&<label>Colour<input type="color" value={current.color.slice(0,7)} onChange={e=>edit({color:e.target.value})}/></label>}
     {current.type==='text'&&<><label>Font<select value={current.font} onChange={e=>edit({font:e.target.value})}>{['Agilera','Bricolage','Arial','Georgia',...template.fonts.map(f=>f.name)].map(font=><option key={font}>{font}</option>)}</select></label><div className="social-numbers">{number('Starting font size',current.fontSize,current.minSize,400,1,fontSize=>edit({fontSize}))}{number('Smallest font size',current.minSize,8,current.fontSize,1,minSize=>edit({minSize}))}{number('Line height',current.lineHeight,1,2,.05,lineHeight=>edit({lineHeight}))}</div><label>Alignment<select value={current.align} onChange={e=>edit({align:e.target.value as Layer['align']})}><option>left</option><option>center</option><option>right</option></select></label></>}
     {(current.type==='photo'||current.type==='image')&&<><label>Image fit<select value={current.fit} onChange={e=>edit({fit:e.target.value as Layer['fit']})}><option>cover</option><option>contain</option></select></label><div className="social-numbers">{number('Crop focus X %',current.focusX,0,100,1,focusX=>edit({focusX}))}{number('Crop focus Y %',current.focusY,0,100,1,focusY=>edit({focusY}))}</div></>}
     {current.type==='image'&&<label>Upload background / transparent overlay<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>upload(e,async file=>{const id=current.id,src=await socialImage(file);setTemplate(old=>({...old,layers:old.layers.map(l=>l.id===id?{...l,src}:l)}));})}/></label>}
     <div className="social-buttons"><button onClick={()=>edit({x:0,y:0,width:1080,height:template.height})}>Fill canvas</button><button onClick={()=>move(-1)}>Move down</button><button onClick={()=>move(1)}>Move up</button><button onClick={()=>update({layers:template.layers.filter(l=>l.id!==current.id)})}>Remove layer</button></div>
    </fieldset>}
    <label>Upload custom font (.woff / .woff2)<input type="file" accept=".woff,.woff2" disabled={busy||template.fonts.length>=5} onChange={e=>upload(e,async file=>{if(file.size>400000)throw Error('Choose a WOFF font below 400 KB.');const bytes=new Uint8Array(await file.arrayBuffer()),magic=String.fromCharCode(...bytes.slice(0,4));if(!['wOFF','wOF2'].includes(magic))throw Error('Choose a valid WOFF or WOFF2 file.');const name='Custom-'+file.name.replace(/\.[^.]+$/,'').replace(/[^a-z0-9-]/gi,'-').slice(0,35)+'-'+crypto.randomUUID().slice(0,6);let binary='';bytes.forEach(b=>binary+=String.fromCharCode(b));const src=`data:font/${magic==='wOF2'?'woff2':'woff'};base64,${btoa(binary)}`;await new FontFace(name,`url("${src}")`).load();update({fonts:[...template.fonts,{name,src}]});})}/></label>
    {template.fonts.map(font=><button key={font.name} onClick={()=>update({fonts:template.fonts.filter(f=>f.name!==font.name),layers:template.layers.map(l=>l.font===font.name?{...l,font:'Agilera'}:l)})}>Remove {font.name}</button>)}
   </details>
   <section><h2>3. Save & export</h2><div className="social-buttons">
    <button disabled={busy||rendering||!!renderError||warnings.length>0} onClick={()=>void attempt(async()=>{const blob=await new Promise<Blob>((resolve,reject)=>output.current?.toBlob(b=>b?resolve(b):reject(Error('PNG export failed.')),'image/png'));downloadSocial(blob,`blaagaards-apotek-${template.width}x${template.height}.png`);setMessage('PNG ready. On iPhone, open the download and save or share it to Photos.');})}>Download PNG · {template.width} × {template.height}</button>
    <button disabled={busy} onClick={()=>void attempt(async()=>{downloadSocial(new Blob([JSON.stringify(defaults(),null,2)],{type:'application/json'}),template.id+'.json');})}>Export template</button>
    <button disabled={busy||!ready} onClick={()=>void attempt(async()=>{const next=defaults();if(['square','story'].includes(next.id))next.id=crypto.randomUUID();const data=await request('/api/editor/social',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({template:next,revision})});setTemplate(next);setRevision(data.revision);setSaved(old=>[...old.filter(t=>t.id!==next.id),{id:next.id,name:next.name,revision:data.revision}]);setMessage('Template saved. It is available from the editor on your other devices.');})}>Save template to editor</button>
    <button disabled={busy} onClick={()=>{update({id:crypto.randomUUID(),name:template.name+' copy'});setRevision(-1);}}>Duplicate template</button>
   </div>{!ready&&<p>Shared template saving needs the existing database connection. You can create posts and export/import template files now.</p>}</section>
   </fieldset><p role="status">{busy?'Working…':message}</p>
  </div><aside className="social-preview"><h2>Live preview</h2><canvas ref={canvas} width={1080} height={template.height} data-design={designer} style={{'--social-ratio':1080/template.height} as CSSProperties} aria-label="Social post preview. Use the Layout controls to position elements precisely." onPointerDown={e=>{if(!designer||!current||busy)return;const rect=e.currentTarget.getBoundingClientRect();drag.current={x:e.clientX,y:e.clientY,left:current.x,top:current.y};e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault();}} onPointerMove={e=>{const start=drag.current;if(!start||!current)return;const rect=e.currentTarget.getBoundingClientRect();edit({x:Math.round(Math.max(0,Math.min(1080-current.width,start.left+(e.clientX-start.x)*1080/rect.width))),y:Math.round(Math.max(0,Math.min(template.height-current.height,start.top+(e.clientY-start.y)*template.height/rect.height)))});}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}/><p role="status">{rendering?'Updating preview…':renderError||warnings.join(' ')||'Ready to export'}</p><p>Text automatically wraps and shrinks to fit. Photos use the crop focus from your template.</p></aside></div>
 </main>;
}
