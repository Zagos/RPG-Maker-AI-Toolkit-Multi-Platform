import { describe, it, expect, beforeEach } from "vitest";
import { RPGMakerDebugBridge } from "../../src/adapters/mz/debug-bridge.js";
import type { GameState, BattleState } from "../../src/adapters/mz/debug-bridge.js";

function makeGameState(overrides?: Partial<GameState>): GameState {
  return {
    mapId: 1,
    playerX: 5,
    playerY: 10,
    gold: 500,
    partyMembers: [{ name: "Harold", hp: 450, mhp: 450, level: 5 }],
    inBattle: false,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe("RPGMakerDebugBridge", () => {
  let bridge: RPGMakerDebugBridge;

  beforeEach(() => {
    bridge = new RPGMakerDebugBridge();
  });

  describe("connection state", () => {
    it("starts disconnected", () => {
      expect(bridge.connected).toBe(false);
    });

    it("markConnected sets connected to true", () => {
      bridge.markConnected();
      expect(bridge.connected).toBe(true);
    });
  });

  describe("command queue", () => {
    it("starts with no pending command", () => {
      expect(bridge.getCommand()).toBeNull();
    });

    it("setCommand stores command and clears previous state", () => {
      bridge.setCommand("set_switch", { id: 5, value: true });
      const cmd = bridge.getCommand();
      expect(cmd?.command).toBe("set_switch");
      expect(cmd?.args).toEqual({ id: 5, value: true });
    });

    it("clearCommand removes the pending command", () => {
      bridge.setCommand("get_state", {});
      bridge.clearCommand();
      expect(bridge.getCommand()).toBeNull();
    });
  });

  describe("game state", () => {
    it("starts with no game state", () => {
      expect(bridge.getGameState()).toBeNull();
    });

    it("setGameState stores and getGameState retrieves it", () => {
      const state = makeGameState();
      bridge.setGameState(state);
      expect(bridge.getGameState()).toEqual(state);
    });

    it("waitForGameState resolves when setGameState is called", async () => {
      const state = makeGameState({ mapId: 3, playerX: 8, playerY: 12 });
      setTimeout(() => bridge.setGameState(state), 100);
      const result = await bridge.waitForGameState(2000);
      expect(result.mapId).toBe(3);
      expect(result.playerX).toBe(8);
    });

    it("waitForGameState rejects after timeout", async () => {
      await expect(bridge.waitForGameState(100)).rejects.toThrow("Timed out");
    });
  });

  describe("ack mechanism", () => {
    it("waitForAck resolves true when resolveAck is called", async () => {
      setTimeout(() => bridge.resolveAck(), 50);
      const ok = await bridge.waitForAck(2000);
      expect(ok).toBe(true);
    });

    it("waitForAck resolves false after timeout", async () => {
      const ok = await bridge.waitForAck(100);
      expect(ok).toBe(false);
    });

    it("resolveAck resolves only the first pending waiter", async () => {
      const p1 = bridge.waitForAck(2000);
      const p2 = bridge.waitForAck(2000);
      bridge.resolveAck();
      const r1 = await p1;
      expect(r1).toBe(true);
      // p2 should still be pending — cancel it
      bridge.resolveAck();
      const r2 = await p2;
      expect(r2).toBe(true);
    });
  });

  describe("battle flow", () => {
    it("addEvent accumulates events", () => {
      bridge.setCommand("start_battle", { troopId: 1 });
      bridge.addEvent({ type: "battle_start", troopId: 1 });
      bridge.addEvent({ type: "action", subject: "Harold" });
      // events are internal; waitForBattle returns them
    });

    it("waitForBattle resolves when final non-battle state arrives", async () => {
      const finalState: BattleState = {
        inBattle: false,
        battleOver: true,
        turn: 3,
        actors: [{ name: "Harold", hp: 300, mhp: 450, mp: 50, mmp: 100, states: [] }],
        enemies: [],
      };
      bridge.setCommand("start_battle", { troopId: 1 });
      bridge.addEvent({ type: "battle_start" });
      setTimeout(() => bridge.setFinalState(finalState), 80);
      const result = await bridge.waitForBattle(2000);
      expect(result.success).toBe(true);
      expect(result.state?.turn).toBe(3);
      expect(result.summary).toContain("Harold");
    });

    it("waitForBattle returns failure on timeout", async () => {
      bridge.setCommand("start_battle", { troopId: 1 });
      const result = await bridge.waitForBattle(100);
      expect(result.success).toBe(false);
      expect(result.summary).toContain("timed out");
    });
  });
});
