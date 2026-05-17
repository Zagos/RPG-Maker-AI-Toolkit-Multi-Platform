import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleProjectTools } from "../../src/macro/handlers/project-tools.js";
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

describe("handleProjectTools", () => {
  it("returns error for unknown action", async () => {
    const ctx = makeCtx({ action: "nope", data: {} });
    const result = JSON.parse(await handleProjectTools(ctx));
    expect(result.error).toMatch(/unknown project-tools action/i);
  });

  it("returns error when handler not found", async () => {
    mockResolveHandler.mockReturnValue(undefined);
    const ctx = makeCtx({ action: "validate", data: {} });
    const result = JSON.parse(await handleProjectTools(ctx));
    expect(result.error).toMatch(/internal handler not found/i);
  });

  describe("action routing", () => {
    it.each([
      ["validate", "validate-project"],
      ["cleanup", "cleanup-project"],
      ["find-replace", "find-and-replace"],
      ["batch-update", "batch-update-entities"],
      ["batch-create", "batch-create-entities"],
      ["batch-delete", "batch-delete-entities"],
      ["history", "get-change-history"],
    ])("routes %s → %s", async (action, toolName) => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const data = { entity_type: "Actor" };
      const ctx = makeCtx({ action, data });
      await handleProjectTools(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith(toolName, "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: data }));
    });
  });

  it("defaults data to empty object when omitted", async () => {
    const handler = makeHandler(JSON.stringify({ success: true }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "validate" });
    await handleProjectTools(ctx);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: {} }));
  });

  it("passes engine to resolveHandler", async () => {
    const handler = makeHandler(JSON.stringify({ success: true }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "validate", data: {} }, "vxace");
    await handleProjectTools(ctx);
    expect(mockResolveHandler).toHaveBeenCalledWith("validate-project", "vxace");
  });
});
