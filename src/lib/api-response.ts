import { NextResponse } from "next/server";
import type { ZodError } from "zod";

type JsonInit = Parameters<typeof NextResponse.json>[1];

export interface ApiOkEnvelope<TData> {
  ok: true;
  data: TData;
}

export interface ApiEmptyOkEnvelope {
  ok: true;
}

export interface ApiErrorEnvelope {
  ok: false;
  error: string;
  issues?: string[];
}

export function apiOk<TData>(data: TData, init?: JsonInit): NextResponse<ApiOkEnvelope<TData>> {
  return NextResponse.json({ ok: true, data }, init);
}

export function apiOkEmpty(init?: JsonInit): NextResponse<ApiEmptyOkEnvelope> {
  return NextResponse.json({ ok: true }, init);
}

export function apiError(
  error: string,
  init: JsonInit = { status: 400 }
): NextResponse<ApiErrorEnvelope> {
  return NextResponse.json({ ok: false, error }, init);
}

export function apiUnauthorized(error = "Unauthorized"): NextResponse<ApiErrorEnvelope> {
  return apiError(error, { status: 401 });
}

export function apiValidationError(
  error: ZodError | string,
  init: JsonInit = { status: 422 }
): NextResponse<ApiErrorEnvelope> {
  if (typeof error === "string") {
    return apiError(error, init);
  }

  const issues = error.issues.map((issue) => issue.message);

  return NextResponse.json(
    {
      ok: false,
      error: issues[0] ?? "Invalid request",
      issues,
    },
    init
  );
}
