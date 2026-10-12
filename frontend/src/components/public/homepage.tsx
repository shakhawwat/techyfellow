import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {Section} from '@/components/ui/section';
import {AudiencePathways} from './home-opening';
import {HeroSlider} from './hero-slider';
import {EngineeringServices,FeaturedProjects} from './home-engineering';
import {ResearchPublications} from './home-research';
import {HomeSupportSections} from './home-support';
import {HomeMentorshipStore} from './home-mentorship-store';
import {HomeCompany} from './home-company';
import {homeCopy as copy} from '@/content/home';
import type {ContentKind,ContentState} from '@/lib/public/content';
function Heading({eyebrow,title,description}:{eyebrow:string;title:string;description?:string}){return <div className='public-heading'><span className='eyebrow'>{eyebrow}</span><h2>{title}</h2>{description&&<p>{description}</p>}</div>;}
function Action({href,children,secondary=false}:{href:string;children:React.ReactNode;secondary?:boolean}){return <Link prefetch={false} className={`button button-${secondary?'secondary':'primary'}`} href={href}>{children}<ArrowUpRight aria-hidden='true'/></Link>;}
export function Homepage({content}:{content:Record<ContentKind,ContentState>}){return <main id='public-main' tabIndex={-1}>
  <HeroSlider/>
  <AudiencePathways/>
  <EngineeringServices/>
  <FeaturedProjects content={content.projects}/>
  <ResearchPublications research={content.research} publications={content.publications}/>
  <HomeSupportSections courses={content.courses}/>
  <HomeMentorshipStore/>
  <HomeCompany content={content.team}/>
  <Section tone='dark' id='inquiry' tabIndex={-1} className='public-final-cta'><Heading eyebrow={copy.inquiry.eyebrow} title={copy.inquiry.title} description={copy.inquiry.text}/><Action href='/build-with-us'>{copy.inquiry.cta}</Action><p className='public-inquiry-availability'>{copy.inquiry.availability}</p></Section>
</main>;}
