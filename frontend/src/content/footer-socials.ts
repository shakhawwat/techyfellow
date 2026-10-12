/** Verified company destinations only. Leave unknown URLs empty; demo resources are not company accounts. */
export const footerSocialUrls={Facebook:'',LinkedIn:'',Instagram:'',YouTube:'',X:'',GitHub:'',TikTok:'',WhatsApp:''};
/** Optional supplied business number in international format (digits only). */
export const footerWhatsAppBusinessNumber:string='';
export type FooterPlatform=keyof typeof footerSocialUrls;
const hosts:Record<FooterPlatform,string[]>={Facebook:['facebook.com','www.facebook.com'],LinkedIn:['linkedin.com','www.linkedin.com'],Instagram:['instagram.com','www.instagram.com'],YouTube:['youtube.com','www.youtube.com','youtu.be'],X:['x.com','www.x.com','twitter.com','www.twitter.com'],GitHub:['github.com','www.github.com'],TikTok:['tiktok.com','www.tiktok.com'],WhatsApp:['wa.me','api.whatsapp.com','www.whatsapp.com','chat.whatsapp.com']};
export function validFooterSocialUrl(platform:FooterPlatform,value:string):string|null{
 if(!value.trim())return null;
 try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.port||!hosts[platform].includes(url.hostname)||url.pathname==='/')return null;
 if(platform==='WhatsApp'&&url.hostname==='wa.me'&&!/^\/[1-9]\d{7,14}\/?$/.test(url.pathname))return null;
 if(platform==='WhatsApp'&&url.hostname==='api.whatsapp.com'&&!/^[1-9]\d{7,14}$/.test(url.searchParams.get('phone')??''))return null;
 return url.href;}catch{return null;}
}
/** Generic platform homepages supplied for layout preview, never company accounts. */
export const footerSocialDemoLinks:Record<FooterPlatform,{url:string;demo:true}>={
 Facebook:{url:'https://www.facebook.com/',demo:true},
 LinkedIn:{url:'https://www.linkedin.com/',demo:true},
 Instagram:{url:'https://www.instagram.com/',demo:true},
 YouTube:{url:'https://www.youtube.com/',demo:true},
 X:{url:'https://x.com/',demo:true},
 GitHub:{url:'https://github.com/',demo:true},
 TikTok:{url:'https://www.tiktok.com/',demo:true},
 WhatsApp:{url:'https://www.whatsapp.com/',demo:true},
};
export function configuredFooterSocials(){return (Object.entries(footerSocialUrls) as [FooterPlatform,string][]).map(([platform,value])=>{
 const supplied=platform==='WhatsApp'&&!value&&/^[1-9]\d{7,14}$/.test(footerWhatsAppBusinessNumber)?`https://wa.me/${footerWhatsAppBusinessNumber}`:value;
 const href=validFooterSocialUrl(platform,supplied);
 return href?{platform,href,demo:false}:{platform,href:footerSocialDemoLinks[platform].url,demo:true};
});}
