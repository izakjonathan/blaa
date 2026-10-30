import type { Metadata } from 'next';
import Editor from './Editor';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title:'Blågårds Apotek · Content editor',robots:{index:false,follow:false}};
export default function AdminPage() { return <Editor/>; }
