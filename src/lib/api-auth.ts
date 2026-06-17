import "server-only";

import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * API-route auth helper.
 *
 * Unlike `requireUser()`, this never redirects. Route Handlers should return JSON 401
 * so API consumers do not receive an HTML/login redirect.
 */
export async function getApiUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
