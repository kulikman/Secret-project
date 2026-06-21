import { z } from "zod";

import { graphRelationTypeSchema } from "@/lib/graph-relations";

export const sourceRefSchema = z
  .object({
    nodeId: z.string().min(1),
    relation: graphRelationTypeSchema.optional(),
    title: z.string().min(1).optional(),
    url: z.string().url().optional(),
  })
  .catchall(z.unknown());

export type SourceRef = z.infer<typeof sourceRefSchema>;
