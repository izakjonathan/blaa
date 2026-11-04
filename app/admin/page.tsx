import Link from 'next/link';
import './tools.css';
export default function Tools(){return <main className="backend-home" id="main"><nav className="backend-tools" aria-label="Backend tools">{[{href:'/admin/editor',name:'Editor'},{href:'/admin/social-generator',name:'SoMe Generator'},{href:'/admin/stock',name:'Stock Control'},{href:'/',name:'View site'}].map(tool=><Link key={tool.href} href={tool.href}>{tool.name}</Link>)}</nav></main>;}
