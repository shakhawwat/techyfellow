import type {Metadata} from 'next';
import {KitCatalog} from '@/components/public/kit-catalog';
export const metadata:Metadata={title:'Concept kits | Techy Fellow',description:'Explore illustrative robotics, IoT and AI kit concepts with proposed components and example estimates.'};
export default function Page(){return <KitCatalog/>;}
