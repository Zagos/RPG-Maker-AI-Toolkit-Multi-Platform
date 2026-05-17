import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleRuntimeControl } from "../../src/macro/handlers/runtime-control.js";
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

describe("handleRuntimeControl", () => {
  it("returns error for unknown action", async () => {
    const ctx = makeCtx({ action: "nope" });
    const result = JSON.parse(await handleRuntimeControl(ctx));
    expect(result.error).toMatch(/unknown runtime-control action/i);
  });

  it("returns error when handler not found", async () => {
    mockResolveHandler.mockReturnValue(undefined);
    const ctx = makeCtx({ action: "set-switch", id: 1, value: true });
    const result = JSON.parse(await handleRuntimeControl(ctx));
    expect(result.error).toMatch(/internal handler not found/i);
  });

  describe("set-switch", () => {
    it("routes to set-switch with id and value", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "set-switch", id: 3, value: true });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("set-switch", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { id: 3, value: true } }));
    });
  });

  describe("set-variable", () => {
    it("routes to set-variable with id and value", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "set-variable", id: 5, value: 42 });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("set-variable", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { id: 5, value: 42 } }));
    });
  });

  describe("teleport", () => {
    it("routes to teleport-player with map_id, x, y, direction", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "teleport", map_id: 2, x: 5, y: 7, direction: 4 });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("teleport-player", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { map_id: 2, x: 5, y: 7, direction: 4 } }));
    });
  });

  describe("save", () => {
    it("routes to save-game with slot", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "save", slot: 98 });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("save-game", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { slot: 98 } }));
    });
  });

  describe("load", () => {
    it("routes to load-game with slot", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "load", slot: 98 });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("load-game", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { slot: 98 } }));
    });
  });

  describe("modify-inventory", () => {
    it("routes to modify-inventory with operations", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ops = [{ action: "add", type: "item", id: 1, amount: 3 }];
      const ctx = makeCtx({ action: "modify-inventory", operations: ops });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("modify-inventory", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { operations: ops } }));
    });
  });

  describe("set-party-state", () => {
    it("routes to set-party-state with all party fields", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "set-party-state", actor_id: 1, hp_percent: 0.5, mp_percent: 1.0, add_states: [2], remove_states: [] });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("set-party-state", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({
        input: { actor_id: 1, hp_percent: 0.5, mp_percent: 1.0, add_states: [2], remove_states: [] },
      }));
    });
  });

  describe("call-common-event", () => {
    it("routes to call-common-event remapping event_id → common_event_id", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "call-common-event", event_id: 7 });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("call-common-event", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { common_event_id: 7 } }));
    });

    it("also accepts common_event_id directly", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "call-common-event", common_event_id: 3 });
      await handleRuntimeControl(ctx);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { common_event_id: 3 } }));
    });
  });

  describe("modify-actor", () => {
    it("routes to modify-actor-runtime with actor_id and operations", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ops = [{ field: "hp", mode: "set", value: 100 }];
      const ctx = makeCtx({ action: "modify-actor", actor_id: 1, operations: ops });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("modify-actor-runtime", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { actor_id: 1, operations: ops } }));
    });
  });

  describe("manage-party", () => {
    it("routes to manage-party-runtime remapping party_action → action", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "manage-party", party_action: "add", actor_id: 2 });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("manage-party-runtime", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { action: "add", actor_id: 2 } }));
    });
  });

  describe("control-weather", () => {
    it("routes to control-weather-runtime remapping weather_type → type", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "control-weather", weather_type: "rain", power: 5, duration: 60 });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("control-weather-runtime", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { type: "rain", power: 5, duration: 60 } }));
    });
  });

  describe("play-audio", () => {
    it("routes to play-audio-runtime remapping audio_type → type", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "play-audio", audio_type: "bgm", name: "Battle1", volume: 90, pitch: 100, pan: 0 });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("play-audio-runtime", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { type: "bgm", name: "Battle1", volume: 90, pitch: 100, pan: 0 } }));
    });
  });

  describe("control-timer", () => {
    it("routes to control-timer-runtime remapping timer_action → action", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "control-timer", timer_action: "start", frames: 300 });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("control-timer-runtime", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { action: "start", frames: 300 } }));
    });
  });

  describe("show-message", () => {
    it("routes to show-message with text and speaker", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "show-message", text: "Hello!", speaker: "Hero" });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("show-message", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { text: "Hello!", speaker: "Hero" } }));
    });
  });

  describe("execute-script", () => {
    it("routes to execute-script with code and timeout", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "execute-script", code: "$game_switches[1] = true", timeout: 3000 });
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("execute-script", "mz");
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ input: { code: "$game_switches[1] = true", timeout: 3000 } }));
    });
  });

  describe("engine routing", () => {
    it("passes engine to resolveHandler so Ruby engines get Ruby handlers", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const ctx = makeCtx({ action: "set-switch", id: 1, value: false }, "vxace");
      await handleRuntimeControl(ctx);
      expect(mockResolveHandler).toHaveBeenCalledWith("set-switch", "vxace");
    });
  });

  describe("child context isolation", () => {
    it("does not mutate the original ctx.input", async () => {
      const handler = makeHandler(JSON.stringify({ success: true }));
      mockResolveHandler.mockReturnValue(handler);
      const originalInput = { action: "teleport", map_id: 1, x: 0, y: 0 };
      const ctx = makeCtx(originalInput);
      await handleRuntimeControl(ctx);
      expect(ctx.input).toBe(originalInput);
    });
  });
});
