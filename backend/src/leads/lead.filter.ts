import { ArgumentsHost, Catch, HttpException, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
@Catch()
export class LeadExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const requested = exception instanceof HttpException ? exception.getStatus() : 500;
    const errors: Record<number, { code: string; message: string }> = {
      400: { code: "BAD_REQUEST", message: "Invalid inquiry or request fields." }, 401: { code: "UNAUTHORIZED", message: "Authentication required." },
      403: { code: "FORBIDDEN", message: "Access denied." }, 404: { code: "NOT_FOUND", message: "Lead not found." },
      409: { code: "CONFLICT", message: "Idempotency key, revision or workflow state conflicts with the saved request." },
      413: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large." }, 429: { code: "TOO_MANY_REQUESTS", message: "Too many requests. Try again later." },
      503: { code: "SERVICE_UNAVAILABLE", message: "Inquiry management is temporarily unavailable." }, 500: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
    };
    const status = Object.hasOwn(errors, requested) ? requested : 500, detail = exception instanceof HttpException ? exception.getResponse() : undefined;
    const fields = status === 400 && detail && typeof detail === "object" && "fields" in detail && Array.isArray(detail.fields) ? detail.fields.filter((field: unknown) => typeof field === "string" && /^[a-zA-Z]+$/.test(field)) : [];
    const response = host.switchToHttp().getResponse<Response>(); response.setHeader("Cache-Control", "no-store"); if (status === 429) response.setHeader("Retry-After", "900");
    response.status(status).json({ error: { ...errors[status], ...(fields.length ? { fields } : {}) } });
  }
}
