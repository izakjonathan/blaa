import type { Metadata } from 'next';
import VenuePage from '../VenuePage';
export const metadata:Metadata = {title:"Galleri",description:"Livet på Kroteket"};
export default function Page() {return <VenuePage page="gallery"/>;}
