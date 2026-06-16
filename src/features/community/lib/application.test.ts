import { describe, expect, it } from "vitest";

import { createApplicationInsert, publicApplicationSchema } from "./application";

describe("publicApplicationSchema", () => {
  it("accepts a minimal public application", () => {
    expect(
      publicApplicationSchema.parse({
        fullName: "Иван Иванов",
        email: "ivan@example.com",
      })
    ).toEqual({
      fullName: "Иван Иванов",
      email: "ivan@example.com",
    });
  });

  it("rejects invalid email and ids before database insert", () => {
    expect(() =>
      publicApplicationSchema.parse({
        fullName: "Иван",
        email: "bad-email",
        cityId: "not-a-uuid",
      })
    ).toThrow();
  });
});

describe("createApplicationInsert()", () => {
  it("forces safe moderation defaults", () => {
    expect(
      createApplicationInsert(
        {
          fullName: "Иван Иванов",
          email: "ivan@example.com",
          motivation: "Хочу участвовать",
        },
        "user-1"
      )
    ).toMatchObject({
      user_id: "user-1",
      full_name: "Иван Иванов",
      email: "ivan@example.com",
      motivation: "Хочу участвовать",
      status: "new",
      reviewed_by: null,
      reviewed_at: null,
    });
  });
});
