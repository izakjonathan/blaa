import type { Metadata } from 'next';
import VenuePage from '../VenuePage';
export const metadata:Metadata = {title:"Kunst",description:"Udstil hos os"};
export default function Page() {return <VenuePage page="art"/>;}
