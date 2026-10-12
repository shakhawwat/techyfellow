import type { AcademyPricing } from './contracts';
export const unconfiguredPrice:AcademyPricing={currency:'BDT',state:'unconfigured',saleActive:false,discountPercent:0,paymentAvailable:false,stackingRule:'best-single-discount'};
export const formatAcademyMoney=(minor:number)=>`৳${new Intl.NumberFormat('en-BD',{minimumFractionDigits:minor%100?2:0,maximumFractionDigits:2}).format(minor/100)}`;
export function demoPricing(level?:string):AcademyPricing {
 const prices:Record<string,[number,number]>={beginner:[250000,149000],intermediate:[500000,299000],expert:[800000,499000]};
 const entry=prices[level?.toLowerCase()??''];
 if(!entry)return unconfiguredPrice;
 const [regularPriceMinor,currentPriceMinor]=entry;
 return {currency:'BDT',state:'paid',regularPriceMinor,currentPriceMinor,saleActive:true,discountPercent:Math.round((regularPriceMinor-currentPriceMinor)/regularPriceMinor*100),subtotalMinor:regularPriceMinor,discountMinor:regularPriceMinor-currentPriceMinor,finalMinor:currentPriceMinor,paymentAvailable:false,stackingRule:'best-single-discount'};
}
