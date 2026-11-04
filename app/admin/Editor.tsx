'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { uploadPresigned } from '@vercel/blob/client';
import { emptyDocument, fields, imageValue, textValue, validateDocument, type ContentDocument, type ContentImageValue, type Field } from '../../lib/content-schema';
import BrandSplash from '../BrandSplash';
import SplashPreview from './SplashPreview';
import { ContentProvider, BrandArtwork } from '../Content';
import { brandColors, photoOverlayColor } from '../../lib/brand';
import type { ContentState } from '../../lib/content-db';
import './editor.css';
import {imageOverlayOpacity,imageOverlayStrength,uniformPhotoOverlay} from '../../lib/image-treatment';
import BrandColorPicker from './BrandColorPicker';
import { mergePendingEdits } from '../../lib/editor-state';

const isPoster = (id:string) => /^events\.item\.\d+\.image$/.test(id);

const pages=[{id:"animations",label:"Animations",route:"/"},{"id": "brand", "label": "Brand colors", "route": "/"}, {"id": "splash", "label": "Splash screen", "route": "/"}, {"id": "experience", "label": "Forside", "route": "/"}, {"id": "events", "label": "Koncerter", "route": "/events"}, {"id": "om-os", "label": "Om os", "route": "/om-os"}, {"id": "galleri", "label": "Galleri", "route": "/galleri"}, {"id": "spil-hos-os", "label": "Spil hos os", "route": "/spil-hos-os"}, {"id": "kunst", "label": "Kunst", "route": "/kunst"}, {"id": "kontakt", "label": "Kontakt", "route": "/kontakt"}, {"id": "shared", "label": "Menu & footer", "route": "/"}];
const sectionNames:Record<string,string>={'scene hero brand-hero':'Forside & hero',welcome:'Velkommen',coffee:'Livemusik',wine:'Baren',table:'Kunst','Wine and everyday rituals':'Billeder','brand-world':'Livet på Apoteket',neighbourhood:'Besøg os','Content':'Indhold'};
async function jsonRequest(url:string,options?:RequestInit) {
  const response=await fetch(url,{...options,cache:'no-store'});
  const raw=await response.text();let data;
  try{data=JSON.parse(raw);}catch{throw new Error(`The server returned an unreadable response (${response.status}). Please try again.`);}
  if(!response.ok)throw new Error(data.error||`Request failed (${response.status}).`);
  return data;
}
async function preparePhoto(file:File):Promise<File> {
  if(file.size>25000000)throw new Error('Choose an image smaller than 25 MB.');
  if(!file.type.startsWith('image/')||file.type==='image/svg+xml')throw new Error('Choose a photograph in JPEG, PNG, WebP or a format your phone can open.');
  // iOS can decode photos selected from the library, including many HEIC assets.
  // Convert unsupported formats before direct upload; retain normal JPEG/PNG/WebP files.
  if(['image/jpeg','image/png','image/webp'].includes(file.type))return file;
  const url=URL.createObjectURL(file);
  try {
    const image=new window.Image();image.src=url;await image.decode();
    const scale=Math.min(1,2400/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
    const context=canvas.getContext('2d');if(!context)throw new Error();context.drawImage(image,0,0,canvas.width,canvas.height);
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',.94));if(!blob)throw new Error();
    return new File([blob],'photo.jpg',{type:'image/jpeg'});
  }catch{throw new Error('This image format could not be opened. Choose a JPEG or PNG, or select it from Photos.');}
  finally{URL.revokeObjectURL(url);}
}
export default function Editor(){
 const [document,setDocument]=useState<ContentDocument>(emptyDocument),[saved,setSaved]=useState<ContentDocument>(emptyDocument);
 const [revision,setRevision]=useState(0),[ready,setReady]=useState(false),[mediaReady,setMediaReady]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[status,setStatus]=useState(''),[error,setError]=useState(''),[hasPrevious,setHasPrevious]=useState(false);
 const [motionPreviewRoute,setMotionPreviewRoute]=useState('/'),[previewRun,setPreviewRun]=useState(0);
 const [page,setPage]=useState('experience'),[imageField,setImageField]=useState<Field|null>(null),[assets,setAssets]=useState<ContentImageValue[]>([]),[progress,setProgress]=useState(0),[keyboard,setKeyboard]=useState(false),[previewOpen,setPreviewOpen]=useState(false);
 const picker=useRef<HTMLDialogElement>(null),preview=useRef<HTMLDialogElement>(null),fileInput=useRef<HTMLInputElement>(null),frame=useRef<HTMLIFrameElement>(null);
 const latestDraft=useRef(document);
 useEffect(()=>{latestDraft.current=document;},[document]);
 const globalTreatmentField=(id:string)=>['experience.hero.videoOverlayColor','experience.hero.videoOverlayOpacity','splash.overlay'].includes(id);
 const editorValue=(id:string)=>uniformPhotoOverlay(document)&&globalTreatmentField(id)?id==='experience.hero.videoOverlayColor'?photoOverlayColor(document):textValue(document,'brand.overlayOpacity'):textValue(document,id);
 const dirty=JSON.stringify(document)!==JSON.stringify(saved);
 const applyState=useCallback((state:ContentState,submitted:ContentDocument)=>{setDocument(current=>mergePendingEdits(current,submitted,state.draft));setSaved(state.draft);setRevision(state.revision);setHasPrevious(Boolean(state.previous));},[]);
 const load=useCallback(async()=>{
  const submitted=latestDraft.current;
  setLoading(true);setError('');setStatus('');
  try{const data=await jsonRequest('/api/editor/content');setReady(Boolean(data.ready));setMediaReady(Boolean(data.mediaReady));if(data.state)applyState(data.state,submitted);else setStatus(data.error||'Storage setup is needed.');}
  catch(error){setError(error instanceof Error?error.message:'Could not load content.');}
  finally{setLoading(false);}
 },[applyState]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 useEffect(()=>{const viewport=window.visualViewport;const update=()=>setKeyboard(Boolean(viewport&&window.innerHeight-viewport.height>160));viewport?.addEventListener('resize',update);return()=>viewport?.removeEventListener('resize',update);},[]);
 const previewMessage=useCallback(()=>frame.current?.contentWindow?.postMessage({type:'plaisir-preview',document},location.origin),[document]);
 useEffect(()=>{const receive=(event:MessageEvent)=>{if(event.origin===location.origin&&event.source===frame.current?.contentWindow&&event.data?.type==='plaisir-preview-ready')previewMessage();};window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);},[previewMessage]);
 useEffect(()=>{if(previewOpen){const timer=setTimeout(previewMessage,80);return()=>clearTimeout(timer);}},[document,previewOpen,previewMessage]);
 const pageFields=useMemo(()=>fields.filter(field=>field.page===page&&!field.hidden),[page]);
 const sections=useMemo(()=>[...new Set(pageFields.map(field=>field.section))].sort((a,b)=>a.includes('hero')?-1:b.includes('hero')?1:0),[pageFields]);
 const gallery=useMemo(()=>{const all=[...assets,...fields.filter(f=>f.kind==='image').map(f=>f.default as ContentImageValue)];return [...new Map(all.map(asset=>[asset.src,asset])).values()];},[assets]);
 const setText=(id:string,value:string)=>{setDocument(old=>({...old,text:{...old.text,[id]:value}}));setStatus('');};
 const setImage=(id:string,value:ContentImageValue)=>{setDocument(old=>({...old,images:{...old.images,[id]:value}}));setStatus('');};
 const save=async(action:'save'|'publish'|'restore')=>{
  if(action==='restore'&&!window.confirm('Restore the previous published version? Your current draft will be replaced.'))return;
  const submitted=document;
  setBusy(action);setError('');setStatus('');
  try{const data=await jsonRequest('/api/editor/content',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,revision,document:validateDocument(submitted)})});applyState(data.state,submitted);const newerEdits=JSON.stringify(latestDraft.current)!==JSON.stringify(document);setStatus((action==='publish'?'Published. Your changes are live.':action==='restore'?'Previous version restored and published.':'Draft saved. The live website has not changed.')+(newerEdits?' Newer edits remain unsaved.':''));}
  catch(error){setError(error instanceof Error?error.message:'Could not save.');}
  finally{setBusy('');}
 };
 const openImages=async(field:Field)=>{setImageField(field);picker.current?.showModal();if(ready){try{const data=await jsonRequest('/api/editor/assets');setAssets(data.assets);}catch(error){setError(error instanceof Error?error.message:'Could not load images.');}}};
 const choose=(asset:ContentImageValue)=>{if(imageField)setImage(imageField.id,{...asset,x:50,y:50,overlay:imageValue(document,imageField.id).overlay ?? true,overlayOpacity:imageValue(document,imageField.id).overlayOpacity});picker.current?.close();setImageField(null);};
 const uploadPhoto=async(file?:File)=>{
  if(!file||!imageField)return;setBusy('upload');setProgress(0);setError('');
  try{
   const photo=await preparePhoto(file),id=crypto.randomUUID(),ext=photo.type==='image/png'?'png':photo.type==='image/webp'?'webp':'jpg';
   await uploadPresigned(`pending/${id}.${ext}`,photo,{access:'private',handleUploadUrl:'/api/editor/upload',onUploadProgress:({percentage})=>setProgress(Math.round(percentage))});
   setProgress(100);
   const data=await jsonRequest('/api/editor/assets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,alt:file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ')})});
   setAssets(old=>[data.asset,...old]);choose(data.asset);setStatus('Image uploaded. Add an image description, then save or publish.');
  }catch(error){setError(error instanceof Error?error.message:'Image upload failed.');}
  finally{setBusy('');if(fileInput.current)fileInput.current.value='';}
 };
 return <main id="main" className="content-editor">
  <header className="editor-header"><div><span className="editor-brand">Blågårds Apotek</span><h1>Content editor</h1><a href="/admin/social-generator" className="editor-button" onClick={e=>{if(dirty&&!window.confirm('Leave without saving your draft?'))e.preventDefault();}}>Content Studio · Social posts</a></div><a href="/" className="editor-button" onClick={e=>{if(dirty&&!window.confirm('Leave without saving your draft?'))e.preventDefault();}}>View site</a></header>
  <div className="editor-body">
   {!ready&&!loading&&<aside className="editor-setup"><strong>Storage setup needed</strong><p>Connect Neon Postgres and a private Blob store to the Blågårds Apotek project in Vercel, then redeploy. You can explore fields and preview changes now; saving and new uploads become available after setup.</p><button onClick={()=>void load()} className="editor-button">Check connection</button></aside>}
   {ready&&!mediaReady&&<aside className="editor-setup"><strong>Image uploads need a Blob store</strong><p>Text editing and the existing image library are available. Connect a private Vercel Blob store to upload new photos.</p></aside>}
   <nav className="editor-tabs" aria-label="Pages">{pages.map(item=><button key={item.id} aria-pressed={page===item.id} onClick={()=>{setPage(item.id);}}>{item.label}</button>)}</nav>
   <div className="editor-controls"><span className="editor-state">{loading?'Loading…':dirty?'Unsaved changes':ready?'Draft up to date':'Exploring original content'}</span></div>
   {page==='splash'&&<><p className="editor-caption">Shown once per tab session. Preview lets you see it again while editing. Brand colors follow your palette settings.</p><ContentProvider value={document}><BrandSplash preview/></ContentProvider></>}
   {page==='brand'&&<p className="editor-caption">These two colors apply across every page, including logos, illustrations and photo overlays. Gallery and exhibition photographs use the same gradient as the other page photographs; concert posters stay clear. Uniform mode applies the shared colour and opacity to every photo, including photos previously switched off. Select individual overrides to use per-photo settings. Concert posters and brand artwork stay clear. Preview your draft, then publish to update the live site.</p>}
   {page==='brand'&&<ContentProvider value={document}><section className="editor-artwork-samples" aria-label="Live logo and illustration colours">{(['gold','green'] as const).map(tone=><div key={tone} className="editor-artwork-sample" style={{backgroundColor:brandColors(document)[tone==='gold'?'green':'gold']}}><BrandArtwork alt="Blågårds Apotek" tone={tone}/><BrandArtwork src="/kroteket/6c6d53aa-guitar.png" alt="Musik" width={512} height={512} tone={tone}/><BrandArtwork src="/kroteket/5a192dae-painting.png" alt="Kunst" width={512} height={512} tone={tone}/></div>)}</section></ContentProvider>}
   {page==='animations'&&<div className="editor-motion-intro"><p>Control animation timing, easing and movement. Device Reduce Motion is always respected. Video colour/saturation and splash hold time keep their existing controls. Open Preview and scroll to test heading letters, expanding photo frames, photo zoom and parallax. Open the menu to test its letter roll and drawn dividers. Follow an internal page link to test the page curtain. Menu navigation uses the existing menu as its cover. Use Replay preview to restart arrivals. Photo travel is the total movement in pixels; higher values crop the images more.</p><label>Preview page<select aria-label="Preview page" value={motionPreviewRoute} onChange={event=>setMotionPreviewRoute(event.target.value)}><option value="splash">Splash screen</option>{pages.filter(item=>!['animations','brand','splash','shared'].includes(item.id)).map(item=><option key={item.id} value={item.route}>{item.label}</option>)}</select></label><button className="editor-button" onClick={()=>setDocument(old=>({ ...old,text:Object.fromEntries(Object.entries(old.text).filter(([key])=>!key.startsWith('motion.')))}))}>Reset all animation settings</button></div>}
   {sections.map(current=><section key={`${page}-${current}`} className="editor-section" aria-label={sectionNames[current]||current} aria-busy={loading}><h3 className="editor-section-title">{sectionNames[current]||current}</h3><div className="editor-fields">
    {pageFields.filter(field=>field.section===current).map(field=>field.kind==='image'?<article key={field.id} className="editor-card editor-image-card">
     <div className="editor-card-heading"><h3>{['splash.background','experience.hero.image1'].includes(field.id)?field.label:'Photograph'}</h3><button type="button" className="editor-button" onClick={()=>void openImages(field)}>Change image</button></div>
     {field.id==='experience.hero.image1'&&<p className="editor-caption">The hero plays the bundled video. This photograph is used by the splash when no separate splash image is selected. Use Preview to see the video colour, strength and saturation.</p>}
     {field.id==='splash.background'&&<><p className="editor-caption">{document.images[field.id]?'Using a separate splash photograph.':'Following the current hero photograph.'}</p>{document.images[field.id]&&<button className="editor-button" onClick={()=>setDocument(old=>{const images={...old.images};delete images[field.id];return {...old,images};})}>Use hero photograph</button>}</>}
     <div className="editor-image-preview" data-photo-gradient style={{'--photo-overlay-color':photoOverlayColor(document),'--editor-image-opacity':isPoster(field.id)?0:imageOverlayStrength(document,imageValue(document,field.id))} as CSSProperties}><img loading="lazy" decoding="async" src={imageValue(document,field.id).src} alt={imageValue(document,field.id).alt} style={{objectPosition:`${imageValue(document,field.id).x}% ${imageValue(document,field.id).y}%`}}/></div>
     {!isPoster(field.id)&&<>
     {uniformPhotoOverlay(document)&&<p className="editor-caption">Using the shared photo overlay from Brand colors. Individual overrides are preserved but inactive.</p>}
     <label className="editor-overlay-toggle"><input disabled={uniformPhotoOverlay(document)} type="checkbox" checked={uniformPhotoOverlay(document)||imageValue(document,field.id).overlay !== false} onChange={e=>setImage(field.id,{...imageValue(document,field.id),overlay:e.target.checked})}/><span>Photo overlay / gradient</span></label>
     <label className="editor-overlay-opacity" htmlFor={`${field.id}-opacity`}><span>Overlay opacity <output htmlFor={`${field.id}-opacity`}>{imageOverlayOpacity(document,imageValue(document,field.id))}%</output></span><input id={`${field.id}-opacity`} type="range" min="0" max="100" step="1" disabled={uniformPhotoOverlay(document)||imageValue(document,field.id).overlay === false} value={imageOverlayOpacity(document,imageValue(document,field.id))} onChange={e=>setImage(field.id,{...imageValue(document,field.id),overlayOpacity:Number(e.target.value)})}/></label>
     <div className="editor-overlay-inheritance"><span>{uniformPhotoOverlay(document)?'Uniform global overlay':imageValue(document,field.id).overlayOpacity === undefined?'Using global opacity':'Custom image opacity'}</span><button type="button" className="editor-reset" disabled={uniformPhotoOverlay(document)||imageValue(document,field.id).overlayOpacity === undefined} onClick={()=>{const image={...imageValue(document,field.id)};delete image.overlayOpacity;setImage(field.id,image);}}>Use global opacity</button></div>
     </>}
     {isPoster(field.id)&&<p className="editor-caption">Concert posters stay clear, without a photo overlay.</p>}
     <label>Image description<textarea rows={2} value={imageValue(document,field.id).alt} maxLength={500} onChange={e=>setImage(field.id,{...imageValue(document,field.id),alt:e.target.value})}/></label>
     <details className="editor-crop"><summary>Adjust crop focus</summary><p>The website keeps its existing image effects. Move the focus to keep the subject in view.</p><label>Horizontal focus <span>{imageValue(document,field.id).x}%</span><input type="range" min="0" max="100" value={imageValue(document,field.id).x} onChange={e=>setImage(field.id,{...imageValue(document,field.id),x:Number(e.target.value)})}/></label><label>Vertical focus <span>{imageValue(document,field.id).y}%</span><input type="range" min="0" max="100" value={imageValue(document,field.id).y} onChange={e=>setImage(field.id,{...imageValue(document,field.id),y:Number(e.target.value)})}/></label></details>
    </article>:<article key={field.id} className="editor-card"><div className="editor-card-heading"><label htmlFor={field.id}>{field.label}</label><button type="button" className="editor-reset" disabled={uniformPhotoOverlay(document)&&globalTreatmentField(field.id)} onClick={()=>setText(field.id,String(field.default))}>Reset</button></div>{uniformPhotoOverlay(document)&&globalTreatmentField(field.id)&&<p className="editor-caption">Using the shared photo overlay from Brand colors.</p>}{field.id==='experience.hero.videoOverlayColor'?<input disabled={uniformPhotoOverlay(document)} id={field.id} type="color" value={editorValue(field.id)} onChange={e=>setText(field.id,e.target.value)}/>:field.control==='color'?<BrandColorPicker id={field.id} label={field.label} value={editorValue(field.id)} onChange={value=>setText(field.id,value)} grain={Number(textValue(document,'brand.grain'))||0} onGrainChange={value=>setText('brand.grain',String(value))}/>:field.control==='select'?<select id={field.id} value={editorValue(field.id)} onChange={event=>setText(field.id,event.target.value)}>{field.options?.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select>:field.control==='toggle'?<div className="editor-splash-toggle"><input id={field.id} type="checkbox" checked={textValue(document,field.id)==='true'} onChange={e=>setText(field.id,String(e.target.checked))}/><span>{textValue(document,field.id)==='true'?'On':'Off'}</span></div>:field.control==='range'?<div className="editor-splash-range"><input disabled={uniformPhotoOverlay(document)&&globalTreatmentField(field.id)} id={field.id} type="range" min={field.min} max={field.max} step={field.step} value={editorValue(field.id)} onChange={e=>setText(field.id,e.target.value)}/><output htmlFor={field.id}>{editorValue(field.id)}{field.unit?' '+field.unit:field.id==='splash.duration'?' ms':'%'}</output></div>:field.kind==='text'?<textarea id={field.id} rows={field.label==='Heading'?3:field.label==='Paragraph'?5:2} maxLength={12000} value={editorValue(field.id)} onChange={e=>setText(field.id,e.target.value)}/>:<input id={field.id} type={field.kind==='link'?'text':'text'} inputMode={field.kind==='link'?'url':'text'} autoCapitalize={field.kind==='link'?'none':'sentences'} spellCheck={field.kind!=='link'} maxLength={field.kind==='link'?500:12000} value={editorValue(field.id)} onChange={e=>setText(field.id,e.target.value)}/>}{field.label==='Heading'&&<p className="editor-caption">New line = a line break. Use *italic* or **bold** where needed.</p>}</article>)}
   </div></section>)}
   <details className="editor-history"><summary>Previous published version</summary><p>Restore the version published immediately before the current one.</p><button className="editor-button" disabled={!ready||!hasPrevious||Boolean(busy)} onClick={()=>void save('restore')}>Restore previous version</button></details>
   <div role="status" aria-live="polite" className="editor-message">{status}</div><div role="alert" className="editor-error">{error}</div>
  </div>
  <footer className={`editor-actions ${keyboard?'editor-keyboard':''}`}><button className="editor-button" disabled={Boolean(busy)||loading} onClick={()=>{setPreviewOpen(true);preview.current?.showModal();}}>Preview</button><button className="editor-button" disabled={!ready||Boolean(busy)||loading||!dirty} onClick={()=>void save('save')}>{busy==='save'?'Saving…':'Save draft'}</button><button className="editor-button editor-publish" disabled={!ready||Boolean(busy)||loading} onClick={()=>void save('publish')}>{busy==='publish'?'Publishing…':'Publish'}</button></footer>
  <dialog ref={picker} className="editor-dialog" aria-label="Choose an image" onCancel={event=>{if(busy==='upload')event.preventDefault();}} onClose={()=>setImageField(null)}><div className="editor-dialog-header"><h2>Choose an image</h2><button className="editor-icon" aria-label="Close image library" disabled={busy==='upload'} onClick={()=>picker.current?.close()}>×</button></div><div className="editor-dialog-content"><input ref={fileInput} type="file" accept="image/*" className="editor-file-input" aria-label="Choose a photo, use the camera or upload an image file" onChange={e=>void uploadPhoto(e.target.files?.[0])}/><button className="editor-button editor-upload" disabled={!ready||!mediaReady||Boolean(busy)} onClick={()=>fileInput.current?.click()}>{busy==='upload'?(progress===100?'Preparing image…':`Uploading ${progress}%`):'Upload a photo'}</button><p className="editor-caption">Choose Photo Library, Take Photo or Choose File from your iPhone’s standard picker.</p>{busy==='upload'&&<progress max="100" value={progress} aria-label="Image upload progress"/>}<div role="alert" className="editor-error">{error}</div><h3>Image library</h3><div className="editor-gallery">{gallery.map(asset=><button key={asset.src} disabled={Boolean(busy)} onClick={()=>choose(asset)} aria-label={`Choose ${asset.alt||'image'}`}><img src={asset.src} alt={asset.alt} loading="lazy"/></button>)}</div></div></dialog>
  <dialog ref={preview} className="editor-preview" aria-label="Draft site preview" onClose={()=>setPreviewOpen(false)}><div className="editor-dialog-header"><div><h2>Draft preview</h2><p>Includes unsaved changes</p></div>{(page==='animations'||page==='splash')&&<button className="editor-button" onClick={()=>setPreviewRun(value=>value+1)}>Replay preview</button>}<button className="editor-icon" aria-label="Close preview" onClick={()=>preview.current?.close()}>×</button></div>{previewOpen&&((page==='splash'||(page==='animations'&&motionPreviewRoute==='splash'))?<ContentProvider value={document}><SplashPreview key={previewRun}/></ContentProvider>:<iframe key={previewRun} ref={frame} title="Website draft preview" src={`${page==='animations'?motionPreviewRoute:pages.find(p=>p.id===page)?.route||'/'}?preview=draft`} onLoad={previewMessage}/>)}</dialog>
 </main>;
}
