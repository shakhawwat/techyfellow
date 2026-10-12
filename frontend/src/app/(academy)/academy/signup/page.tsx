import { AcademyAuthForm } from '@/components/academy/academy-auth-form';
export const metadata={title:'Academy signup | Techyfellow',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{returnTo?:string}>}){const value=(await searchParams).returnTo;const returnTo=typeof value==='string'&&(value==='/academy/cart'||value==='/academy/my-learning'||/^\/academy\/courses\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/order)?$/.test(value))?value:'/academy';return <AcademyAuthForm signup returnTo={returnTo}/>;}
