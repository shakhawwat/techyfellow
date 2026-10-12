import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{learningInput}=require('../dist/academy/academy-input.js');
const base={enabled:true,regularPriceMinor:250000,currency:'BDT',accessTerms:'Configured terms',benefits:[],outcomes:[],revision:0};
const video=(id,access='enrolled',file)=>({id,title:'Meaningful lesson title',description:'Supplied topic description',type:'video',access,...(file?{file}:{}),resources:[]});
const config=lessons=>({...base,modules:[{id:'first-module',title:'Actual module',lessons}]});
test('stable lesson metadata, missing media allowed but never fabricated',()=>{
 const result=learningInput(config([video('intro','public'),video('missing-video')]),'robotics');
 assert.equal(result.modules[0].lessons[1].file,undefined);assert.equal(result.modules[0].lessons[1].description,'Supplied topic description');assert.equal(result.modules[0].lessons[1].durationSeconds,undefined);
 assert.throws(()=>learningInput(config([video('intro','public','unapproved.mov')]),'robotics'));
 assert.throws(()=>learningInput(config([video('intro','public'),video('intro')]),'robotics'));
 assert.throws(()=>learningInput(config([{...video('intro','public'),description:'  '}]),'robotics'));
});
test('only first lesson may be public; accounts cannot unlock later lessons',()=>{
 assert.throws(()=>learningInput(config([video('intro','public'),video('later','public')]),'robotics'));
 assert.throws(()=>learningInput(config([video('intro','public'),video('later','account')]),'robotics'));
 assert.throws(()=>learningInput(config([video('intro','account')]),'robotics'));
 assert.equal(learningInput(config([video('intro','public'),video('later','enrolled','approved.webm')]),'robotics').modules[0].lessons[1].access,'enrolled');
});

test('later text lessons and legacy account flags cannot be newly configured as previews',()=>{
 const text={id:'text-lesson',title:'Supplied title',description:'Supplied description',type:'text',text:'Private text',resources:[]};
 assert.throws(()=>learningInput(config([video('intro','public'),{...text,access:'public'}]),'course-a'));
 assert.throws(()=>learningInput(config([video('intro','public'),{...text,access:'account'}]),'course-a'));
});
test('every published syllabus can produce stable missing-media curriculum without fabricated assets',()=>{
 const {syllabusCurriculum}=require('../dist/academy/academy-curriculum.js');
 const source={slug:'course-a',title:'Supplied course',summary:'Supplied overview',syllabus:[{title:'Actual first module',topics:['Specific topic one.']},{title:'Actual second module',topics:['Specific topic two.']}]};
 const a=syllabusCurriculum(source),b=syllabusCurriculum(source);assert.deepEqual(a,b);assert.equal(a.length,2);
 const lessons=a.flatMap(module=>module.lessons);assert.equal(lessons.filter(lesson=>lesson.access==='public').length,1);assert.equal(lessons[0].description,source.summary);
 for(const lesson of lessons){assert.ok(lesson.id&&lesson.title&&lesson.description);assert.equal(lesson.file,undefined);assert.equal(lesson.durationSeconds,undefined);}
});
