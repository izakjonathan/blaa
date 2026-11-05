'use client';
import Link from 'next/link';
import type {MouseEvent} from 'react';

const items=[{href:'/admin',label:'Main',icon:'home'},{href:'/admin/editor',label:'Editor',icon:'editor'},{href:'/admin/social-generator',label:'SoMe',icon:'social'},{href:'/admin/stock',label:'Stock',icon:'stock'}];
export default function AdminDock({pathname}:{pathname:string}){
 const leave=(event:MouseEvent<HTMLAnchorElement>,href:string)=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||href===pathname)return;if(document.documentElement.dataset.adminUnsaved==='true'&&!window.confirm('Leave without saving your changes?'))event.preventDefault();};
 return <nav className="admin-dock" aria-label="Admin tools">{items.map(item=><Link key={item.href} href={item.href} onClick={event=>leave(event,item.href)} aria-current={pathname===item.href?'page':undefined}><span className="admin-dock-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
 {item.icon==='home'?<><path d="M4.5 11.2 12 4.8l7.5 6.4"/><path d="M6.8 10.5v8.2h10.4v-8.2M10 18.7v-5h4v5"/></>:item.icon==='editor'?<><path d="M7 5.2h10M7 12h10M7 18.8h6M4.5 5.2h.01M4.5 12h.01M4.5 18.8h.01"/></>:item.icon==='social'?<><rect x="5" y="5" width="14" height="14" rx="3"/><circle cx="9" cy="9" r="1"/><path d="m6 17 4-4 3 3 2-2 3 3"/></>:<><path d="M5.2 18.8V9.2M12 18.8V5.2M18.8 18.8v-7.5M4 18.8h16"/></>}
 </svg></span><span>{item.label}</span></Link>)}</nav>;
}
