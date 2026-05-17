import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleRuntimeInspect } from "../../src/macro/handlers/runtime-inspect.js";
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

describe("handleRuntimeInspect", () => {
  it("returns error for unknown type", async () => {
    const ctx = makeCtx({ type: "nope" });
    const result = JSON.parse(await handleRuntimeInspect(ctx));
    expect(result.error).toMatch(/unknown runtime-inspect type/i);
  });

  it("returns error when handler not found", async () => {
    mockResolveHandler.mockReturnValue(undefined);
    const ctx = makeCtx({ type: "game-state" });
    const result = JSON.parse(await handleRuntimeInspect(ctx));
    expect(result.error).toMatch(/internal handler not found/i);
  });

  describe("game-state", () => {
    it("routes to get-game-state with empty input", async () => {
      const handler = makeHandler(JSON.stringify({ mapId: 1 }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "game-state" });
      await handleRuntimeInspect(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("get-game-state", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: {} }));
    });
  });

  describe("switch", () => {
    it("routes to get-switch with id", async () => {
      const handler = makeHandler(JSON.stringify({ value: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "switch", id: 3 });
      await handleRuntimeInspect(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("get-switch", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { id: 3 } }));
    });
  });

  describe("variable", () => {
    it("routes to get-variable with id", async () => {
      const handler = makeHandler(JSON.stringify({ value: 42 }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "variable", id: 5 });
      await handleRuntimeInspect(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("get-variable", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { id: 5 } }));
    });
  });

  describe("inventory", () => {
    it("routes to get-inventory with category", async () => {
      const handler = makeHandler(JSON.stringify({ items: [] }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "inventory", category: "items" });
      await handleRuntimeInspect(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("get-inventory", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { category: "items" } }));
    });

    it("passes undefined category when not provided (handler uses default)", async () => {
      const handler = makeHandler(JSON.stringify({ items: [] }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "inventory" });
      await handleRuntimeInspect(ctx);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { category: undefined } }));
    });
  });

  describe("actor", () => {
    it("routes to get-actor-runtime with actor_id", async () => {
      const handler = makeHandler(JSON.stringify({ hp: 100 }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "actor", actor_id: 2 });
      await handleRuntimeInspect(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("get-actor-runtime", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { actor_id: 2 } }));
    });
  });

  describe("party", () => {
    it("routes to manage-party-runtime with action=get", async () => {
      const handler = makeHandler(JSON.stringify({ members: [1, 2] }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "party" });
      await handleRuntimeInspect(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("manage-party-runtime", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { action: "get" } }));
    });
  });

  describe("map", () => {
    it("routes to get-map-state-runtime with empty input", async () => {
      const handler = makeHandler(JSON.stringify({ mapId: 3 }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "map" });
      await handleRuntimeInspect(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("get-map-state-runtime", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: {} }));
    });
  });

  describe("battle", () => {
    it("routes to get-battle-state-runtime with empty input", async () => {
      const handler = makeHandler(JSON.stringify({ inBattle: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "battle" });
      await handleRuntimeInspect(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("get-battle-state-runtime", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: {} }));
    });
  });

  describe("timer", () => {
    it("routes to control-timer-runtime with action=get", async () => {
      const handler = makeHandler(JSON.stringify({ frames: 120 }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "timer" });
      await handleRuntimeInspect(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("control-timer-runtime", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { action: "get" } }));
    });
  });

  describe("engine routing", () => {
    it("passes engine to resolveHandler so Ruby engines get Ruby handlers", async () => {
      const handler = makeHandler(JSON.stringify({ value: false }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ type: "switch", id: 1 }, "vxace");
      await handleRuntimeInspect(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("get-switch", "vxace");
    });
  });

  describe("child context isolation", () => {
    it("does not mutate the original ctx.input", async () => {
      const handler = makeHandler(JSON.stringify({ mapId: 1 }));
      mockResolveHandler.mockReturnValue(handler);
      const originalInput = { type: "map" };
      const ctx = makeCtx(originalInput);
      await handleRuntimeInspect(ctx);
      expect(ctx.input).toBe(originalInput);
    });
  });
});
