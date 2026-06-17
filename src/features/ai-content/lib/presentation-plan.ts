import { z } from "zod";

export const presentationPageCountSchema = z.number().int().min(20).max(25).default(20);

export const presentationGenerationPlanSchema = z.object({
  topicNodeId: z.string().min(1),
  title: z.string().trim().min(1).max(220),
  pageCount: presentationPageCountSchema,
  promptTemplateVersion: z.number().int().positive().optional(),
  textProvider: z.string().trim().min(1).max(80).default("anthropic_claude"),
  textModel: z.string().trim().min(1).max(120).optional(),
  visualProvider: z.string().trim().min(1).max(80).default("visual_ai_pending"),
  visualModel: z.string().trim().min(1).max(120).optional(),
});

export type PresentationGenerationPlanInput = z.input<typeof presentationGenerationPlanSchema>;
export type PresentationGenerationPlan = z.infer<typeof presentationGenerationPlanSchema>;

export interface PresentationJobInput {
  job_type: "presentation_text_generation" | "presentation_visual_generation";
  topic_node_id: string;
  provider: string;
  model: string | null;
  input: {
    cache_key: string;
    page_count: number;
    prompt_template_version: number | null;
    title: string;
  };
}

function keyPart(value: string | number): string {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizePresentationGenerationPlan(
  input: PresentationGenerationPlanInput
): PresentationGenerationPlan {
  return presentationGenerationPlanSchema.parse(input);
}

export function createPresentationCacheKey(input: PresentationGenerationPlanInput): string {
  const plan = normalizePresentationGenerationPlan(input);
  const promptVersion = plan.promptTemplateVersion
    ? `prompt-v${plan.promptTemplateVersion}`
    : "prompt-active";

  return [
    "presentation_pdf",
    keyPart(plan.topicNodeId),
    keyPart(promptVersion),
    `pages-${plan.pageCount}`,
    `text-${keyPart(plan.textProvider)}`,
    `visual-${keyPart(plan.visualProvider)}`,
  ].join(":");
}

export function createPresentationJobInputs(
  input: PresentationGenerationPlanInput
): PresentationJobInput[] {
  const plan = normalizePresentationGenerationPlan(input);
  const cacheKey = createPresentationCacheKey(plan);
  const sharedInput = {
    cache_key: cacheKey,
    page_count: plan.pageCount,
    prompt_template_version: plan.promptTemplateVersion ?? null,
    title: plan.title,
  };

  return [
    {
      job_type: "presentation_text_generation",
      topic_node_id: plan.topicNodeId,
      provider: plan.textProvider,
      model: plan.textModel ?? null,
      input: sharedInput,
    },
    {
      job_type: "presentation_visual_generation",
      topic_node_id: plan.topicNodeId,
      provider: plan.visualProvider,
      model: plan.visualModel ?? null,
      input: sharedInput,
    },
  ];
}
