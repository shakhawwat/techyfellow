import type {Metadata} from 'next';
import {Homepage} from '@/components/public/homepage';
import {homepageContent} from '@/lib/public/server-content';
import {homeCopy} from '@/content/home';
export const dynamic='force-dynamic';
export const metadata:Metadata={...homeCopy.metadata,openGraph:{...homeCopy.metadata,type:'website',siteName:'Techy Fellow'}};
export default async function Home(){return <Homepage content={await homepageContent()}/>;}
