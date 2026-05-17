import { describe, it, expect, vi, beforeEach } from "vitest";
import type { HandlerContext } from "../../src/handlers/types.js";
import type { IProjectReader } from "../../src/core/types/reader.js";
import type { IProjectWriter } from "../../src/core/types/writer.js";
import type { RPGMakerDebugBridge } from "../../src/adapters/mz/debug-bridge.js";
import type { RPGMakerRubyBridge } from "../../src/adapters/ruby-bridge/tcp-bridge.js";
import type { ChangeLog } from "../../src/core/change-log.js";
import {
  handleGetGameStateRuby,
  handleSetSwitchRuby,
  handleGetSwitchRuby,
  handleSetVariableRuby,
  handleGetVariableRuby,
  handleTeleportPlayerRuby,
  handleSaveGameRuby,
  handleLoadGameRuby,
  handleSetPartyStateRuby,
  handleGetInventoryRuby,
  handleModifyInventoryRuby,
  handleCallCommonEventRuby,
  handleModifyActorRuntimeRuby,
  handleGetActorRuntimeRuby,
  handleManagePartyRuntimeRuby,
  handleControlWeatherRuntimeRuby,
  handlePlayAudioRuntimeRuby,
  handleGetMapStateRuntimeRuby,
  handleGetBattleStateRuntimeRuby,
  handleControlTimerRuntimeRuby,
  handleExecuteScriptRuby,
  handleShowMessageRuby,
  handleStartEncounterRuby,
} from "../../src/handlers/runtime-ruby.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeRubyBridge(opts?: {
  executeError?: Error;
  queryResult?: unknown;
  queryError?: Error;
}) {
  return {
    executeScript: vi.fn().mockImplementation(() =>
      opts?.executeError ? Promise.reject(opts.executeError) : Promise.resolve()
    ),
    queryValue: vi.fn().mockImplementation(() =>
      opts?.queryError ? Promise.reject(opts.queryError) : Promise.resolve(opts?.queryResult ?? null)
    ),
    connected: true,
  };
}

function makeCtx(
  input: Record<string, unknown>,
  bridge: ReturnType<typeof makeRubyBridge>,
  sysConfig?: Record<string, unknown>,
): HandlerContext {
  return {
    input,
    projectPath: "/tmp/test-project",
    engine: "vxace",
    reader: {
      readProjectConfig: vi.fn().mockReturnValue(sysConfig ?? {}),
    } as unknown as IProjectReader,
    writer: {} as unknown as IProjectWriter,
    debugBridge: {} as unknown as RPGMakerDebugBridge,
    rubyBridge: bridge as unknown as RPGMakerRubyBridge,
    changeLog: { append: vi.fn(), read: vi.fn() } as unknown as ChangeLog,
    debug: false,
  };
}

