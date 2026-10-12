import type {ContentState,PublishedItem} from '@/lib/public/content';
export type TeamProfile=PublishedItem&{role?:string;demo?:boolean;demoRating?:number;demoPortrait?:{url:string;altText:string;width:number;height:number;position:string};contributions?:string[];education?:string[];experience?:string[];projects?:string[];publications?:string[];awards?:string[];profileLinks?:{label:string;url:string}[]};
// Fixed shuffled photo assignment by demo slug; never randomized during rendering.
const demoPortraits:Record<string,NonNullable<TeamProfile['demoPortrait']>>={
 'demo-robotics-engineer':{url:'/banner/PP2.jpg',altText:'Illustrative supplied demo portrait; fictional profile name does not identify this person',width:4000,height:6000,position:'50% 23%'},
 'demo-ai-researcher':{url:'/banner/PP.jpg',altText:'Illustrative supplied demo portrait; fictional profile name does not identify this person',width:4912,height:7360,position:'50% 32%'},
 'demo-learning-mentor':{url:'/banner/PP2.jpg',altText:'Illustrative supplied demo portrait; fictional profile name does not identify this person',width:4000,height:6000,position:'50% 23%'},
 "demo-embedded-engineer":{url:'/banner/PP.jpg',altText:'Illustrative supplied demo portrait; fictional profile name does not identify this person',width:4912,height:7360,position:'50% 32%'},
 "demo-vision-engineer":{url:'/banner/PP2.jpg',altText:'Illustrative supplied demo portrait; fictional profile name does not identify this person',width:4000,height:6000,position:'50% 23%'},
 "demo-software-engineer":{url:'/banner/PP2.jpg',altText:'Illustrative supplied demo portrait; fictional profile name does not identify this person',width:4000,height:6000,position:'50% 23%'},
 "demo-product-designer":{url:'/banner/PP.jpg',altText:'Illustrative supplied demo portrait; fictional profile name does not identify this person',width:4912,height:7360,position:'50% 32%'},
 "demo-technical-educator":{url:'/banner/PP.jpg',altText:'Illustrative supplied demo portrait; fictional profile name does not identify this person',width:4912,height:7360,position:'50% 32%'},
 "demo-research-engineer":{url:'/banner/PP2.jpg',altText:'Illustrative supplied demo portrait; fictional profile name does not identify this person',width:4000,height:6000,position:'50% 23%'},
};
const demos:TeamProfile[]=[
 {slug:'demo-robotics-engineer',role:'Illustrative robotics engineering role',title:'Arif Rahman',demoRating:8.5,summary:'An illustrative role exploring robot subsystems, embedded interfaces and sensor-driven prototypes.',publishedAt:'',demo:true,expertise:['Robotics','Embedded systems','Sensor integration'],contributions:['Proposed contribution: review robot subsystem interfaces.','Proposed contribution: explore firmware structure and sensor integration.','Proposed contribution: document prototype constraints and integration questions.']},
 {slug:'demo-ai-researcher',role:'Illustrative AI research role',title:'Maya Sen',demoRating:8.7,summary:'An illustrative role exploring language and vision workflows with transparent experimental evaluation.',publishedAt:'',demo:true,expertise:['NLP','Computer vision','Experimental evaluation'],contributions:['Proposed contribution: frame bounded NLP or vision research questions.','Proposed contribution: plan reproducible experiments and evaluation.','Proposed contribution: document assumptions and limitations without claiming findings.']},
 {slug:'demo-learning-mentor',role:'Illustrative learning guidance role',title:'Nadia Chowdhury',demoRating:8.6,summary:'An illustrative role supporting technical learning, learner-owned projects and clear documentation.',publishedAt:'',demo:true,expertise:['Technical training','Project guidance','Documentation','Learning interface design','Software learning exercises'],contributions:['Proposed contribution: outline practical learning pathways.','Proposed contribution: review learner-owned project plans.','Proposed contribution: support documentation while learners retain responsibility for assessed work.']},
 {"slug": "demo-embedded-engineer", "role": "Illustrative embedded systems role", "title": "Rafiq Hasan", "demoRating": 8.4, "summary": "An illustrative role: explore firmware architecture, peripheral interfaces and repeatable device debugging.", "publishedAt": "", "demo": true, "expertise": ["Embedded systems", "Firmware", "Sensor integration", "Robotics interfaces", "IoT devices"], "contributions": ["Proposed contribution: review peripheral and sensor interfaces.", "Proposed contribution: outline firmware organization and diagnostic steps."]},
 {"slug": "demo-vision-engineer", "role": "Illustrative computer vision role", "title": "Tania Ahmed", "demoRating": 8.8, "summary": "An illustrative role: explore camera pipelines, image processing and bounded inference workflows.", "publishedAt": "", "demo": true, "expertise": ["Computer vision", "Image processing", "Model inference", "Robotics perception"], "contributions": ["Proposed contribution: review camera-to-processing interfaces.", "Proposed contribution: plan checks for visual failure cases and inference limitations."]},
 {"slug": "demo-software-engineer", "role": "Illustrative software engineering role", "title": "Sami Karim", "demoRating": 8.6, "summary": "An illustrative role: explore maintainable application structure, APIs and testable integration.", "publishedAt": "", "demo": true, "expertise": ["Software engineering", "APIs", "Programming", "IoT dashboards", "Interface design"], "contributions": ["Proposed contribution: outline software interfaces and error handling.", "Proposed contribution: review documentation and repeatable integration checks."]},
 {"slug": "demo-product-designer", "role": "Illustrative product design role", "title": "Lina Farooq", "demoRating": 8.5, "summary": "An illustrative role: explore clear product interfaces and usable technical prototype interactions.", "publishedAt": "", "demo": true, "expertise": ["Product design", "Interface design", "Prototyping", "Embedded device interactions", "Educational interfaces"], "contributions": ["Proposed contribution: review interface flows and accessibility questions.", "Proposed contribution: outline prototype feedback and iteration plans."]},
 {"slug": "demo-technical-educator", "role": "Illustrative technical education role", "title": "Omar Siddiq", "demoRating": 8.7, "summary": "An illustrative role: explore practical technical learning plans and learner-owned project guidance.", "publishedAt": "", "demo": true, "expertise": ["Technical training", "Education", "Documentation", "Software learning exercises", "AI learning pathways"], "contributions": ["Proposed contribution: outline learning exercises and preparation checklists.", "Proposed contribution: support technical documentation while preserving learner authorship."]},
 {"slug": "demo-research-engineer", "role": "Illustrative research engineering role", "title": "Sara Alam", "demoRating": 8.6, "summary": "An illustrative role: explore reproducible computational workflows and transparent evaluation plans.", "publishedAt": "", "demo": true, "expertise": ["Research", "Scientific computing", "Experimental evaluation", "Computer vision evaluation", "Embedded experiments"], "contributions": ["Proposed contribution: frame a bounded research question and method.", "Proposed contribution: document assumptions and proposed evaluation limitations."]},
];
export function companyProfiles(content:ContentState):TeamProfile[]{
 if(content.state==='available')return content.data.slice(0,3).map(entry=>({...entry,demo:false}));
 return content.state==='empty'&&content.data.length===0?demos.map(entry=>({...entry,demoPortrait:demoPortraits[entry.slug]})):[];
}

