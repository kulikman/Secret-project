import { NextResponse, type NextRequest } from "next/server";

import { getPublishedTopicBySlug } from "@/features/knowledge";

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { slug } = await context.params;

  if (!slug) {
    return NextResponse.json({ ok: false, error: "Topic slug is required" }, { status: 422 });
  }

  try {
    const topic = await getPublishedTopicBySlug(slug);

    if (!topic) {
      return NextResponse.json({ ok: false, error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: { topic } });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load topic" }, { status: 500 });
  }
}