// Checks that a bridge connection error results in the "not connected" message
function isNotConnected(json: string): boolean {
  const parsed = JSON.parse(json) as { error?: string };
  return typeof parsed.error === "string" && parsed.error.includes("Ruby bridge not available");
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("handleGetGameStateRuby", () => {
  it("returns success with queried state", async () => {
    const fakeState = { map_id: 1, player_x: 5, player_y: 3, gold: 200 };
    const bridge = makeRubyBridge({ queryResult: fakeState });
    const result = JSON.parse(await handleGetGameStateRuby(makeCtx({}, bridge)));
    expect(result.success).toBe(true);
    expect(result.state).toEqual(fakeState);
    expect(bridge.queryValue).toHaveBeenCalledOnce();
  });

  it("returns error json on bridge failure", async () => {
    const bridge = makeRubyBridge({ queryError: new Error("boom") });
    const result = JSON.parse(await handleGetGameStateRuby(makeCtx({}, bridge)));
    expect(result.error).toBe("boom");
  });
});

// ── switches ──────────────────────────────────────────────────────────────────

describe("handleSetSwitchRuby", () => {
  it("sends correct script and returns success", async () => {
    const bridge = makeRubyBridge();
    const ctx = makeCtx({ id: 3, value: true }, bridge);
    const result = JSON.parse(await handleSetSwitchRuby(ctx));
    expect(result.success).toBe(true);
    expect(result.switch_id).toBe(3);
    expect(result.value).toBe(true);
    expect(bridge.executeScript).toHaveBeenCalledWith("$game_switches[3] = true");
    expect((ctx.changeLog.append as ReturnType<typeof vi.fn>)).toHaveBeenCalledOnce();
  });

  it("returns notConnected when bridge throws 'timed out'", async () => {
    const bridge = makeRubyBridge({ executeError: new Error("timed out after 8000ms") });
    const result = await handleSetSwitchRuby(makeCtx({ id: 1, value: false }, bridge));
    expect(isNotConnected(result)).toBe(true);
  });

  it("returns error json for non-connection errors", async () => {
    const bridge = makeRubyBridge({ executeError: new Error("some other error") });
    const result = JSON.parse(await handleSetSwitchRuby(makeCtx({ id: 1, value: false }, bridge)));
    expect(result.error).toBe("some other error");
  });
});

describe("handleGetSwitchRuby", () => {
  it("returns value and resolves name from system config", async () => {
    const bridge = makeRubyBridge({ queryResult: true });
    const result = JSON.parse(
      await handleGetSwitchRuby(makeCtx({ id: 2 }, bridge, { switches: ["", "Flag A", "Flag B"] }))
    );
    expect(result.success).toBe(true);
    expect(result.id).toBe(2);
    expect(result.name).toBe("Flag B");
    expect(result.value).toBe(true);
  });

  it("falls back to generic name when config has no entry", async () => {
    const bridge = makeRubyBridge({ queryResult: false });
    const result = JSON.parse(await handleGetSwitchRuby(makeCtx({ id: 7 }, bridge)));
    expect(result.name).toBe("Switch 7");
  });

  it("returns notConnected when bridge throws 'connect'", async () => {
    const bridge = makeRubyBridge({ queryError: new Error("ECONNREFUSED: connect") });
    expect(isNotConnected(await handleGetSwitchRuby(makeCtx({ id: 1 }, bridge)))).toBe(true);
  });
});

// ── variables ─────────────────────────────────────────────────────────────────

describe("handleSetVariableRuby", () => {
  it("sends numeric value unquoted", async () => {
    const bridge = makeRubyBridge();
    await handleSetVariableRuby(makeCtx({ id: 5, value: 42 }, bridge));
    expect(bridge.executeScript).toHaveBeenCalledWith("$game_variables[5] = 42");
  });

  it("sends string value quoted and escaped", async () => {
    const bridge = makeRubyBridge();
    await handleSetVariableRuby(makeCtx({ id: 5, value: 'say "hello"' }, bridge));
    expect(bridge.executeScript).toHaveBeenCalledWith(`$game_variables[5] = "say \\"hello\\""`);
  });

  it("returns success with id and value", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(await handleSetVariableRuby(makeCtx({ id: 5, value: 99 }, bridge)));
    expect(result.success).toBe(true);
    expect(result.variable_id).toBe(5);
    expect(result.value).toBe(99);
  });
});

describe("handleGetVariableRuby", () => {
  it("returns value with name from system config", async () => {
    const bridge = makeRubyBridge({ queryResult: 123 });
    const result = JSON.parse(
      await handleGetVariableRuby(
        makeCtx({ id: 1 }, bridge, { variables: ["", "GoldVar"] })
      )
    );
    expect(result.value).toBe(123);
    expect(result.name).toBe("GoldVar");
  });
});

// ── teleport ──────────────────────────────────────────────────────────────────

describe("handleTeleportPlayerRuby", () => {
  it("calls reserve_transfer with correct args", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleTeleportPlayerRuby(makeCtx({ map_id: 2, x: 10, y: 5, direction: 4 }, bridge))
    );
    expect(result.success).toBe(true);
    expect(bridge.executeScript).toHaveBeenCalledWith(
      "$game_player.reserve_transfer(2, 10, 5, 4)"
    );
  });

  it("defaults direction to 0 when not provided", async () => {
    const bridge = makeRubyBridge();
    await handleTeleportPlayerRuby(makeCtx({ map_id: 1, x: 0, y: 0 }, bridge));
    expect(bridge.executeScript).toHaveBeenCalledWith(
      "$game_player.reserve_transfer(1, 0, 0, 0)"
    );
  });
});

