import type {ContentState} from '@/lib/public/content';
import {researchStages} from '@/lib/public/pages';
export type ResearchKind='research'|'publications';
export type ResearchEntry={id:string;kind:ResearchKind;title:string;summary:string;demo:boolean;teamAvailability?:'Team members needed'|'Team complete';demoStatus?:'Ongoing';demoTeam?:'Team members needed'|'Team complete';domain?:string;stage?:string;authors?:string[];venue?:string;year?:number;doi?:string;publisherUrl?:string;question?:string;methods?:readonly string[];technologies?:readonly string[];nextSteps?:readonly string[]};
// Illustrative, frontend-only proposals. These are never stored or published as records.
const concepts=[
 {title:'Knowledge-Enhanced Sentiment Analysis',summary:'Proposed exploration of knowledge graphs and transformer representations.',question:'Proposed question: how could structured context support sentiment interpretation?',methods:['Proposed comparison of transformer representations with and without graph-derived context','Proposed analysis of ambiguous language using permission-approved examples'],technologies:['Suggested knowledge graph representation','Suggested transformer embeddings'],nextSteps:['Proposed next step: define the task and select a suitable dataset','Proposed next step: establish a baseline and an evaluation plan']},
 {title:'Multimodal Emotion Understanding',summary:'Proposed exploration of text/image fusion.',question:'Proposed question: how could text and visual context be combined for emotion understanding?',methods:['Proposed comparison of text-only, image-only and combined representations','Proposed review of disagreements between modalities'],technologies:['Suggested text and image encoders','Suggested fusion layer'],nextSteps:['Proposed next step: define annotation guidance and consent requirements','Proposed next step: plan evaluation of modality-specific limitations']},
 {title:'Edge AI for Robotics',summary:'Proposed exploration of vision inference on embedded hardware.',question:'Proposed question: what tradeoffs arise when moving robot vision inference onto embedded hardware?',methods:['Proposed comparison of model sizes and inference configurations','Proposed evaluation plan for latency, resource use and failure cases'],technologies:['Suggested embedded compute board','Suggested vision inference runtime'],nextSteps:['Proposed next step: select hardware and a representative vision task','Proposed next step: define controlled tests before making performance claims']},
 {title:'Human–Robot Interaction',summary:'Proposed exploration of interfaces for human-guided robot behavior.',question:'Proposed question: how could an operator communicate intent and retain control during robot interactions?',methods:['Proposed interface prototyping','Proposed supervised interaction study with permission and consent'],technologies:['Suggested robot control interface','Suggested interaction logging'],nextSteps:['Proposed next step: define interaction scenarios and safety constraints','Proposed next step: design a consent-based study plan']},
 {title:'Trustworthy Edge Intelligence',summary:'Proposed exploration of uncertainty and human review in edge inference.',question:'Proposed question: when should an edge inference system request human review?',methods:['Proposed examination of confidence and uncertainty signals','Proposed comparison of review thresholds using held-out examples'],technologies:['Suggested edge inference runtime','Suggested human-review interface'],nextSteps:['Proposed next step: define failure cases and review criteria','Proposed next step: plan calibration and error analysis']},
] as const;
const layouts=[
 'Knowledge Graphs for Context-Aware Language Understanding',
 'Cross-Modal Fusion for Intelligent Systems',
 'Embedded Vision for Autonomous Systems',
 'Knowledge-Guided Intelligent Systems',
 'Human-Centered Multimodal Interfaces',
] as const;
export function researchEntries(content:ContentState,kind:ResearchKind):ResearchEntry[]{
 if(content.state==='available')return content.data.slice(0,5).map(item=>({id:item.slug,kind,title:item.title,summary:item.summary,demo:false,domain:item.domain,stage:researchStages.find(stage=>stage===item.researchStage),authors:item.authors,venue:item.venue,year:item.year,doi:item.doi,publisherUrl:item.publisherUrl}));
 if(content.state!=='empty'||content.data.length)return [];
 return kind==='research'?concepts.map((concept,index)=>({...concept,id:`research-concept-${index+1}`,kind,demo:true,demoStatus:'Ongoing',demoTeam:index%2===0?'Team members needed':'Team complete'})):layouts.map((title,index)=>({id:`publication-layout-${index+1}`,kind,title,summary:'Illustrative publication layout only; not a real paper or a claim of published work.',venue:'Example Journal',year:2026,demo:true}));
}

// A minimal plain-text citation uses only supplied bibliographic fields.
export function publicationCitation(entry:Pick<ResearchEntry,'kind'|'demo'|'title'|'authors'|'venue'|'year'|'doi'|'publisherUrl'>):string|undefined {
 if(entry.kind==='publications'&&entry.demo)return `Fictional citation for layout preview: ${entry.title}. Example Journal (2026).`;
 if(entry.kind!=='publications'||!entry.title?.trim()||!entry.authors?.length||entry.authors.some(author=>!author.trim())||!entry.venue?.trim()||!Number.isInteger(entry.year)||entry.year!<1||entry.year!>9999)return;
 return `${entry.authors.join(', ')} (${entry.year}). ${entry.title}. ${entry.venue}.`;
}
