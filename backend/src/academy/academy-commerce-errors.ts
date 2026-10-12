import {VideoEmbedError} from './academy-video';
import { ArgumentsHost, BadRequestException, Catch, HttpException, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
const messages = {
    PROMO_INVALID:'This code is invalid.', PROMO_INACTIVE:'This code is inactive or revoked.', PROMO_EXPIRED:'This code has expired.',
    PROMO_NOT_STARTED:'This code is not active yet.', PROMO_INELIGIBLE:'This code is not eligible for this course or account.',
    PROMO_MINIMUM:'The course price does not meet this code’s minimum spend.', PROMO_EXHAUSTED:'This code has reached its usage limit or its remaining uses are reserved.',
    PROMO_ACCOUNT_LIMIT:'This account has reached the code’s usage limit.', PROMO_VERIFY_EMAIL:'Verify your email to use this recipient-restricted code.'
} as const;
export class PromoError extends BadRequestException {
    constructor(readonly code:keyof typeof messages){super(messages[code]);}
}
export class CartCourseError extends HttpException {
    readonly code:string;
    constructor(readonly courseSlug:string,error:HttpException){const status=error.getStatus(),message=error instanceof PromoError?messages[error.code]:({400:'Invalid course configuration.',403:'Course enrollment is not permitted.',404:'This course is unavailable.',409:'This course is already enrolled, changed or no longer in your cart.',503:'Course access is unavailable.'} as Record<number,string>)[status]??'The course could not be confirmed.';super(message,status);this.code=error instanceof PromoError?error.code:`HTTP_${status}`;}
}
@Catch()
export class AcademyCommerceFilter implements ExceptionFilter {
    catch(error:unknown,host:ArgumentsHost){const response=host.switchToHttp().getResponse<Response>();response.setHeader('Cache-Control','no-store');
        if(error instanceof VideoEmbedError){response.status(400).json({error:{code:'INVALID_VIDEO_EMBED',message:error.message}});return;}
        if(error instanceof CartCourseError){response.status(error.getStatus()).json({error:{code:error.code,message:error.message,courseSlug:error.courseSlug}});return;}
        if(error instanceof PromoError){response.status(400).json({error:{code:error.code,message:messages[error.code]}});return;}
        const status=error instanceof HttpException?error.getStatus():500;
        const safe:Record<number,string>={400:'Invalid request parameters.',401:'Sign in to continue.',403:'Access denied.',404:'Course or order not found.',409:'The course, code or order changed. Reload before trying again.',429:'Too many requests.',503:'Paid checkout is blocked: no payment provider is configured.',500:'The request could not be confirmed.'};
        response.status(safe[status]?status:500).json({error:{code:`HTTP_${status}`,message:safe[status]??safe[500]}});
    }
}