// ── save / load ───────────────────────────────────────────────────────────────

describe("handleSaveGameRuby", () => {
  it("calls DataManager.save_game with slot", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(await handleSaveGameRuby(makeCtx({ slot: 2 }, bridge)));
    expect(result.success).toBe(true);
    expect(bridge.executeScript).toHaveBeenCalledWith("DataManager.save_game(2)");
  });

  it("defaults to slot 0", async () => {
    const bridge = makeRubyBridge();
    await handleSaveGameRuby(makeCtx({}, bridge));
    expect(bridge.executeScript).toHaveBeenCalledWith("DataManager.save_game(0)");
  });
});

describe("handleLoadGameRuby", () => {
  it("calls load_game and goto Scene_Map", async () => {
    const bridge = makeRubyBridge();
    await handleLoadGameRuby(makeCtx({ slot: 1 }, bridge));
    expect(bridge.executeScript).toHaveBeenCalledWith(
      "DataManager.load_game(1); SceneManager.goto(Scene_Map)"
    );
  });
});

// ── party state ───────────────────────────────────────────────────────────────

describe("handleSetPartyStateRuby", () => {
  it("validates hp_percent range", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleSetPartyStateRuby(makeCtx({ hp_percent: 1.5 }, bridge))
    );
    expect(result.error).toMatch(/hp_percent/);
  });

  it("validates mp_percent range", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleSetPartyStateRuby(makeCtx({ mp_percent: -0.1 }, bridge))
    );
    expect(result.error).toMatch(/mp_percent/);
  });

  it("builds correct script for all party and hp+states", async () => {
    const bridge = makeRubyBridge();
    await handleSetPartyStateRuby(
      makeCtx({ hp_percent: 1.0, add_states: [2, 3] }, bridge)
    );
    const code = bridge.executeScript.mock.calls[0][0] as string;
    expect(code).toContain("$game_party.members");
    expect(code).toContain("actor.hp = (actor.mhp * 1).to_i");
    expect(code).toContain("[2,3].each { |s| actor.add_state(s) }");
  });

  it("targets specific actor when actor_id given", async () => {
    const bridge = makeRubyBridge();
    await handleSetPartyStateRuby(makeCtx({ actor_id: 5, hp_percent: 0.5 }, bridge));
    const code = bridge.executeScript.mock.calls[0][0] as string;
    expect(code).toContain("[$game_actors[5]]");
  });
});

// ── inventory ─────────────────────────────────────────────────────────────────

describe("handleGetInventoryRuby", () => {
  it("returns inventory from query", async () => {
    const fakeInventory = { gold: 500, items: [] };
    const bridge = makeRubyBridge({ queryResult: fakeInventory });
    const result = JSON.parse(await handleGetInventoryRuby(makeCtx({ category: "all" }, bridge)));
    expect(result.success).toBe(true);
    expect(result.inventory).toEqual(fakeInventory);
  });

  it("defaults category to 'all'", async () => {
    const bridge = makeRubyBridge({ queryResult: {} });
    const result = JSON.parse(await handleGetInventoryRuby(makeCtx({}, bridge)));
    expect(result.category).toBe("all");
  });
});

describe("handleModifyInventoryRuby", () => {
  it("returns error when operations is empty", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleModifyInventoryRuby(makeCtx({ operations: [] }, bridge))
    );
    expect(result.error).toMatch(/operations/);
  });

  it("builds correct lines for gold, item, weapon, armor", async () => {
    const bridge = makeRubyBridge();
    await handleModifyInventoryRuby(
      makeCtx({
        operations: [
          { action: "add", type: "gold", amount: 100 },
          { action: "add", type: "item", id: 3, amount: 2 },
          { action: "remove", type: "weapon", id: 1, amount: 1 },
          { action: "add", type: "armor", id: 5, amount: 1 },
        ],
      }, bridge)
    );
    const code = bridge.executeScript.mock.calls[0][0] as string;
    expect(code).toContain("$game_party.gain_gold(100)");
    expect(code).toContain("$game_party.gain_item($data_items[3], 2, false)");
    expect(code).toContain("$game_party.gain_item($data_weapons[1], -1, false)");
    expect(code).toContain("$game_party.gain_item($data_armors[5], 1, false)");
  });
});

