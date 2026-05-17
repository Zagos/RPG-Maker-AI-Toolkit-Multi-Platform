import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleQueryData } from "../../src/macro/handlers/query-data.js";
import type { HandlerContext } from "../../src/handlers/types.js";

vi.mock("../../src/core/resolve-handler.js", () => ({
  resolveHandler: vi.fn(),
}));

import { resolveHandler } from "../../src/core/resolve-handler.js";
const mockResolveHandler = vi.mocked(resolveHandler);

function makeCtx(input: Record<string, unknown>, engine = "mz"): HandlerContext {
  return {
    reader: {} as HandlerContext["reader"],
    writer: {} as HandlerContext["writer"],
    input,
    projectPath: "/fake/project",
    engine,
    debugBridge: {} as HandlerContext["debugBridge"],
    rubyBridge: {} as HandlerContext["rubyBridge"],
    changeLog: {} as HandlerContext["changeLog"],
    debug: false,
  };
}

function makeHandler(result: string) {
  return vi.fn().mockResolvedValue(result);
}

beforeEach(() => {
  mockResolveHandler.mockReset();
});

describe("handleQueryData", () => {
  it("returns error for unknown type", async () => {
    const ctx = makeCtx({ type: "unknown-type" });
    const result = JSON.parse(await handleQueryData(ctx));
    expect(result.error).toMatch(/unknown query-data type/i);
  });

  it("returns error when handler not found", async () => {
    mockResolveHandler.mockReturnValue(undefined);
    const ctx = makeCtx({ type: "summary" });
    const result = JSON.parse(await handleQueryData(ctx));
    expect(result.error).toMatch(/internal handler not found/i);
  });

  describe("list", () => {
    it("routes to list-game-data with data_type", async () => {
      const handler = makeHandler(JSON.stringify({ data: [] }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "list", data_type: "Actors" });
      await handleQueryData(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("list-game-data", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { data_type: "Actors" } }));
    });
  });

  describe("entity", () => {
    it("routes to read-entity mapping id → entity_id", async () => {
      const handler = makeHandler(JSON.stringify({ id: 3 }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "entity", entity_type: "Actor", id: 3 });
      await handleQueryData(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("read-entity", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { entity_type: "Actor", entity_id: 3 } }));
    });
  });

  describe("map", () => {
    it("routes to read-map mapping id → map_id", async () => {
      const handler = makeHandler(JSON.stringify({ mapId: 2 }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "map", id: 2, include_events: false });
      await handleQueryData(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("read-map", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { map_id: 2, include_events: false, include_encounters: undefined } }));
    });
  });

  describe("maps", () => {
    it("routes to list-maps with empty input", async () => {
      const handler = makeHandler(JSON.stringify({ maps: [] }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "maps" });
      await handleQueryData(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("list-maps", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: {} }));
    });
  });

  describe("resources", () => {
    it("routes to list-resources with category", async () => {
      const handler = makeHandler(JSON.stringify({ files: [] }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "resources", category: "bgm" });
      await handleQueryData(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("list-resources", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { category: "bgm" } }));
    });
  });

  describe("system", () => {
    it("routes to read-system-extended with section", async () => {
      const handler = makeHandler(JSON.stringify({ terms: {} }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "system", section: "terms" });
      await handleQueryData(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("read-system-extended", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { section: "terms" } }));
    });
  });

  describe("animation", () => {
    it("routes to read-animation mapping id → animation_id", async () => {
      const handler = makeHandler(JSON.stringify({ name: "Anim1" }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "animation", id: 5 });
      await handleQueryData(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("read-animation", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { animation_id: 5 } }));
    });

    it("passes animation_id=undefined when id omitted (lists all)", async () => {
      const handler = makeHandler(JSON.stringify([]));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "animation" });
      await handleQueryData(ctx);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { animation_id: undefined } }));
    });
  });

  describe("tileset", () => {
    it("routes to read-tileset with tileset_id and include_flags", async () => {
      const handler = makeHandler(JSON.stringify({ name: "Tileset1" }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "tileset", id: 1, include_flags: true });
      await handleQueryData(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("read-tileset", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { tileset_id: 1, include_flags: true } }));
    });
  });

  describe("search", () => {
    it("routes to search-entity with all search fields", async () => {
      const handler = makeHandler(JSON.stringify({ results: [] }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "search", entity_type: "Item", query: "potion", field: "name", limit: 10 });
      await handleQueryData(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("search-entity", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { entity_type: "Item", query: "potion", field: "name", limit: 10 } }));
    });
  });

  describe("summary", () => {
    it("routes to export-project-summary with empty input", async () => {
      const handler = makeHandler(JSON.stringify({ summary: {} }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "summary" });
      await handleQueryData(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("export-project-summary", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: {} }));
    });
  });

  describe("engine routing", () => {
    it("passes engine to resolveHandler", async () => {
      const handler = makeHandler(JSON.stringify({}));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "maps" }, "vxace");
      await handleQueryData(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("list-maps", "vxace");
    });
  });
});
