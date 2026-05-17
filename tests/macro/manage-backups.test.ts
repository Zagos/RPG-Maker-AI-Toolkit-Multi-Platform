import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleManageBackups } from "../../src/macro/handlers/manage-backups.js";
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

describe("handleManageBackups", () => {
  it("returns error when handler not found", async () => {
    mockResolveHandler.mockReturnValue(undefined);
    const ctx = makeCtx({ action: "list" });
    const result = JSON.parse(await handleManageBackups(ctx));
    expect(result.error).toMatch(/internal handler not found/i);
  });

  it("routes to manage-backups internal handler", async () => {
    const handler = makeHandler(JSON.stringify({ backups: [] }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "list" });
    await handleManageBackups(ctx);
    expect(mockResolveHandler).toHaveBeenCalledWith("manage-backups", "mz");
  });

  it("passes action to child input", async () => {
    const handler = makeHandler(JSON.stringify({ backups: [] }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "list" });
    await handleManageBackups(ctx);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { action: "list" } }));
  });

  it("passes filename when provided", async () => {
    const handler = makeHandler(JSON.stringify({ success: true }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "restore", filename: "Actors.json", backup_name: "Actors_2025-01-01_001.json" });
    await handleManageBackups(ctx);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        input: { action: "restore", filename: "Actors.json", backup_name: "Actors_2025-01-01_001.json" },
      })
    );
  });

  it("passes max_count when provided", async () => {
    const handler = makeHandler(JSON.stringify({ pruned: 3 }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "prune", max_count: 5 });
    await handleManageBackups(ctx);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ input: { action: "prune", max_count: 5 } })
    );
  });

  it("omits optional fields when not provided", async () => {
    const handler = makeHandler(JSON.stringify({ backups: [] }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "list" });
    await handleManageBackups(ctx);
    const callInput = vi.mocked(handler).mock.calls[0][0].input;
    expect(callInput).not.toHaveProperty("filename");
    expect(callInput).not.toHaveProperty("backup_name");
    expect(callInput).not.toHaveProperty("max_count");
  });

  it("passes engine to resolveHandler", async () => {
    const handler = makeHandler(JSON.stringify({ backups: [] }));
    mockResolveHandler.mockReturnValue(handler);
    const ctx = makeCtx({ action: "list" }, "vxace");
    await handleManageBackups(ctx);
    expect(mockResolveHandler).toHaveBeenCalledWith("manage-backups", "vxace");
  });
});
