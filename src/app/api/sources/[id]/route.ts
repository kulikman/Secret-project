import { NextResponse, type NextRequest } from "next/server";

import { getPublishedSourceById } from "@/features/knowledge";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ ok: false, error: "Source id is required" }, { status: 422 });
  }

  try {
    const source = await getPublishedSourceById(id);

    if (!source) {
      return NextResponse.json({ ok: false, error: "Source not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: { source } });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load source" }, { status: 500 });
  }
}
