import { describe, expect, it } from "vitest";
import { z } from "zod";

import { apiError, apiOk, apiOkEmpty, apiUnauthorized, apiValidationError } from "./api-response";

describe("api response helpers", () => {
  it("wraps success data in the standard envelope", async () => {
    const response = apiOk({ topics: [] }, { status: 201 });

    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { topics: [] },
    });
    expect(response.status).toBe(201);
  });

  it("supports empty success responses for public form submissions", async () => {
    const response = apiOkEmpty({ status: 201 });

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(201);
  });

  it("wraps errors in the standard envelope", async () => {
    const response = apiError("Nope", { status: 418 });

    await expect(response.json()).resolves.toEqual({ ok: false, error: "Nope" });
    expect(response.status).toBe(418);
  });

  it("normalizes unauthorized responses", async () => {
    const response = apiUnauthorized();

    await expect(response.json()).resolves.toEqual({ ok: false, error: "Unauthorized" });
    expect(response.status).toBe(401);
  });

  it("summarizes zod validation issues", async () => {
    const result = z.object({ slug: z.string().min(2) }).safeParse({ slug: "x" });
    if (result.success) throw new Error("Expected validation failure");

    const response = apiValidationError(result.error);

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: expect.any(String),
      issues: [expect.any(String)],
    });
    expect(response.status).toBe(422);
  });
});
