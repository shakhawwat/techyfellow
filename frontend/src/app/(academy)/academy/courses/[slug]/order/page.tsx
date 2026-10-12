import {AcademyOrderSummary} from '@/components/academy/academy-order-summary';
export const metadata={title:'Course order | Techyfellow Academy',robots:{index:false,follow:false}};
export default async function Page({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{order?:string}>}){const {slug}=await params,{order}=await searchParams;return <AcademyOrderSummary courseId={slug} orderId={typeof order==='string'&&/^[a-f0-9]{24}$/.test(order)?order:undefined}/>;}
