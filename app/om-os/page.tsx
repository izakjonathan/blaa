import type { Metadata } from 'next';
import VenuePage from '../VenuePage';
export const metadata:Metadata = {title:"Om os",description:"Et lokalt, non-profit spillested"};
export default function Page() {return <VenuePage page="about"/>;}
