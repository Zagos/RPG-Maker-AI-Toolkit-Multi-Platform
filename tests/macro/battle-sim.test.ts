import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleBattleSim } from "../../src/macro/handlers/battle-sim.js";
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

describe("handleBattleSim", () => {
  it("returns error for unknown action", async () => {
    const ctx = makeCtx({ action: "nope", data: {} });
    const result = JSON.parse(await handleBattleSim(ctx));
    expect(result.error).toMatch(/unknown battle-sim action/i);
  });

  it("returns error when handler not found", async () => {
    mockResolveHandler.mockReturnValue(undefined);
    const ctx = makeCtx({ action: "encounter", data: {} });
    const result = JSON.parse(await handleBattleSim(ctx));
    expect(result.error).toMatch(/internal handler not found/i);
  });

  it("routes encounter → start-encounter", async () => {
    const handler = makeHandler(JSON.stringify({ log: [] }));
    mockResolveHandler.mockReturnValue(handler);
    const data = { troop_id: 1 };
    const ctx = makeCtx({ action: "encounter", data });
    await handleBattleSim(ctx);
    expect(mockResolveHandler).toHaveBeenCalledWith("start-encounter", "mz");
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: data }));
  });

  it("routes suite → run-battle-suite", async () => {
    const handler = makeHandler(JSON.stringify({ runs: [] }));
    mockResolveHandler.mockReturnValue(handler);
    const data = { troop_id: 2, runs: 10 };
    const ctx = makeCtx({ action: "suite", data });
    await handleBattleSim(ctx);
    expect(mockResolveHandler).toHaveBeenCalledWith("run-battle-suite", "mz");
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: data }));
  });

  it("defaults data to empty object when omitted", async () => {
    const handler = makeHandler(JSON.stringify({ log: [] }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "encounter" });
    await handleBattleSim(ctx);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: {} }));
  });

  it("passes engine to resolveHandler", async () => {
    const handler = makeHandler(JSON.stringify({ log: [] }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "encounter", data: {} }, "mv");
    await handleBattleSim(ctx);
    expect(mockResolveHandler).toHaveBeenCalledWith("start-encounter", "mv");
  });
});
