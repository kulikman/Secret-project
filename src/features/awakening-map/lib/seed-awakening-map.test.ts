import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const seedSql = readFileSync(join(process.cwd(), "supabase/seed-awakening-map.sql"), "utf8");

const requiredProjectionSlugs = [
  "ancient-aliens",
  "ancient-builder-race",
  "antarctica",
  "cabal",
  "crystals",
  "cymatics",
  "dark-fleet",
  "dmt",
  "free-energy",
  "galactic-federation",
  "great-awakening",
  "great-solar-flash",
  "inner-earth-civilizations",
  "law-of-one",
  "mars",
  "moon",
  "psychedelic-renaissance",
  "qanon",
  "rainbow-body",
  "return-to-source",
  "secret-space-program",
  "solar-warden",
  "super-federation",
  "vatican",
] as const;

describe("awakening map seed corpus", () => {
  it("contains a 20+ node projection corpus for the reference taxonomy", () => {
    const projectionIds = seedSql.match(/10000000-0000-4000-8000-\d{12}/g) ?? [];

    expect(new Set(projectionIds).size).toBeGreaterThanOrEqual(28);

    for (const slug of requiredProjectionSlugs) {
      expect(seedSql).toContain(`'${slug}'`);
    }
  });

  it("keeps source-first claim seed publishable", () => {
    expect(seedSql).toContain("'seed:claim:source-first'");
    expect(seedSql).toContain("'supported'");
    expect(seedSql).toContain(
      "jsonb_build_array(jsonb_build_object('nodeId', 'seed:source:tz-map', 'title', 'ТЗ интерактивной карты'))"
    );
  });
});
