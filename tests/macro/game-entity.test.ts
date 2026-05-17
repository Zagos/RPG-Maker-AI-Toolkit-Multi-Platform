import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleGameEntity } from "../../src/macro/handlers/game-entity.js";
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

describe("handleGameEntity", () => {
  it("returns error for unknown action", async () => {
    const ctx = makeCtx({ action: "nope", type: "actor" });
    const result = JSON.parse(await handleGameEntity(ctx));
    expect(result.error).toMatch(/unknown game-entity action/i);
  });

  it("returns error when handler not found", async () => {
    mockResolveHandler.mockReturnValue(undefined);
    const ctx = makeCtx({ action: "create", type: "actor", data: { name: "Hero" } });
    const result = JSON.parse(await handleGameEntity(ctx));
    expect(result.error).toMatch(/internal handler not found/i);
  });

  describe("create", () => {
    it.each([
      ["actor", "create-actor"],
      ["item", "create-item"],
      ["weapon", "create-weapon"],
      ["armor", "create-armor"],
      ["skill", "create-skill"],
      ["class", "create-class"],
      ["state", "create-state"],
      ["enemy", "create-enemy"],
      ["troop", "create-troop"],
      ["common-event", "create-common-event"],
      ["animation", "create-animation"],
    ])("routes create %s → %s", async (type, toolName) => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "create", type, data: { name: "Test" } });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith(toolName, "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { name: "Test" } }));
    });

    it("returns error for create type that cannot be created", async () => {
      const ctx = makeCtx({ action: "create", type: "system", data: {} });
      const result = JSON.parse(await handleGameEntity(ctx));
      expect(result.error).toMatch(/not supported for type: system/i);
    });
  });

  describe("edit", () => {
    it("routes edit actor with actor_id set from id", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "edit", type: "actor", id: 3, data: { name: "Hero" } });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("edit-actor", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { actor_id: 3, name: "Hero" } }));
    });

    it("routes edit troop with troop_id", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "edit", type: "troop", id: 2, data: { name: "Forest Ambush" } });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("edit-troop", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { troop_id: 2, name: "Forest Ambush" } }));
    });

    it("routes edit common-event with event_id", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "edit", type: "common-event", id: 5, data: { name: "Shop" } });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("edit-common-event", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { event_id: 5, name: "Shop" } }));
    });

    it("routes edit system (special type, data pass-through, no id)", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "edit", type: "system", data: { game_title: "My Game" } });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("edit-system", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { game_title: "My Game" } }));
    });

    it("routes edit vehicle (special type, data pass-through)", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "edit", type: "vehicle", data: { vehicle: "boat" } });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("edit-vehicle", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { vehicle: "boat" } }));
    });

    it("routes edit traits", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "edit", type: "traits", data: { entity_type: "Actor", entity_id: 1, mode: "clear" } });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("edit-traits", "mz");
    });

    it("routes edit effects", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "edit", type: "effects", data: { entity_type: "Skill", entity_id: 2, mode: "clear" } });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("edit-effects", "mz");
    });

    it("routes edit class-learnings", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "edit", type: "class-learnings", data: { class_id: 1, mode: "replace", learnings: [] } });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("edit-class-learnings", "mz");
    });

    it("routes edit enemy-actions", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "edit", type: "enemy-actions", data: { enemy_id: 1, mode: "clear" } });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("edit-enemy-actions", "mz");
    });

    it("routes edit drop-items", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "edit", type: "drop-items", data: { enemy_id: 1, mode: "clear" } });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("edit-drop-items", "mz");
    });

    it("returns error for unknown special edit type", async () => {
      const ctx = makeCtx({ action: "edit", type: "character", data: {} });
      const result = JSON.parse(await handleGameEntity(ctx));
      expect(result.error).toMatch(/unknown entity type for action=edit/i);
    });
  });

  describe("delete", () => {
    it("routes to delete-entity mapping type to PascalCase entity_type and setting confirm=true", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "delete", type: "enemy", id: 4, data: {} });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("delete-entity", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { entity_type: "Enemy", entity_id: 4, confirm: true } }));
    });

    it("returns error for delete of unsupported type", async () => {
      const ctx = makeCtx({ action: "delete", type: "system", id: 0, data: {} });
      const result = JSON.parse(await handleGameEntity(ctx));
      expect(result.error).toMatch(/not supported for type: system/i);
    });
  });

  describe("duplicate", () => {
    it("routes to duplicate-entity with PascalCase entity_type and data spread", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "duplicate", type: "actor", id: 2, data: { new_name: "Hero Copy" } });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("duplicate-entity", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { entity_type: "Actor", entity_id: 2, new_name: "Hero Copy" } }));
    });

    it("returns error for duplicate of unsupported type", async () => {
      const ctx = makeCtx({ action: "duplicate", type: "vehicle", id: 0, data: {} });
      const result = JSON.parse(await handleGameEntity(ctx));
      expect(result.error).toMatch(/not supported for type: vehicle/i);
    });
  });

  describe("generate", () => {
    it("routes generate character to generate-character with data pass-through", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "generate", type: "character", data: { name: "Aria", archetype: "mage" } });
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("generate-character", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { name: "Aria", archetype: "mage" } }));
    });

    it("returns error when generate type is not character", async () => {
      const ctx = makeCtx({ action: "generate", type: "actor", data: {} });
      const result = JSON.parse(await handleGameEntity(ctx));
      expect(result.error).toMatch(/action=generate only supports type=character/i);
    });
  });

  describe("common-event PascalCase mapping", () => {
    it("maps common-event → CommonEvent for delete", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "delete", type: "common-event", id: 3, data: {} });
      await handleGameEntity(ctx);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ entity_type: "CommonEvent" }) }));
    });
  });

  describe("data defaults to empty object", () => {
    it("works when data field is omitted", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "create", type: "item" }); // no data field
      await handleGameEntity(ctx);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: {} }));
    });
  });

  describe("engine routing", () => {
    it("passes engine to resolveHandler", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "create", type: "actor", data: { name: "Hero" } }, "vxace");
      await handleGameEntity(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("create-actor", "vxace");
    });
  });
});