// ── common events ─────────────────────────────────────────────────────────────

describe("handleCallCommonEventRuby", () => {
  it("calls reserve_common_event with event id", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleCallCommonEventRuby(makeCtx({ common_event_id: 7 }, bridge))
    );
    expect(result.success).toBe(true);
    expect(result.common_event_id).toBe(7);
    expect(bridge.executeScript).toHaveBeenCalledWith(
      "$game_temp.reserve_common_event(7)"
    );
  });
});

// ── actor runtime ─────────────────────────────────────────────────────────────

describe("handleModifyActorRuntimeRuby", () => {
  it("returns error when operations is empty", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleModifyActorRuntimeRuby(makeCtx({ actor_id: 1, operations: [] }, bridge))
    );
    expect(result.error).toMatch(/operations/);
  });

  it("builds set and delta operations correctly", async () => {
    const bridge = makeRubyBridge();
    await handleModifyActorRuntimeRuby(
      makeCtx({
        actor_id: 2,
        operations: [
          { field: "hp", mode: "set", value: 100 },
          { field: "exp", mode: "add", value: 500 },
          { field: "level", mode: "set", value: 10 },
        ],
      }, bridge)
    );
    const code = bridge.executeScript.mock.calls[0][0] as string;
    expect(code).toContain("actor = $game_actors[2]");
    expect(code).toContain("actor.hp = 100");
    expect(code).toContain("actor.change_exp(actor.exp + 500, false)");
    expect(code).toContain("actor.change_level(10, false)");
  });
});

describe("handleGetActorRuntimeRuby", () => {
  it("returns error when actor_id is missing", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(await handleGetActorRuntimeRuby(makeCtx({}, bridge)));
    expect(result.error).toMatch(/actor_id/);
  });

  it("returns actor data on success", async () => {
    const fakeActor = { id: 1, name: "Hero", level: 5, hp: 200, max_hp: 300 };
    const bridge = makeRubyBridge({ queryResult: fakeActor });
    const result = JSON.parse(
      await handleGetActorRuntimeRuby(makeCtx({ actor_id: 1 }, bridge))
    );
    expect(result.success).toBe(true);
    expect(result.actor).toEqual(fakeActor);
  });

  it("returns error when query returns null (actor not in game)", async () => {
    const bridge = makeRubyBridge({ queryResult: null });
    const result = JSON.parse(
      await handleGetActorRuntimeRuby(makeCtx({ actor_id: 99 }, bridge))
    );
    expect(result.error).toMatch(/not found/);
  });
});

// ── party management ──────────────────────────────────────────────────────────

describe("handleManagePartyRuntimeRuby", () => {
  it("returns error when action is add without actor_id", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleManagePartyRuntimeRuby(makeCtx({ action: "add" }, bridge))
    );
    expect(result.error).toMatch(/actor_id/);
  });

  it("get: queries party members", async () => {
    const fakeParty = [{ id: 1, name: "Hero" }];
    const bridge = makeRubyBridge({ queryResult: fakeParty });
    const result = JSON.parse(
      await handleManagePartyRuntimeRuby(makeCtx({ action: "get" }, bridge))
    );
    expect(result.success).toBe(true);
    expect(result.party).toEqual(fakeParty);
  });

  it("add: calls add_actor", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleManagePartyRuntimeRuby(makeCtx({ action: "add", actor_id: 3 }, bridge))
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe("add");
    expect(bridge.executeScript).toHaveBeenCalledWith("$game_party.add_actor(3)");
  });

  it("remove: calls remove_actor", async () => {
    const bridge = makeRubyBridge();
    await handleManagePartyRuntimeRuby(makeCtx({ action: "remove", actor_id: 2 }, bridge));
    expect(bridge.executeScript).toHaveBeenCalledWith("$game_party.remove_actor(2)");
  });
});

// ── weather ───────────────────────────────────────────────────────────────────

