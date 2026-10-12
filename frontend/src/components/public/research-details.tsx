'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowUpRight,UserPlus} from 'lucide-react';
import {ConfirmAction} from '@/components/admin/confirm';
import {createPagesLoader,doiUrl,researchStages,safeHttps,type DetailResult} from '@/lib/public/pages';
import {publicationCitation,type ResearchEntry} from './home-research-data';
import styles from './home-research.module.css';
function Citation({text}:{text:string}){
 const [message,setMessage]=useState('');
 async function copy(){try{await navigator.clipboard.writeText(text);setMessage('Citation copied.');}catch{setMessage('Copy unavailable. Select and copy the citation text below.');}}
 return <section><h3>Citation</h3><p className={styles.citationText}>{text}</p><button type="button" className={styles.copyButton} onClick={()=>void copy()}>Copy citation</button><p className={styles.demoNote} role="status">{message}</p></section>;
}
export function ResearchDetails({entry,onClose,citationOnly=false}:{entry:ResearchEntry;onClose:()=>void;citationOnly?:boolean}){
 const [result,setResult]=useState<DetailResult|null>(null);
 useEffect(()=>{
  if(entry.demo||citationOnly)return;
  let mounted=true;
  async function load(){
   try{const base=new URL(process.env.NEXT_PUBLIC_API_BASE_URL??'/api/v1',window.location.origin).href;const data=await createPagesLoader(base).detail(entry.kind,entry.id);if(mounted)setResult(data);}
   catch{if(mounted)setResult({state:'unavailable'});}
  }
  void load();return ()=>{mounted=false;};
 },[entry,citationOnly]);
 const record=result?.state==='available'?result.data:undefined,isResearch=entry.kind==='research';
 const recruiting=isResearch&&(entry.demo?entry.demoTeam:entry.teamAvailability)==='Team members needed';
 const stage=researchStages.find(value=>value===(record?.researchStage??entry.stage));
 const citation=publicationCitation({...entry,title:record?.title??entry.title,authors:record?.authors??entry.authors,venue:record?.venue??entry.venue,year:record?.year??entry.year});
 const doi=entry.demo?undefined:doiUrl(record?.doi??entry.doi),publisher=entry.demo?undefined:safeHttps(record?.publisherUrl??entry.publisherUrl);
 function paragraph(title:string,value:string|undefined){return value?<section><h3>{title}</h3><p>{value}</p></section>:null;}
 function list(title:string,values:readonly string[]|undefined){return values?.length?<section><h3>{title}</h3><ul>{values.map((value,index)=><li key={`${value}-${index}`}>{value}</li>)}</ul></section>:null;}
 return <ConfirmAction title={citationOnly?'Citation':record?.title??entry.title} busy={false} onCancel={onClose} presentation="details" className={`${styles.dialog} ${citationOnly?styles.citationDialog:''}`} headerClassName={styles.dialogHeader} contentClassName={styles.dialogContent} detailsLabel={citationOnly?'Publication citation':isResearch?'Research details':'Publication details'} closeLabel="Close entry details">
  {citationOnly?citation?<Citation text={citation}/>:<p>Citation metadata is unavailable.</p>:<>
  {entry.demo&&<><p className={styles.demoLabel}>{isResearch?'Research concept demo':'Illustrative publication layout'}</p><p className={styles.demoNote}>{isResearch?'All information below is proposed. No completed experiments, findings or publication are claimed.':'This is an illustrative demo, not a real publication. Example Journal, its year and demo impact factor are fictional layout metadata. No real authors, DOI or publisher link are claimed.'}</p></>}
  {paragraph(isResearch?'Overview':entry.demo?'Illustrative summary':'Abstract / summary',record?.summary??entry.summary)}
  {isResearch?<>
   {paragraph('Domain',record?.domain??entry.domain)}
   {paragraph(entry.demo?'Proposed research question':'Research question',entry.question)}
   {list(entry.demo?'Proposed methods':'Research methods',record?.methods.length?record.methods:entry.methods)}
   {list(entry.demo?'Suggested technologies':'Technologies',record?.technologies.length?record.technologies:entry.technologies)}
   {paragraph('Research status',entry.demo?'Proposed concept; no completed work claimed.':stage?`Research stage: ${stage}`:undefined)}
   {list(entry.demo?'Proposed next steps':'Next steps',entry.nextSteps)}
   {entry.demo&&paragraph('Illustrative status / team requirements',`${entry.demoStatus} · ${entry.demoTeam}. Fictional layout status only; not actual recruitment or evidence of ongoing experiments.`)}
   {list('Contributors',record?.contributors.map(person=>person.name))}
  </>:<>
   {list('Authors',record?.authors??entry.authors)}
   {paragraph('Venue / year',[record?.venue??entry.venue,record?.year??entry.year].filter(Boolean).join(' / ')||undefined)}
   {entry.demo&&paragraph('Illustrative metric','Demo impact factor: 4.2 (2025). Fictional layout metadata; not a verified journal metric.')}
   {citation&&<Citation text={citation}/>}
   {(doi||publisher)&&<section><h3>Paper links</h3><div className={styles.detailLinks}>{doi&&<a href={doi} target="_blank" rel="noopener noreferrer">DOI / paper<ArrowUpRight aria-hidden="true"/><span className={styles.srOnly}> (opens in a new tab)</span></a>}{publisher&&publisher!==doi&&<a href={publisher} target="_blank" rel="noopener noreferrer">Publisher<ArrowUpRight aria-hidden="true"/><span className={styles.srOnly}> (opens in a new tab)</span></a>}</div></section>}
  </>}
  {!entry.demo&&!result&&<p className={styles.demoNote} role="status">Loading available details…</p>}
  {result&&result.state!=='available'&&<p className={styles.demoNote} role="status">{result.state==='missing'?'The full record is no longer available.':'Additional details are temporarily unavailable.'}</p>}
  {!entry.demo&&<Link className={styles.recordLink} href={`/${entry.kind}/${entry.id}`} prefetch={false}>Open {isResearch?'research':'publication'} record<ArrowUpRight aria-hidden="true"/></Link>}
  {recruiting&&<section className={styles.recruitment} aria-label="Research team inquiry">
   <Link href="/contact" prefetch={false} className={`${styles.action} ${styles.recruitmentAction}`}><UserPlus aria-hidden="true"/>{entry.demo?'Join this projects':'Join this research team'}</Link>
   <p className={styles.demoNote}>Mention this research title in your inquiry: <strong>{record?.title??entry.title}</strong>.</p>
   <p className={styles.demoNote}>{entry.demo?'Recruitment is illustrative; this demo does not represent an actual team opening. ':''}An inquiry does not confirm team membership.</p>
  </section>}
 </>}
 </ConfirmAction>;
}