export const teamFilters=['All','Robotics','IoT','AI','Research','Embedded Systems','Computer Vision','Software','Design','Education'] as const;
export type TeamFilter=typeof teamFilters[number];
const demoCategories:Record<string,TeamFilter[]>={
 'demo-robotics-engineer':['Robotics','IoT','Embedded Systems'],
 'demo-ai-researcher':['AI','Research','Computer Vision'],
 'demo-learning-mentor':['Education','Design','Software'],
 'demo-embedded-engineer':['Embedded Systems','IoT','Robotics'],
 'demo-vision-engineer':['Computer Vision','AI','Robotics','Research'],
 'demo-software-engineer':['Software','IoT','Design'],
 'demo-product-designer':['Design','Embedded Systems','Education'],
 'demo-technical-educator':['Education','Software','AI'],
 'demo-research-engineer':['Research','Computer Vision','Embedded Systems'],
};
const categories:Record<string,string[]>={
 'Robotics':['robotics','robot'], 'IoT':['iot','internet of things'], 'AI':['ai','artificial intelligence','machine learning','nlp'],
 'Research':['research','experimental evaluation'], 'Embedded Systems':['embedded','microcontroller','firmware'],
 'Computer Vision':['computer vision'], 'Software':['software','programming'], 'Design':['design'], 'Education':['education','technical training','teaching','mentoring'],
};
export function matchesTeamFilter(profile:TeamProfile,filter:TeamFilter){
 if(filter==='All')return true;
 if(profile.demo)return demoCategories[profile.slug]?.includes(filter)??false;
 const values=[...(profile.expertise??[]),profile.category??''].map(value=>value.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim());
 return values.some(value=>(categories[filter]??[]).some(term=>` ${value} `.includes(` ${term} `)));
}
export function availableTeamFilters(profiles:TeamProfile[]){return teamFilters.filter(filter=>filter==='All'||profiles.some(profile=>matchesTeamFilter(profile,filter)));}
