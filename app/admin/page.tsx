'use client';
import Link from 'next/link';
import {useContent} from '../Content';
import {textValue} from '../../lib/content-schema';
import './tools.css';
export default function Tools(){const content=useContent();return <main className="backend-home" id="main" style={{background:textValue(content,'brand.adminBackground')}}><p className="eyebrow">Blågårds Apotek</p><h1>Tools</h1><nav className="backend-tools" aria-label="Backend tools">{[{href:'/admin/editor',name:'Editor'},{href:'/admin/social-generator',name:'SoMe Generator'},{href:'/admin/stock',name:'Stock Control'}].map(tool=><Link key={tool.href} href={tool.href}>{tool.name}</Link>)}</nav></main>;}
