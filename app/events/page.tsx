import type { Metadata } from 'next';
import VenuePage from '../VenuePage';
export const metadata:Metadata = {title:"Koncerter",description:"Jazz, sangskrivere & livemusik"};
export default function Page() {return <VenuePage page="events"/>;}
