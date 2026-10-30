import type { Metadata } from 'next';
import VenuePage from '../VenuePage';
export const metadata:Metadata = {title:"Kontakt",description:"Find vej & åbningstider"};
export default function Page() {return <VenuePage page="contact"/>;}
