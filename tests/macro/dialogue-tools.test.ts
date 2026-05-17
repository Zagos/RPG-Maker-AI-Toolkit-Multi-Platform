import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleDialogueTools } from "../../src/macro/handlers/dialogue-tools.js";
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

describe("handleDialogueTools", () => {
  it("returns error for unknown action", async () => {
    const ctx = makeCtx({ action: "nope", data: {} });
    const result = JSON.parse(await handleDialogueTools(ctx));
    expect(result.error).toMatch(/unknown dialogue-tools action/i);
  });

  it("returns error when handler not found", async () => {
    mockResolveHandler.mockReturnValue(undefined);
    const ctx = makeCtx({ action: "add", data: { dialogue_lines: [] } });
    const result = JSON.parse(await handleDialogueTools(ctx));
    expect(result.error).toMatch(/internal handler not found/i);
  });

  describe("action routing", () => {
    it.each([
      ["add", "add-dialogue"],
      ["create-advanced", "create-dialogue-advanced"],
      ["generate-story", "story-generator"],
      ["export", "export-dialogue"],
      ["import", "import-dialogue"],
    ])("routes %s → %s", async (action, toolName) => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const data = { dialogue_lines: [{ text: "Hello" }] };
      const ctx = makeCtx({ action, data });
      await handleDialogueTools(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith(toolName, "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: data }));
    });
  });

  it("passes data directly as child input", async () => {
    const handler = makeHandler(JSON.stringify({ success: true }));
    mockResolveHandler.mockReturnValue(handler);
    const data = { dialogue_lines: [{ speaker: "Hero", text: "Hello!" }], event_name: "Intro" };
    const ctx = makeCtx({ action: "add", data });
    await handleDialogueTools(ctx);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: data }));
  });

  it("defaults data to empty object when omitted", async () => {
    const handler = makeHandler(JSON.stringify({ success: true }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "export" });
    await handleDialogueTools(ctx);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: {} }));
  });

  it("passes engine to resolveHandler", async () => {
    const handler = makeHandler(JSON.stringify({ success: true }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "add", data: { dialogue_lines: [] } }, "vxace");
    await handleDialogueTools(ctx);
    expect(mockResolveHandler).toHaveBeenCalledWith("add-dialogue", "vxace");
  });
});