describe("handleControlWeatherRuntimeRuby", () => {
  it("maps type strings to integers", async () => {
    const cases: Array<[string, number]> = [["none", 0], ["rain", 1], ["storm", 2], ["snow", 3]];
    for (const [type, num] of cases) {
      const bridge = makeRubyBridge();
      await handleControlWeatherRuntimeRuby(makeCtx({ type, power: 5, duration: 60 }, bridge));
      expect(bridge.executeScript).toHaveBeenCalledWith(
        `$game_screen.change_weather(${num}, 5, 60)`
      );
    }
  });

  it("returns error for invalid type", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleControlWeatherRuntimeRuby(makeCtx({ type: "fog" }, bridge))
    );
    expect(result.error).toMatch(/Invalid weather type/);
  });
});

// ── audio ─────────────────────────────────────────────────────────────────────

describe("handlePlayAudioRuntimeRuby", () => {
  it("builds RPG::BGM.new for bgm type", async () => {
    const bridge = makeRubyBridge();
    await handlePlayAudioRuntimeRuby(
      makeCtx({ type: "bgm", name: "Battle1", volume: 80, pitch: 100 }, bridge)
    );
    expect(bridge.executeScript).toHaveBeenCalledWith(
      `RPG::BGM.new("Battle1", 80, 100).play`
    );
  });

  it("builds RPG::SE.new for se type", async () => {
    const bridge = makeRubyBridge();
    await handlePlayAudioRuntimeRuby(
      makeCtx({ type: "se", name: "Cursor", volume: 90, pitch: 100 }, bridge)
    );
    expect(bridge.executeScript).toHaveBeenCalledWith(
      `RPG::SE.new("Cursor", 90, 100).play`
    );
  });

  it("returns error when name is missing for bgm", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handlePlayAudioRuntimeRuby(makeCtx({ type: "bgm" }, bridge))
    );
    expect(result.error).toMatch(/name/);
  });

  it("stop_bgm does not require name", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handlePlayAudioRuntimeRuby(makeCtx({ type: "stop_bgm" }, bridge))
    );
    expect(result.success).toBe(true);
    expect(bridge.executeScript).toHaveBeenCalledWith(`RPG::BGM.new("").play`);
  });

  it("returns error for unknown type", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handlePlayAudioRuntimeRuby(makeCtx({ type: "video" }, bridge))
    );
    expect(result.error).toMatch(/Unknown audio type/);
  });
});

// ── map / battle / timer state ────────────────────────────────────────────────

describe("handleGetMapStateRuntimeRuby", () => {
  it("returns map state from query", async () => {
    const fakeMap = { map_id: 2, width: 20, height: 15 };
    const bridge = makeRubyBridge({ queryResult: fakeMap });
    const result = JSON.parse(await handleGetMapStateRuntimeRuby(makeCtx({}, bridge)));
    expect(result.success).toBe(true);
    expect(result.map_state).toEqual(fakeMap);
  });

  it("returns notConnected on bridge error", async () => {
    const bridge = makeRubyBridge({ queryError: new Error("not available") });
    expect(isNotConnected(await handleGetMapStateRuntimeRuby(makeCtx({}, bridge)))).toBe(true);
  });
});

describe("handleGetBattleStateRuntimeRuby", () => {
  it("returns battle data on success", async () => {
    const fakeBattle = { in_battle: true, turn: 2, enemies: [], party: [] };
    const bridge = makeRubyBridge({ queryResult: fakeBattle });
    const result = JSON.parse(await handleGetBattleStateRuntimeRuby(makeCtx({}, bridge)));
    expect(result.success).toBe(true);
    expect(result.battle).toEqual(fakeBattle);
  });
});

