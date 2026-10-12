import { ArgumentsHost, Catch, HttpException, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
@Catch()
export class AdminExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const requested = exception instanceof HttpException ? exception.getStatus() : 500;
    const errors: Record<number, { code: string; message: string }> = {
      400: { code: "BAD_REQUEST", message: "Invalid content or request fields." },
      401: { code: "UNAUTHORIZED", message: "Authentication required or invalid credentials." },
      403: { code: "FORBIDDEN", message: "Access denied." },
      404: { code: "NOT_FOUND", message: "Content not found." },
      409: { code: "CONFLICT", message: "Slug, revision or content state conflicts with the current record." },
      503: { code: "SERVICE_UNAVAILABLE", message: "Content management is temporarily unavailable." },
      500: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
    };
    const status = Object.hasOwn(errors, requested) ? requested : 500;
    const detail = exception instanceof HttpException ? exception.getResponse() : undefined;
    const fields = status === 400 && detail && typeof detail === "object" && "fields" in detail && Array.isArray(detail.fields)
      ? detail.fields.filter((field: unknown) => typeof field === "string" && /^[a-zA-Z]+(?:\.(?:\d+|[a-zA-Z]+))*$/.test(field)) : undefined;
    const response = host.switchToHttp().getResponse<Response>();
    response.setHeader("Cache-Control", "no-store");
    response.status(status).json({ error: { ...errors[status], ...(fields?.length ? { fields } : {}) } });
  }
}
