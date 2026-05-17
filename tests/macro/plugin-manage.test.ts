import { describe, it, expect, vi, beforeEach } from "vitest";
import { handlePluginManage } from "../../src/macro/handlers/plugin-manage.js";
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

describe("handlePluginManage", () => {
  it("returns error for unknown action", async () => {
    const ctx = makeCtx({ action: "nope", data: {} });
    const result = JSON.parse(await handlePluginManage(ctx));
    expect(result.error).toMatch(/unknown plugin-manage action/i);
  });

  it("returns error when handler not found", async () => {
    mockResolveHandler.mockReturnValue(undefined);
    const ctx = makeCtx({ action: "manage", data: { action: "list" } });
    const result = JSON.parse(await handlePluginManage(ctx));
    expect(result.error).toMatch(/internal handler not found/i);
  });

  describe("MZ/MV plugin actions", () => {
    it.each([
      ["create", "create-plugin"],
      ["create-advanced", "create-plugin-advanced"],
      ["manage", "manage-plugins"],
      ["edit-parameters", "edit-plugin-parameters"],
      ["reorder", "reorder-plugin"],
    ])("routes %s → %s on mz engine", async (action, toolName) => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const data = { plugin_name: "MyPlugin" };
      const ctx = makeCtx({ action, data });
      await handlePluginManage(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith(toolName, "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: data }));
    });

    it.each(["create", "create-advanced", "manage", "edit-parameters", "reorder"])(
      "returns error for JS plugin action '%s' on vxace engine",
      async (action) => {
        const ctx = makeCtx({ action, data: {} }, "vxace");
        const result = JSON.parse(await handlePluginManage(ctx));
        expect(result.error).toMatch(/VX Ace/i);
      }
    );

    it("returns error with correct label for vx engine", async () => {
      const ctx = makeCtx({ action: "create", data: {} }, "vx");
      const result = JSON.parse(await handlePluginManage(ctx));
      expect(result.error).toMatch(/VX/i);
    });

    it("returns error with correct label for xp engine", async () => {
      const ctx = makeCtx({ action: "create", data: {} }, "xp");
      const result = JSON.parse(await handlePluginManage(ctx));
      expect(result.error).toMatch(/XP/i);
    });
  });

  describe("Ruby script actions", () => {
    it.each([
      ["list-scripts", "list-scripts"],
      ["read-script", "read-script"],
      ["create-script", "create-script"],
      ["edit-script", "edit-script"],
      ["delete-script", "delete-script"],
    ])("routes %s → %s on vxace engine", async (action, toolName) => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const data = { name: "MyScript" };
      const ctx = makeCtx({ action, data }, "vxace");
      await handlePluginManage(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith(toolName, "vxace");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: data }));
    });

    it.each(["list-scripts", "read-script", "create-script", "edit-script", "delete-script"])(
      "returns error for script action '%s' on mz engine",
      async (action) => {
        const ctx = makeCtx({ action, data: {} }, "mz");
        const result = JSON.parse(await handlePluginManage(ctx));
        expect(result.error).toMatch(/Ruby engine/i);
      }
    );
  });

  it("passes engine to resolveHandler", async () => {
    const handler = makeHandler(JSON.stringify({ success: true }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "manage", data: { action: "list" } }, "mv");
    await handlePluginManage(ctx);
    expect(mockResolveHandler).toHaveBeenCalledWith("manage-plugins", "mv");
  });
});
