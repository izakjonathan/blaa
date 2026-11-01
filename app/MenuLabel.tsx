'use client';
import {type CSSProperties} from 'react';
import {Copy,useContent} from './Content';
import {editorialSettings} from '../lib/editorial-motion';
import {textValue} from '../lib/content-schema';

/** Keep one accessible source; the rolling duplicate is decorative. */
export default function MenuLabel({field}:{field:string}){
 const content=useContent();
 const roll=editorialSettings(content).roll;
 const label=textValue(content,field);
 if(!roll)return <span><Copy field={field}/></span>;
 const characters=Array.from(new Intl.Segmenter('da',{granularity:'grapheme'}).segment(label));
 return <span className="menu-label"><span className="menu-label-source"><Copy field={field}/></span><span className="menu-label-visual" aria-hidden="true">{characters.map(({segment,index},i)=><span className="menu-letter-mask" key={index} style={{'--letter-index':i} as CSSProperties}><span className="menu-letter-track"><span>{segment===' '?'\u00a0':segment}</span><span>{segment===' '?'\u00a0':segment}</span></span></span>)}</span></span>;
}
