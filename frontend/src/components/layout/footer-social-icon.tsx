import type {FooterPlatform} from '@/content/footer-socials';
// Local SVGs use the existing 24px outline vocabulary; GitHub/YouTube retain
// the brand glyphs already used by project-details, without importing a client popup.
export function FooterSocialIcon({platform}:{platform:FooterPlatform}){
 const shapes={
 Facebook:<path d="M14 22v-9h3l.5-4H14V6.5c0-1 .5-1.5 1.5-1.5H18V2h-3c-3 0-5 2-5 5v2H7v4h3v9"/>,
 LinkedIn:<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7m0-10h.01M11 17v-7m0 3c0-4 6-4 6 0v4"/></>,
 Instagram:<><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></>,
 YouTube:<><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></>,
 X:<><path d="m4 3 13 18h3L7 3zM20 3 4 21"/></>,
 GitHub:<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.77 5.07 5.07 0 0 0 18.91 1S17.73.65 15 2.48a13.38 13.38 0 0 0-7 0C5.27.65 4.09 1 4.09 1A5.07 5.07 0 0 0 4 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 8 18.13V22"/>,
 TikTok:<path d="M14 3h3c0 3 2 5 5 5v3c-2 0-4-.7-5-2v7a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3z"/>,
 WhatsApp:<><path d="M4 19 2 22l5-1a10 10 0 1 0-3-2Z"/><path d="m8 7-1 2c1 4 4 7 8 8l2-1-2-3-2 1-3-3 1-2z"/></>,
 };
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shapes[platform]}</svg>;
}
