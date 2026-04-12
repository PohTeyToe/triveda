import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

/**
 * Structured application error with machine-readable code.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Standard error envelope shape.
 */
export interface ErrorEnvelope {
  error: string;
  code: string;
  requestId: string;
}

/**
 * Build the error JSON response from any error.
 */
function toErrorEnvelope(
  err: unknown,
  requestId: string,
): {
  status: ContentfulStatusCode;
  body: ErrorEnvelope;
} {
  if (err instanceof AppError) {
    return {
      status: err.statusCode as ContentfulStatusCode,
      body: {
        error: err.message,
        code: err.code,
        requestId,
      },
    };
  }

  if (err instanceof ZodError) {
    const firstMessage = err.issues[0]?.message ?? 'Validation error';
    return {
      status: 400,
      body: {
        error: firstMessage,
        code: 'VALIDATION_ERROR',
        requestId,
      },
    };
  }

  // Don't leak stack traces in production
  const isDev = process.env.NODE_ENV !== 'production';
  return {
    status: 500,
    body: {
      error: isDev && err instanceof Error ? err.message : 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId,
    },
  };
}

/**
 * Hono onError handler — catch-all for unhandled errors.
 */
export function errorHandler(err: Error, c: Context) {
  const requestId = (c.get('requestId') as string) ?? 'unknown';
  const { status, body } = toErrorEnvelope(err, requestId);

  if (status >= 500) {
    console.error(`[${requestId}] Unhandled error:`, err);
  }

  return c.json(body, status);
}
