'use client';
import Image from 'next/image';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {Container} from '@/components/ui/container';
import {homeCopy} from '@/content/home';
import {demoKits,bdt,kitTotal,type KitPreview} from './kit-data';
import {KitPopup} from './home-mentorship-store';
import styles from './kit-catalog.module.css';
export function KitCatalog(){
 const [selected,setSelected]=useState<KitPreview|null>(null);
 return <main id="public-main" tabIndex={-1} data-theme="dark" className={styles.catalog}><Container><nav aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true"> / </span><span>Concept kits</span></nav><header><p className={styles.label}>ROBOTICS STORE</p><h1>Explore all concept kits.</h1><p>Browse six illustrative robotics, IoT and AI kit concepts. Component estimates are examples, not active offers or verified quotations.</p><p className={styles.notice}>{homeCopy.store.availability}</p></header><div className={styles.grid}>{demoKits.map(kit=><article key={kit.id} className={styles.card}><div className={styles.image}><Image src={kit.image.url} alt={kit.image.alt} width={kit.image.width} height={kit.image.height} unoptimized/><span>Illustrative image</span></div><div className={styles.content}><p className={styles.label}>Concept kit · Demo pricing</p><h2>{kit.title}</h2><p className={styles.summary}>{kit.summary}</p><p className={styles.price}>{bdt(kitTotal(kit.kit))}<span>Illustrative component estimate</span></p><button type="button" aria-haspopup="dialog" aria-label={`View kit: ${kit.title}`} onClick={event=>{event.currentTarget.focus({preventScroll:true});setSelected(kit);}}>View kit<ArrowUpRight aria-hidden="true"/></button></div></article>)}</div><Link className={styles.inquiry} href="/contact">Discuss hardware requirements<ArrowUpRight aria-hidden="true"/></Link></Container>{selected&&<KitPopup key={selected.id} entry={selected} onClose={()=>setSelected(null)}/>}</main>;
}
