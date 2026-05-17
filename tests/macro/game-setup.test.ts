import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGameSetup } from "../../src/macro/handlers/game-setup.js";
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

describe("handleGameSetup", () => {
  it("returns error for unknown action", async () => {
    const ctx = makeCtx({ action: "nope" });
    const result = JSON.parse(await handleGameSetup(ctx));
    expect(result.error).toMatch(/unknown game-setup action/i);
  });

  it("returns error when handler not found", async () => {
    mockResolveHandler.mockReturnValue(undefined);
    const ctx = makeCtx({ action: "health-check" });
    const result = JSON.parse(await handleGameSetup(ctx));
    expect(result.error).toMatch(/internal handler not found/i);
  });

  it("routes health-check → health-check with empty input", async () => {
    const handler = makeHandler(JSON.stringify({ status: "ok" }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "health-check" });
    await handleGameSetup(ctx);
    expect(mockResolveHandler).toHaveBeenCalledWith("health-check", "mz");
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: {} }));
  });

  it("routes setup-debug → setup-debug-plugin with empty input", async () => {
    const handler = makeHandler(JSON.stringify({ success: true }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "setup-debug" });
    await handleGameSetup(ctx);
    expect(mockResolveHandler).toHaveBeenCalledWith("setup-debug-plugin", "mz");
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: {} }));
  });

  it("routes launch → launch-game passing data", async () => {
    const handler = makeHandler(JSON.stringify({ launched: true }));
    mockResolveHandler.mockReturnValue(handler);
    const data = { game_path: "/games/mygame.exe" };
    const ctx = makeCtx({ action: "launch", data });
    await handleGameSetup(ctx);
    expect(mockResolveHandler).toHaveBeenCalledWith("launch-game", "mz");
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: data }));
  });

  it("passes empty data to launch when data is omitted", async () => {
    const handler = makeHandler(JSON.stringify({ launched: true }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "launch" });
    await handleGameSetup(ctx);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: {} }));
  });

  it("passes engine to resolveHandler", async () => {
    const handler = makeHandler(JSON.stringify({ status: "ok" }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "health-check" }, "vxace");
    await handleGameSetup(ctx);
    expect(mockResolveHandler).toHaveBeenCalledWith("health-check", "vxace");
  });
});
