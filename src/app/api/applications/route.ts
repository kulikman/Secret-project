import { NextResponse, type NextRequest } from "next/server";

import { createApplicationInsert, publicApplicationSchema } from "@/features/community";
import {
  apiError,
  apiOkEmpty,
  apiValidationError,
  createApiRequestContext,
} from "@/lib/api-response";
import { limit } from "@/lib/rate-limit";
import { getClientIpFromHeaders } from "@/lib/request-ip";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const APPLICATION_RATE_LIMIT = {
  limit: 5,
  windowMs: 60 * 60 * 1000,
} as const;

async function hasDuplicateApplication(input: {
  cityId?: string;
  email: string;
  eventId?: string;
}): Promise<boolean> {
  const supabase = createAdminClient();
  const email = input.email.toLowerCase();

  let query = supabase.from("applications").select("id").eq("email", email);
  query = input.cityId ? query.eq("city_id", input.cityId) : query.is("city_id", null);
  query = input.eventId ? query.eq("event_id", input.eventId) : query.is("event_id", null);

  const { data, error } = await query.limit(1);

  if (error) {
    throw error;
  }

  return (data?.length ?? 0) > 0;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiContext = createApiRequestContext(request);
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", { status: 400 }, apiContext);
  }

  const parsed = publicApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError("Invalid application payload", { status: 422 }, apiContext);
  }

  const clientIp = getClientIpFromHeaders(request.headers);
  const emailKey = parsed.data.email.toLowerCase();
  const rate = await limit(`applications:${clientIp}:${emailKey}`, APPLICATION_RATE_LIMIT);

  if (!rate.success) {
    return apiError(
      "Too many application attempts",
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(Math.max(0, rate.reset - Date.now()) / 1000)),
        },
      },
      apiContext
    );
  }

  try {
    const duplicate = await hasDuplicateApplication(parsed.data);

    if (duplicate) {
      // Keep the response indistinguishable from a fresh submission to avoid email enumeration.
      return apiOkEmpty({ status: 201 }, apiContext);
    }
  } catch {
    return apiError("Could not submit application", { status: 500 }, apiContext);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("applications")
    .insert(createApplicationInsert(parsed.data, user?.id));

  if (error) {
    return apiError("Could not submit application", { status: 500 }, apiContext);
  }

  return apiOkEmpty({ status: 201 }, apiContext);
}
