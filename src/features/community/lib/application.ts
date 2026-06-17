import { z } from "zod";

import { emailSchema } from "@/lib/validations";

export const publicApplicationSchema = z.object({
  cityId: z.string().uuid().optional(),
  email: emailSchema,
  eventId: z.string().uuid().optional(),
  fullName: z.string().min(2, "Full name is required").max(160),
  motivation: z.string().max(4000).optional(),
  selectedTopic: z.string().max(240).optional(),
  telegram: z.string().max(120).optional(),
});

export type PublicApplicationInput = z.infer<typeof publicApplicationSchema>;

export function createApplicationInsert(input: PublicApplicationInput, userId?: string | null) {
  return {
    user_id: userId ?? null,
    city_id: input.cityId ?? null,
    event_id: input.eventId ?? null,
    full_name: input.fullName,
    email: input.email.toLowerCase(),
    telegram: input.telegram ?? null,
    motivation: input.motivation ?? null,
    selected_topic: input.selectedTopic ?? null,
    status: "new",
    reviewed_by: null,
    reviewed_at: null,
  };
}
