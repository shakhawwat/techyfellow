import { ArgumentsHost, Catch, HttpException, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
@Catch()
export class MediaExceptionFilter implements ExceptionFilter {
  catch(error:unknown,host:ArgumentsHost):void{
    const status=error instanceof HttpException?error.getStatus():503;
    const messages:Record<number,string>={400:'Invalid image or metadata. Use a decodable single-frame JPEG, PNG or WebP within the configured limits.',401:'Authentication required.',403:'Access denied.',404:'Media not found.',409:'Media revision or state conflict.',413:'Image exceeds the configured upload size limit.',503:'Media storage is unavailable; configuration or an operation could not be confirmed.'};
    const code=Object.hasOwn(messages,status)?status:503,body=error instanceof HttpException?error.getResponse():undefined;
    const fields=body&&typeof body==='object'&&'fields'in body&&Array.isArray(body.fields)?body.fields.filter((f:unknown)=>typeof f==='string'&&/^[a-zA-Z]+(?:\.(?:\d+|[a-zA-Z]+))*$/.test(f)):undefined;
    const response=host.switchToHttp().getResponse<Response>();response.setHeader('Cache-Control','no-store');response.status(code).json({error:{code:`MEDIA_${code}`,message:messages[code],...(fields?.length?{fields}:{})}});
  }
}
