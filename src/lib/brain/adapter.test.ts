import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createBrainArchiveAdapter } from "./adapter";
import { BrainAdapterError } from "./errors";
import type { BrainProjectClient } from "./client";

function createMockClient() {
  return {
    projectRequest: vi.fn(),
  };
}

function asBrainProjectClient(client: ReturnType<typeof createMockClient>): BrainProjectClient {
  return client as unknown as BrainProjectClient;
}

describe("createBrainArchiveAdapter()", () => {
  it("wraps the existing Brain create-node endpoint with archive node names", async () => {
    const client = createMockClient();
    client.projectRequest.mockResolvedValueOnce({ id: "node-1" });
    const adapter = createBrainArchiveAdapter(asBrainProjectClient(client));

    await expect(
      adapter.createNode({
        label: "Гиперборея",
        nodeType: "topic",
        summary: "Архивная тема",
      })
    ).resolves.toEqual({ id: "node-1" });

    expect(client.projectRequest).toHaveBeenCalledWith("/nodes", {
      method: "POST",
      body: JSON.stringify({
        label: "Гиперборея",
        category: "topic",
        type: "emergent",
        summary: "Архивная тема",
      }),
    });
  });

  it("wraps existing list/context/graph endpoints", async () => {
    const client = createMockClient();
    client.projectRequest
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ context: "rendered", query: "q", scope: "project" })
      .mockResolvedValueOnce({ nodes: [], edges: [] });
    const adapter = createBrainArchiveAdapter(asBrainProjectClient(client));

    await expect(adapter.listNodes("pending")).resolves.toEqual([]);
    await expect(adapter.getRenderedContext({ query: "q" })).resolves.toEqual({
      context: "rendered",
      query: "q",
      scope: "project",
    });
    await expect(adapter.getFullGraph()).resolves.toEqual({ nodes: [], edges: [] });

    expect(client.projectRequest).toHaveBeenNthCalledWith(1, "/nodes?status=pending");
    expect(client.projectRequest).toHaveBeenNthCalledWith(
      2,
      "/context?q=q&budget=4000&scope=project"
    );
    expect(client.projectRequest).toHaveBeenNthCalledWith(3, "/graph");
  });

  it("loops duplicate ids through the existing single-merge endpoint", async () => {
    const client = createMockClient();
    client.projectRequest.mockResolvedValue(undefined);
    const adapter = createBrainArchiveAdapter(asBrainProjectClient(client));

    await expect(
      adapter.mergeNodes({
        primaryNodeId: "primary",
        duplicateNodeIds: ["dupe-1", "dupe-2"],
      })
    ).resolves.toEqual({
      primaryNodeId: "primary",
      mergedNodeIds: ["dupe-1", "dupe-2"],
    });

    expect(client.projectRequest).toHaveBeenNthCalledWith(1, "/nodes/dupe-1/merge", {
      method: "POST",
      body: JSON.stringify({ intoNodeId: "primary" }),
    });
    expect(client.projectRequest).toHaveBeenNthCalledWith(2, "/nodes/dupe-2/merge", {
      method: "POST",
      body: JSON.stringify({ intoNodeId: "primary" }),
    });
  });

  it("blocks Brain capabilities that are not wired into this app adapter yet", async () => {
    const client = createMockClient();
    const adapter = createBrainArchiveAdapter(asBrainProjectClient(client));

    await expect(adapter.updateNode("node-1", { summary: "updated" })).rejects.toMatchObject({
      code: "BRAIN_CAPABILITY_NOT_IMPLEMENTED",
    });
    await expect(adapter.getNode("node-1")).rejects.toBeInstanceOf(BrainAdapterError);
    await expect(adapter.semanticSearch({ query: "topic" })).rejects.toMatchObject({
      code: "BRAIN_CAPABILITY_NOT_IMPLEMENTED",
    });

    expect(client.projectRequest).not.toHaveBeenCalled();
  });

  it("blocks profiled ingest until local Brain C9 is deployed and wired", async () => {
    const client = createMockClient();
    const adapter = createBrainArchiveAdapter(asBrainProjectClient(client));

    await expect(
      adapter.enqueueIngest({
        source: "document",
        content: "source text",
        profile: "source_studies_archive",
      })
    ).rejects.toMatchObject({ code: "BRAIN_CAPABILITY_NOT_IMPLEMENTED" });

    expect(client.projectRequest).not.toHaveBeenCalled();
  });
});
