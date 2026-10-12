import { ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { AcademyOrder } from './academy.schemas';
export interface VerifiedPayment { eventId:string;orderId:string;reference:string;currency:'BDT';amountMinor:number;status:'pending'|'paid'|'failed'|'cancelled' }
@Injectable()
export class AcademyPaymentGateway {
    // No provider exists in this checkout. A future configured adapter must verify server-side before sealing an event.
    readonly available:boolean=false;
    private readonly verified=new WeakSet<object>();
    async begin(_order:AcademyOrder & {id:string}):Promise<{reference:string;checkoutUrl:string}> {void _order;throw new ServiceUnavailableException();}
    async verifyOrder(_order:AcademyOrder & {id:string}):Promise<VerifiedPayment> {void _order;throw new ServiceUnavailableException();}
    protected seal(event:VerifiedPayment):VerifiedPayment {
        if(!/^[a-zA-Z0-9_-]{1,160}$/.test(event.eventId)||!/^[a-f0-9]{24}$/.test(event.orderId)||!event.reference||event.reference.length>160||event.currency!=='BDT'||!Number.isSafeInteger(event.amountMinor)||event.amountMinor<0||!['pending','paid','failed','cancelled'].includes(event.status))throw new ForbiddenException();
        const result=Object.freeze({...event});this.verified.add(result);return result;
    }
    assertVerified(event:VerifiedPayment){if(!this.verified.has(event))throw new ForbiddenException();}
}
