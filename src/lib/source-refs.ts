import { z } from "zod";

export const sourceRefSchema = z
  .object({
    nodeId: z.string().min(1),
    title: z.string().min(1).optional(),
    url: z.string().url().optional(),
  })
  .catchall(z.unknown());

export type SourceRef = z.infer<typeof sourceRefSchema>;
