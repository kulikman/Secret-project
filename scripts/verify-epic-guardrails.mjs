#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readText(path) {
  return readFileSync(join(root, path), "utf8");
}

function walk(dir) {
  const absolute = join(root, dir);
  if (!existsSync(absolute)) return [];

  return readdirSync(absolute).flatMap((entry) => {
    const path = join(dir, entry);
    const absolutePath = join(root, path);
    const stat = statSync(absolutePath);
    return stat.isDirectory() ? walk(path) : [path];
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const packageJson = JSON.parse(readText("package.json"));
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

assert(
  !dependencies["@elaurion/brain-sdk"],
  "@elaurion/brain-sdk must not be added until its app contract is approved."
);

const publicPortalFiles = [
  ...walk("src/app/topics"),
  ...walk("src/app/sources"),
  ...walk("src/app/api/topics"),
  ...walk("src/app/api/sources"),
].filter((path) => /\.(ts|tsx)$/.test(path));

for (const file of publicPortalFiles) {
  const text = readText(file);
  assert(
    !text.includes("@/lib/brain"),
    `${file} imports Brain code; public portal must read App DB projection only.`
  );
  assert(
    !text.includes("BRAIN_API_KEY"),
    `${file} references BRAIN_API_KEY; public portal must not read Brain secrets.`
  );
}

const sourceFirst = readText("src/features/ai-content/lib/source-first.ts");
assert(
  sourceFirst.includes("source_refs"),
  "AI content source-first validator is missing source_refs checks."
);

const projectionMigration = readText("supabase/migrations/0009_secret_bureau_node_projection.sql");
assert(
  projectionMigration.includes("alter table public.node_projection enable row level security"),
  "node_projection migration must enable RLS."
);
assert(
  projectionMigration.includes(
    "grant select on table public.node_projection to anon, authenticated"
  ),
  "node_projection migration must explicitly grant Data API read access."
);

console.log("Epic guardrails passed.");