describe("handleControlTimerRuntimeRuby", () => {
  it("get: queries timer state", async () => {
    const bridge = makeRubyBridge({ queryResult: { working: false, seconds: 0 } });
    const result = JSON.parse(
      await handleControlTimerRuntimeRuby(makeCtx({ action: "get" }, bridge))
    );
    expect(result.success).toBe(true);
    expect(result.timer).toEqual({ working: false, seconds: 0 });
  });

  it("stop: sends stop command", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleControlTimerRuntimeRuby(makeCtx({ action: "stop" }, bridge))
    );
    expect(result.action).toBe("stop");
    expect(bridge.executeScript).toHaveBeenCalledWith("$game_timer.stop");
  });

  it("start: sends start with frames", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleControlTimerRuntimeRuby(makeCtx({ action: "start", frames: 300 }, bridge))
    );
    expect(result.success).toBe(true);
    expect(result.frames).toBe(300);
    expect(bridge.executeScript).toHaveBeenCalledWith("$game_timer.start(300)");
  });

  it("start: returns error when frames not provided", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleControlTimerRuntimeRuby(makeCtx({ action: "start" }, bridge))
    );
    expect(result.error).toMatch(/frames/);
  });
});

// ── execute-script ────────────────────────────────────────────────────────────

describe("handleExecuteScriptRuby", () => {
  it("returns error when code is missing", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(await handleExecuteScriptRuby(makeCtx({}, bridge)));
    expect(result.error).toMatch(/code/);
  });

  it("passes code to bridge and returns success", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleExecuteScriptRuby(makeCtx({ code: "$game_switches[1] = true" }, bridge))
    );
    expect(result.success).toBe(true);
    expect(bridge.executeScript).toHaveBeenCalledWith("$game_switches[1] = true", 5000);
  });

  it("respects custom timeout", async () => {
    const bridge = makeRubyBridge();
    await handleExecuteScriptRuby(makeCtx({ code: "nil", timeout: 3000 }, bridge));
    expect(bridge.executeScript).toHaveBeenCalledWith("nil", 3000);
  });

  it("returns notConnected when bridge throws 'timed out'", async () => {
    const bridge = makeRubyBridge({ executeError: new Error("timed out after 5000ms") });
    expect(isNotConnected(
      await handleExecuteScriptRuby(makeCtx({ code: "nil" }, bridge))
    )).toBe(true);
  });
});

// ── show-message ──────────────────────────────────────────────────────────────

describe("handleShowMessageRuby", () => {
  it("returns error when text is missing", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(await handleShowMessageRuby(makeCtx({}, bridge)));
    expect(result.error).toMatch(/text/);
  });

  it("sends $game_message.add for text without speaker", async () => {
    const bridge = makeRubyBridge();
    await handleShowMessageRuby(makeCtx({ text: "Hello world" }, bridge));
    const code = bridge.executeScript.mock.calls[0][0] as string;
    expect(code).toContain(`$game_message.add("Hello world")`);
    expect(code).not.toContain("face_name");
  });

  it("includes speaker name when provided", async () => {
    const bridge = makeRubyBridge();
    await handleShowMessageRuby(makeCtx({ text: "Hi", speaker: "Hero" }, bridge));
    const code = bridge.executeScript.mock.calls[0][0] as string;
    expect(code).toContain("face_name");
    expect(code).toContain("Hero");
  });

  it("escapes double quotes in text", async () => {
    const bridge = makeRubyBridge();
    await handleShowMessageRuby(makeCtx({ text: 'say "hello"' }, bridge));
    const code = bridge.executeScript.mock.calls[0][0] as string;
    expect(code).toContain('\\"hello\\"');
  });
});

// ── start-encounter ───────────────────────────────────────────────────────────

describe("handleStartEncounterRuby", () => {
  it("returns error when troop_id is missing", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(await handleStartEncounterRuby(makeCtx({}, bridge)));
    expect(result.error).toMatch(/troop_id/);
  });

  it("sends setup + SceneManager.call with troop_id", async () => {
    const bridge = makeRubyBridge();
    const result = JSON.parse(
      await handleStartEncounterRuby(makeCtx({ troop_id: 4 }, bridge))
    );
    expect(result.success).toBe(true);
    expect(bridge.executeScript).toHaveBeenCalledWith(
      "$game_troop.setup(4); SceneManager.call(Scene_Battle)"
    );
  });

  it("returns notConnected when bridge throws 'not available'", async () => {
    const bridge = makeRubyBridge({ executeError: new Error("bridge not available") });
    expect(isNotConnected(
      await handleStartEncounterRuby(makeCtx({ troop_id: 1 }, bridge))
    )).toBe(true);
  });
});
