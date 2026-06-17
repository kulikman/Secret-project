import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  API_REQUEST_ID_HEADER,
  apiError,
  apiOk,
  apiOkEmpty,
  apiUnauthorized,
  apiValidationError,
  createApiRequestContext,
} from "./api-response";

const context = { requestId: "req_test_123" };

describe("api response helpers", () => {
  it("wraps success data in the standard envelope", async () => {
    const response = apiOk({ topics: [] }, { status: 201 }, context);

    await expect(response.json()).resolves.toEqual({
      ok: true,
      requestId: "req_test_123",
      data: { topics: [] },
    });
    expect(response.status).toBe(201);
    expect(response.headers.get(API_REQUEST_ID_HEADER)).toBe("req_test_123");
  });

  it("supports empty success responses for public form submissions", async () => {
    const response = apiOkEmpty({ status: 201 }, context);

    await expect(response.json()).resolves.toEqual({ ok: true, requestId: "req_test_123" });
    expect(response.status).toBe(201);
    expect(response.headers.get(API_REQUEST_ID_HEADER)).toBe("req_test_123");
  });

  it("wraps errors in the standard envelope", async () => {
    const response = apiError("Nope", { status: 418 }, context);

    await expect(response.json()).resolves.toEqual({
      ok: false,
      requestId: "req_test_123",
      error: "Nope",
    });
    expect(response.status).toBe(418);
    expect(response.headers.get(API_REQUEST_ID_HEADER)).toBe("req_test_123");
  });

  it("normalizes unauthorized responses", async () => {
    const response = apiUnauthorized("Unauthorized", context);

    await expect(response.json()).resolves.toEqual({
      ok: false,
      requestId: "req_test_123",
      error: "Unauthorized",
    });
    expect(response.status).toBe(401);
  });

  it("summarizes zod validation issues", async () => {
    const result = z.object({ slug: z.string().min(2) }).safeParse({ slug: "x" });
    if (result.success) throw new Error("Expected validation failure");

    const response = apiValidationError(result.error, { status: 422 }, context);

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      requestId: "req_test_123",
      error: expect.any(String),
      issues: [expect.any(String)],
    });
    expect(response.status).toBe(422);
  });

  it("uses a safe inbound request id when present", () => {
    const request = new Request("http://localhost/api/topics", {
      headers: { "x-request-id": "client-req_42" },
    });

    expect(createApiRequestContext(request)).toEqual({ requestId: "client-req_42" });
  });

  it("generates a request id when the inbound value is missing or unsafe", () => {
    const missing = createApiRequestContext(new Request("http://localhost/api/topics"));
    const unsafe = createApiRequestContext(
      new Request("http://localhost/api/topics", {
        headers: { "x-request-id": "bad id with spaces" },
      })
    );

    expect(missing.requestId).toEqual(expect.any(String));
    expect(unsafe.requestId).toEqual(expect.any(String));
    expect(unsafe.requestId).not.toBe("bad id with spaces");
  });
});
