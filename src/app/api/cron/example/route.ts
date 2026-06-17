import { NextResponse, type NextRequest } from "next/server";

import { apiOkEmpty, apiUnauthorized, createApiRequestContext } from "@/lib/api-response";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Example scheduled cron route.
 *
 * Hooked at: `/api/cron/example`
 * Excluded from `src/proxy.ts` matcher — we don't refresh Supabase
 * sessions for unauthenticated cron pings.
 *
 * Authorization: Vercel sends `Authorization: Bearer ${CRON_SECRET}` on
 * every cron-triggered request to a path declared in `vercel.ts` /
 * `vercel.json`. Set CRON_SECRET before enabling this route; without it,
 * the route returns 401.
 *
 * @see https://vercel.com/docs/cron-jobs/manage-cron-jobs
 *
 * Example vercel.ts entry:
 *   crons: [{ path: "/api/cron/example", schedule: "0 0 * * *" }]
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiContext = createApiRequestContext(request);
  const env = getServerEnv();
  const auth = request.headers.get("authorization");

  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    logger.warn("cron unauthorized", {
      hasSecret: !!env.CRON_SECRET,
      requestId: apiContext.requestId,
    });
    return apiUnauthorized("Unauthorized", apiContext);
  }

  // Replace with your scheduled work — sending digests, cleaning up
  // expired sessions, syncing 3rd-party data, etc.
  logger.info("cron tick", { requestId: apiContext.requestId, route: "example" });

  return apiOkEmpty(undefined, apiContext);
}
