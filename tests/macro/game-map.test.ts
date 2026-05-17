import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGameMap } from "../../src/macro/handlers/game-map.js";
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

describe("handleGameMap", () => {
  it("returns error for unknown action", async () => {
    const ctx = makeCtx({ action: "nope", data: {} });
    const result = JSON.parse(await handleGameMap(ctx));
    expect(result.error).toMatch(/unknown game-map action/i);
  });

  it("returns error when handler not found", async () => {
    mockResolveHandler.mockReturnValue(undefined);
    const ctx = makeCtx({ action: "create", data: { name: "Town" } });
    const result = JSON.parse(await handleGameMap(ctx));
    expect(result.error).toMatch(/internal handler not found/i);
  });

  describe("action routing", () => {
    it.each([
      ["create", "create-map"],
      ["edit", "edit-map"],
      ["delete", "delete-map"],
      ["copy", "copy-map"],
      ["edit-info", "edit-map-info"],
      ["read-tiles", "read-map-tiles"],
      ["paint-tiles", "paint-map-tiles"],
      ["fill", "fill-map-region"],
      ["paint-region", "paint-map-region"],
      ["create-event", "create-map-event"],
      ["edit-event", "edit-map-event"],
      ["delete-event", "delete-map-event"],
      ["edit-event-page", "edit-event-page"],
      ["edit-troop-events", "edit-troop-events"],
      ["create-tileset", "create-tileset"],
      ["edit-tileset", "edit-tileset"],
      ["edit-tileset-properties", "edit-tileset-properties"],
    ])("routes %s → %s", async (action, toolName) => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const data = { map_id: 1 };
      const ctx = makeCtx({ action, data });
      await handleGameMap(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith(toolName, "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: data }));
    });
  });

  it("passes data directly as child input", async () => {
    const handler = makeHandler(JSON.stringify({ success: true }));
    mockResolveHandler.mockReturnValue(handler);
    const data = { name: "Forest", width: 20, height: 15, tileset_id: 2 };
    const ctx = makeCtx({ action: "create", data });
    await handleGameMap(ctx);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: data }));
  });

  it("defaults data to empty object when omitted", async () => {
    const handler = makeHandler(JSON.stringify({ success: true }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "create" });
    await handleGameMap(ctx);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: {} }));
  });

  it("passes engine to resolveHandler", async () => {
    const handler = makeHandler(JSON.stringify({ success: true }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "create", data: { name: "Town" } }, "vxace");
    await handleGameMap(ctx);
    expect(mockResolveHandler).toHaveBeenCalledWith("create-map", "vxace");
  });
});
