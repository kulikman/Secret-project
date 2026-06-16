import "server-only";

import {
  BrainArchiveAdapter,
  ArchiveEdge,
  ArchiveEdgeCreateInput,
  ArchiveGraph,
  ArchiveGraphSubsetInput,
  ArchiveIngestInput,
  ArchiveIngestJob,
  ArchiveIntersection,
  ArchiveIntersectionsInput,
  ArchiveMergeInput,
  ArchiveMergeResult,
  ArchiveNeighborsInput,
  ArchiveNode,
  ArchiveNodeCreateInput,
  ArchiveNodePatch,
  ArchiveRenderedContext,
  ArchiveRenderedContextInput,
  ArchiveSearchInput,
  ArchiveSearchResult,
  BrainNodeStatus,
} from "./types";
import { BrainProjectClient, createBrainHttpClient } from "./client";
import { brainCapabilityNotImplemented } from "./errors";

export function createBrainArchiveAdapter(
  client: BrainProjectClient = createBrainHttpClient()
): BrainArchiveAdapter {
  return {
    async createNode(input: ArchiveNodeCreateInput): Promise<ArchiveNode> {
      return client.projectRequest<ArchiveNode>("/nodes", {
        method: "POST",
        body: JSON.stringify({
          label: input.label,
          category: input.nodeType,
          type: input.brainType ?? "emergent",
          summary: input.summary,
        }),
      });
    },

    async updateNode(_nodeId: string, _patch: ArchiveNodePatch): Promise<ArchiveNode> {
      throw brainCapabilityNotImplemented(
        "updateNode",
        "Local Brain C2 adds a node patch contract, but this app adapter is not wired to the deployed/released contract yet."
      );
    },

    async createEdge(_input: ArchiveEdgeCreateInput): Promise<ArchiveEdge> {
      throw brainCapabilityNotImplemented(
        "createEdge",
        "Local Brain C3 adds a public edge create contract, but this app adapter is not wired to the deployed/released contract yet."
      );
    },

    async getNode(_nodeId: string): Promise<ArchiveNode> {
      throw brainCapabilityNotImplemented(
        "getNode",
        "Local Brain C4 adds a direct single-node endpoint, but this app adapter is not wired to the deployed/released contract yet."
      );
    },

    async listNodes(status: BrainNodeStatus = "active"): Promise<ArchiveNode[]> {
      return client.projectRequest<ArchiveNode[]>(`/nodes?status=${encodeURIComponent(status)}`);
    },

    async getRenderedContext(input: ArchiveRenderedContextInput): Promise<ArchiveRenderedContext> {
      const params = new URLSearchParams({
        q: input.query,
        budget: String(input.tokenBudget ?? 4000),
        scope: input.scope ?? "project",
      });

      return client.projectRequest<ArchiveRenderedContext>(`/context?${params.toString()}`);
    },

    async semanticSearch(_input: ArchiveSearchInput): Promise<ArchiveSearchResult[]> {
      throw brainCapabilityNotImplemented(
        "semanticSearch",
        "Local Brain C5 adds structured semantic search, but this app adapter is not wired to the deployed/released contract yet."
      );
    },

    async getNeighbors(_input: ArchiveNeighborsInput): Promise<ArchiveGraph> {
      throw brainCapabilityNotImplemented(
        "getNeighbors",
        "Local Brain C6 adds bounded neighbors, but this app adapter is not wired to the deployed/released contract yet."
      );
    },

    async getIntersections(_input: ArchiveIntersectionsInput): Promise<ArchiveIntersection[]> {
      throw brainCapabilityNotImplemented(
        "getIntersections",
        "Local Brain C7 adds graph intersections, but this app adapter is not wired to the deployed/released contract yet."
      );
    },

    async mergeNodes(input: ArchiveMergeInput): Promise<ArchiveMergeResult> {
      for (const duplicateNodeId of input.duplicateNodeIds) {
        await client.projectRequest(`/nodes/${encodeURIComponent(duplicateNodeId)}/merge`, {
          method: "POST",
          body: JSON.stringify({ intoNodeId: input.primaryNodeId }),
        });
      }

      return {
        primaryNodeId: input.primaryNodeId,
        mergedNodeIds: input.duplicateNodeIds,
      };
    },

    async enqueueIngest(input: ArchiveIngestInput): Promise<ArchiveIngestJob> {
      if (input.profile) {
        throw brainCapabilityNotImplemented(
          "enqueueIngest(profile)",
          "Local Brain C9 adds profiled ingest, but this app adapter is not wired to pass the profile field to a deployed/released contract yet."
        );
      }

      return client.projectRequest<ArchiveIngestJob>("/ingest", {
        method: "POST",
        body: JSON.stringify({
          source: input.source,
          content: input.content,
          metadata: input.metadata,
        }),
      });
    },

    async getFullGraph(): Promise<ArchiveGraph> {
      return client.projectRequest<ArchiveGraph>("/graph");
    },

    async getGraphSubset(_input: ArchiveGraphSubsetInput): Promise<ArchiveGraph> {
      throw brainCapabilityNotImplemented(
        "getGraphSubset",
        "Local Brain C10 adds root/depth graph subsets, but this app adapter is not wired to the deployed/released contract yet."
      );
    },
  };
}
