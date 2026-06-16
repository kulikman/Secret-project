import { NextResponse, type NextRequest } from "next/server";

import { createApplicationInsert, publicApplicationSchema } from "@/features/community";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = publicApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid application payload" }, { status: 422 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("applications")
    .insert(createApplicationInsert(parsed.data, user?.id));

  if (error) {
    return NextResponse.json({ ok: false, error: "Could not submit application" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
