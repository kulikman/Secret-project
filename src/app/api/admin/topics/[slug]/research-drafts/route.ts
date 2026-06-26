import { NextResponse, type NextRequest } from "next/server";

import {
  createDossierDraftFromLiveResearch,
  liveResearchDraftInputSchema,
} from "@/features/ai-content";
import { getPublishedTopicBySlug } from "@/features/knowledge";
import { AI_CONTENT_EDITOR_ROLES, assertAdminRole, getUserAdminRole } from "@/lib/admin-auth";
import { apiError, apiOk, apiUnauthorized, createApiRequestContext } from "@/lib/api-response";
import { getApiUser } from "@/lib/api-auth";
import { writeAuditLog } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const apiContext = createApiRequestContext(request);
  const user = await getApiUser();

  if (!user) {
    return apiUnauthorized("Authentication required", apiContext);
  }

  try {
    const role = await getUserAdminRole(user.id);
    assertAdminRole(role, AI_CONTENT_EDITOR_ROLES);
  } catch {
    return apiError("Admin editor role required", { status: 403 }, apiContext);
  }

  const { slug } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", { status: 400 }, apiContext);
  }

  const parsed = liveResearchDraftInputSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid research draft payload", { status: 422 }, apiContext);
  }

  try {
    const topic = await getPublishedTopicBySlug(slug);
    if (!topic) return apiError("Topic not found", { status: 404 }, apiContext);

    const draft = createDossierDraftFromLiveResearch({
      createdBy: user.id,
      research: parsed.data,
      title: topic.title,
      topicNodeId: topic.brain_node_id,
    });

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("dossiers")
      .insert(draft)
      .select("id,status,topic_node_id,created_at")
      .single();

    if (error) {
      return apiError("Could not save research draft", { status: 500 }, apiContext);
    }

    await writeAuditLog({
      action: "admin.dossier_draft_created",
      metadata: {
        provider: parsed.data.provider,
        sourceCount:
          draft.source_refs && Array.isArray(draft.source_refs) ? draft.source_refs.length : 0,
        topicTitle: topic.title,
      },
      resource: `dossier:${data.id}`,
      userId: user.id,
    });

    return apiOk({ draft: data }, { status: 201 }, apiContext);
  } catch {
    return apiError("Could not save research draft", { status: 500 }, apiContext);
  }
}
