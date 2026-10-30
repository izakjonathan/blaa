import type { Metadata } from 'next';
import VenuePage from '../VenuePage';
export const metadata:Metadata = {title:"Spil hos os",description:"Kom op på scenen"};
export default function Page() {return <VenuePage page="play"/>;}
