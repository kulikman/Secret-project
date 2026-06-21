import { describe, expect, it } from "vitest";

import {
  graphRelationTypeSchema,
  graphRelationTypes,
  normalizeGraphRelationType,
} from "./graph-relations";

describe("graph relation vocabulary", () => {
  it("matches the Awakening Map minimum relation contract", () => {
    expect(graphRelationTypes).toEqual([
      "related_to",
      "supported_by",
      "disputed_by",
      "mentions",
      "authored_by",
      "participated_in",
      "occurred_at",
      "belongs_to",
      "derived_from",
      "contradicts",
      "expands",
    ]);
    expect(graphRelationTypeSchema.parse("supported_by")).toBe("supported_by");
  });

  it("normalizes legacy free-text relations to a safe fallback", () => {
    expect(normalizeGraphRelationType("neighbor")).toBe("related_to");
    expect(normalizeGraphRelationType("neighbor", "mentions")).toBe("mentions");
  });
});
