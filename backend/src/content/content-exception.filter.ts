import { ArgumentsHost, Catch, HttpException, type ExceptionFilter } from "@nestjs/common";

@Catch()
export class ContentExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const requested = exception instanceof HttpException ? exception.getStatus() : 500;
    const status = [400, 404, 503].includes(requested) ? requested : 500;
    const errors: Record<number, { code: string; message: string }> = {
      400: { code: "BAD_REQUEST", message: "Invalid request parameters." },
      404: { code: "NOT_FOUND", message: "Content not found." },
      503: { code: "SERVICE_UNAVAILABLE", message: "Content is temporarily unavailable." },
      500: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
    };
    // No raw driver errors, URI details, request values or stack traces are logged/returned.
    const response = host.switchToHttp().getResponse<{ status(code: number): { json(body: unknown): void } }>();
    response.status(status).json({ error: errors[status] });
  }
}
