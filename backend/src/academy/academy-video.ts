import {BadRequestException} from '@nestjs/common';
export class VideoEmbedError extends BadRequestException {constructor(){super('Paste a supported HTTPS YouTube or Vimeo URL, or a single iframe with a supported source. Scripts, event handlers and other hosts are not allowed.');}}
// Fail closed: pasted HTML is parsed only as a single empty iframe. No HTML is stored or rendered.
export function parseAcademyVideo(value:unknown):string {
 if(typeof value!=='string'||!value.trim()||value.length>10000)throw new VideoEmbedError();
 let source=value.trim();
 if(source.startsWith('<')){
  const frame=/^<iframe\s+([^<>]+)>\s*<\/iframe>$/i.exec(source);if(!frame)throw new VideoEmbedError();
  let rest=frame[1],src:string|undefined;const seen=new Set<string>();
  while(rest.trim()){
   rest=rest.trimStart();const attr=/^([a-z][a-z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?(?=\s|$)/i.exec(rest);if(!attr)throw new VideoEmbedError();
   const name=attr[1].toLowerCase(),content=attr[2]??attr[3];if(seen.has(name)||!['src','title','width','height','frameborder','allow','allowfullscreen','loading','referrerpolicy','style'].includes(name)||(content===undefined&&name!=='allowfullscreen'))throw new VideoEmbedError();seen.add(name);
   if(name==='src')src=content;rest=rest.slice(attr[0].length);
  }
  if(!src)throw new VideoEmbedError();source=src.replace(/&amp;/g,'&');
 }
 let url:URL;try{url=new URL(source);}catch{throw new VideoEmbedError();}
 if(url.protocol!=='https:'||url.username||url.password||url.port||/[<>\u0000-\u0020]/.test(source))throw new VideoEmbedError();
 const host=url.hostname.toLowerCase();let id:string|undefined;
 if(['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'].includes(host)){
  if(host==='youtu.be')id=/^\/([a-zA-Z0-9_-]{11})\/?$/.exec(url.pathname)?.[1];
  else if(url.pathname==='/watch'&&host!=='www.youtube-nocookie.com'&&url.searchParams.getAll('v').length===1)id=url.searchParams.get('v')??undefined;
  else id=/^\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})\/?$/.exec(url.pathname)?.[1];
  if(!id||!/^[a-zA-Z0-9_-]{11}$/.test(id))throw new VideoEmbedError();return `https://www.youtube.com/embed/${id}`;
 }
 if(['vimeo.com','www.vimeo.com','player.vimeo.com'].includes(host)){
  const match=(host==='player.vimeo.com'?/^\/video\/([1-9]\d{0,11})\/?$/:/^\/([1-9]\d{0,11})(?:\/([a-f0-9]{10,64}))?\/?$/i).exec(url.pathname);if(!match||url.searchParams.getAll('h').length>1)throw new VideoEmbedError();
  const privacy=url.searchParams.get('h')??match[2];if(privacy&&!/^[a-f0-9]{10,64}$/i.test(privacy))throw new VideoEmbedError();
  return `https://player.vimeo.com/video/${match[1]}${privacy?`?h=${privacy}`:''}`;
 }
 throw new VideoEmbedError();
}
