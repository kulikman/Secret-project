import { NextResponse, type NextRequest } from "next/server";

import { listPublishedTopics } from "@/features/knowledge";
import { paginationSchema } from "@/lib/validations";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const parsed = paginationSchema.safeParse({
    page: request.nextUrl.searchParams.get("page") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid pagination params" }, { status: 422 });
  }

  try {
    const data = await listPublishedTopics(parsed.data);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load topics" }, { status: 500 });
  }
}
