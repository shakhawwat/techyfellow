import { apiBase, ApiError } from './api';
import type { Resource } from './contracts';
export type Media = { id:string; filename:string; mimeType:string; size:number; width:number; height:number; altText:string; resource:Resource; status:'ready'|'failed'|'uploading'; revision:number; url?:string };
export type MediaList = { data:Media[]; pagination:{page:number;totalPages:number;total:number}; settings:{maxBytes:number;maxDimension:number;maxPixels:number;uploadAvailable:boolean} };
export function checkedMedia(value:Media):Media { if(!value||!/^[a-f0-9]{24}$/.test(value.id)||!['ready','failed','uploading'].includes(value.status)||!Number.isSafeInteger(value.revision)||typeof value.altText!=='string')throw new ApiError(0,'The media response could not be verified.');return value; }
export function approvedMediaUrl(value?:string):string|undefined {
  const host=process.env.NEXT_PUBLIC_MEDIA_HOST;
  if(!host||!value)return;try{const u=new URL(value);if(u.protocol==='https:'&&u.hostname===host&&!u.port&&!u.username&&!u.password&&!u.search&&!u.hash&&/^\/techyfellow\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(u.pathname))return value;}catch{}return;
}
export function uploadImage(file:File,resource:Resource,altText:string,onProgress:(percentage:number)=>void):Promise<Media> {
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();xhr.open('POST',apiBase()+'/admin/media/upload');xhr.withCredentials=true;xhr.timeout=60000;xhr.setRequestHeader('X-CSRF-Protection','1');
    xhr.upload.onprogress=event=>{if(event.lengthComputable)onProgress(Math.round(event.loaded/event.total*100));};
    xhr.onerror=xhr.ontimeout=()=>reject(new ApiError(0,'Upload could not be confirmed. Check the library before retrying.'));
    xhr.onload=()=>{let response;try{response=JSON.parse(xhr.responseText);}catch{return reject(new ApiError(xhr.status,'Upload response could not be verified. Check the library before retrying.'));}
      if(xhr.status<200||xhr.status>=300)return reject(new ApiError(xhr.status,({400:'Invalid image or metadata. Use a single-frame JPEG, PNG or WebP within the configured limits.',401:'Your session has expired.',403:'You do not have permission to upload here.',413:'Image exceeds the upload size limit.',503:'Media storage is unavailable. The upload has not been confirmed.'} as Record<number,string>)[xhr.status]??'The upload failed. No success has been confirmed.'));
      try{const media=checkedMedia(response.data);if(media.status!=='ready')throw new Error();resolve(media);}catch{reject(new ApiError(0,'Ready media could not be confirmed. Check the library.'));}
    };
    const form=new FormData();form.append('file',file);form.append('resource',resource);form.append('altText',altText);xhr.send(form);
  });
}
