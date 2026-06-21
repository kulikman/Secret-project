import { expect, test } from "@playwright/test";

test.describe("Awakening Map", () => {
  test("opens the canonical public map route", async ({ page }) => {
    await page.goto("/awakening-map");

    await expect(
      page.getByRole("heading", { name: /Карта, которая показывает не ответы, а связи/i })
    ).toBeVisible();
    await expect(page.getByPlaceholder(/Найти тему, источник, человека или хвост/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Атлас/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Оригинал/i })).toBeVisible();
  });

  test("keeps the legacy nested map route available", async ({ page }) => {
    await page.goto("/awakening/map");

    await expect(
      page.getByRole("heading", { name: /Карта, которая показывает не ответы, а связи/i })
    ).toBeVisible();
  });
});
