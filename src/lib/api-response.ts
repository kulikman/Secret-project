import { NextResponse } from "next/server";
import type { ZodError } from "zod";

type JsonInit = Parameters<typeof NextResponse.json>[1];

export const API_REQUEST_ID_HEADER = "X-Request-Id";

export interface ApiRequestContext {
  requestId: string;
}

export interface ApiOkEnvelope<TData> {
  ok: true;
  requestId: string;
  data: TData;
}

export interface ApiEmptyOkEnvelope {
  ok: true;
  requestId: string;
}

export interface ApiErrorEnvelope {
  ok: false;
  requestId: string;
  error: string;
  issues?: string[];
}

function sanitizeRequestId(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length > 128) return null;

  return /^[a-zA-Z0-9:._/-]+$/.test(trimmed) ? trimmed : null;
}

export function createApiRequestContext(request: Request): ApiRequestContext {
  return {
    requestId: sanitizeRequestId(request.headers.get("x-request-id")) ?? crypto.randomUUID(),
  };
}

function getRequestId(context?: ApiRequestContext): string {
  return context?.requestId ?? crypto.randomUUID();
}

function withRequestIdHeader(init: JsonInit | undefined, requestId: string): JsonInit {
  const headers = new Headers(init?.headers);
  headers.set(API_REQUEST_ID_HEADER, requestId);

  return { ...init, headers };
}

export function apiOk<TData>(
  data: TData,
  init?: JsonInit,
  context?: ApiRequestContext
): NextResponse<ApiOkEnvelope<TData>> {
  const requestId = getRequestId(context);
  return NextResponse.json({ ok: true, requestId, data }, withRequestIdHeader(init, requestId));
}

export function apiOkEmpty(
  init?: JsonInit,
  context?: ApiRequestContext
): NextResponse<ApiEmptyOkEnvelope> {
  const requestId = getRequestId(context);
  return NextResponse.json({ ok: true, requestId }, withRequestIdHeader(init, requestId));
}

export function apiError(
  error: string,
  init: JsonInit = { status: 400 },
  context?: ApiRequestContext
): NextResponse<ApiErrorEnvelope> {
  const requestId = getRequestId(context);
  return NextResponse.json({ ok: false, requestId, error }, withRequestIdHeader(init, requestId));
}

export function apiUnauthorized(
  error = "Unauthorized",
  context?: ApiRequestContext
): NextResponse<ApiErrorEnvelope> {
  return apiError(error, { status: 401 }, context);
}

export function apiValidationError(
  error: ZodError | string,
  init: JsonInit = { status: 422 },
  context?: ApiRequestContext
): NextResponse<ApiErrorEnvelope> {
  if (typeof error === "string") {
    return apiError(error, init, context);
  }

  const issues = error.issues.map((issue) => issue.message);
  const requestId = getRequestId(context);

  return NextResponse.json(
    {
      ok: false,
      requestId,
      error: issues[0] ?? "Invalid request",
      issues,
    },
    withRequestIdHeader(init, requestId)
  );
}
