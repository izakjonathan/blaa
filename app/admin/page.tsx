'use client';
import Link from 'next/link';
import {useContent} from '../Content';
import {textValue} from '../../lib/content-schema';
import './tools.css';
export default function Tools(){const content=useContent();return <main className="backend-home" id="main" style={{background:textValue(content,'brand.adminBackground')}}><p className="eyebrow">Blågårds Apotek</p><h1>Tools</h1><p>Choose your workspace.</p><div className="backend-tools">{[{href:'/admin/editor',name:'Editor',text:'Website content, brand colours and animations'},{href:'/admin/social-generator',name:'SoMe Generator',text:'Templates and social posts'},{href:'/admin/stock',name:'Stock Control',text:'Weekly counts, deliveries, sales and waste'}].map(tool=><Link key={tool.href} href={tool.href}><h2>{tool.name}</h2><p>{tool.text}</p><span aria-hidden="true">↗</span></Link>)}</div></main>;}
