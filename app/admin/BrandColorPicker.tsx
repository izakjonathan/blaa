'use client';
import { useEffect, useRef, useState } from 'react';
import { hexToHsl, hslToHex, type HSL } from '../../lib/color';

type Props={id:string;label:string;value:string;onChange:(value:string)=>void;grain:number;onGrainChange:(value:number)=>void};
export default function BrandColorPicker({id,label,value,onChange,grain,onGrainChange}:Props){
 const [tab,setTab]=useState('picker');
 const [hsl,setHsl]=useState(()=>hexToHsl(value));
 const last=useRef(value);
 useEffect(()=>{if(value!==last.current){setHsl(hexToHsl(value));last.current=value;}},[value]);
 const change=(next:HSL)=>{setHsl(next);const hex=hslToHex(next);last.current=hex;onChange(hex);};
 const slider=(name:string,key:keyof HSL,max:number,reverse=false)=> <label className="editor-color-slider" key={name} htmlFor={`${id}-${tab}-${key}`}><span>{name}<output>{Math.round(reverse?100-hsl[key]:hsl[key])}{key==='h'?'°':'%'}</output></span><input id={`${id}-${tab}-${key}`} type="range" min={0} max={max} step={1} value={reverse?100-hsl[key]:hsl[key]} onChange={e=>change({...hsl,[key]:reverse?100-Number(e.target.value):Number(e.target.value)})}/></label>;
 return <div className="editor-palette-picker">
  <div className="editor-palette-swatch" style={{backgroundColor:/^#[0-9a-f]{6}$/i.test(value)?value:'#263D32'}} aria-label={`${label} color sample`}><span className="brand-grain-sample" style={{opacity:grain/100*.18}}/></div>
  <div className="editor-color-tabs" role="tablist" aria-label={`${label} color controls`}>{[['picker','Picker'],['hsl','HSL'],['custom','Custom']].map(([key,title])=><button type="button" key={key} role="tab" id={`${id}-tab-${key}`} aria-selected={tab===key} tabIndex={tab===key?0:-1} onKeyDown={event=>{
 const keys=['picker','hsl','custom'];let next=keys.indexOf(tab);
 if(event.key==='ArrowRight')next=(next+1)%3;
 else if(event.key==='ArrowLeft')next=(next+2)%3;
 else if(event.key==='Home')next=0;
 else if(event.key==='End')next=2;
 else return;
 event.preventDefault();setTab(keys[next]);
 event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
 }} aria-controls={`${id}-panel`} onClick={()=>setTab(key)}>{title}</button>)}</div>
  <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`}>
   {tab==='picker'?<div className="editor-color-control"><input id={id} aria-label={`${label} color picker`} type="color" value={/^#[0-9a-f]{6}$/i.test(value)?value:'#263D32'} onChange={e=>{setHsl(hexToHsl(e.target.value));last.current=e.target.value;onChange(e.target.value);}}/><label>Hex<input aria-label={`${label} hex color`} type="text" value={value} maxLength={7} spellCheck={false} autoCapitalize="none" onChange={e=>onChange(e.target.value)}/></label></div>:<>
   {slider('Hue','h',360)}
   {tab==='hsl'?slider('Saturation','s',100):slider('Dustiness','s',100,true)}
   {slider('Lightness','l',100)}
   {tab==='custom'&&<><p className="editor-caption">More dusty softens the color by reducing saturation.</p><label className="editor-color-slider" htmlFor={`${id}-grain`}><span>Grain level<output>{grain}%</output></span><input id={`${id}-grain`} type="range" min={0} max={100} step={1} value={grain} onChange={e=>onGrainChange(Number(e.target.value))}/></label><p className="editor-caption">Grain is shared across both brand colors and adds texture across the site.</p></>}
   <p className="editor-caption">Current color: {value.toUpperCase()}</p>
   </>}
  </div>
 </div>;
}
