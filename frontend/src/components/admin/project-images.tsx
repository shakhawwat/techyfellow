'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/form-field';
import { MediaLibrary } from './media-library';
import type { Value,Values } from '@/lib/admin/fields';
export function ProjectImages({value,onChange,disabled,errors}:{value:Value;onChange:(value:Value)=>void;disabled:boolean;errors:Record<string,string>}){
  const [selecting,setSelecting]=useState(false);const rows=value as Values[];
  return <fieldset className='admin-fieldset'><legend>Project image gallery</legend><p className='field-hint'>Choose ready project images from the media library. Describe each image in the context of this project. Removing a reference keeps the stored asset.</p>
    {rows.map((row,index)=><div className='admin-repeat-row' key={index}><p>Media ID: {String(row.reference)}</p><TextField id={`project-image-${index}-alt`} label={`Image ${index+1} alt text`} value={String(row.altText)} maxLength={500} disabled={disabled} error={errors[`media.${index}.altText`]??errors[`media.${index}.reference`]} onChange={event=>onChange(rows.map((r,i)=>i===index?{...r,altText:event.target.value}:r))}/>{!disabled&&<Button variant='secondary' onClick={()=>onChange(rows.filter((_,i)=>i!==index))}>Remove image {index+1} reference</Button>}</div>)}
    {rows.length===0&&<p>No images selected.</p>}
    {!disabled&&<Button variant='secondary' disabled={rows.length>=100} onClick={()=>setSelecting(!selecting)}>{selecting?'Close image selection':'Choose project image'}</Button>}
    {selecting&&!disabled&&<MediaLibrary resource='projects' onSelect={media=>{onChange([...rows,{reference:media.id,type:'image',altText:media.altText}]);setSelecting(false);}}/>}
  </fieldset>;
}
