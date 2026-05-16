import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/rpgmaker/reader.js";
import { RPGMakerWriter } from "../../src/rpgmaker/writer.js";
import { RPGMakerDebugBridge } from "../../src/rpgmaker/debug-bridge.js";
import { ChangeLog } from "../../src/rpgmaker/change-log.js";
import { handleEditSystem } from "../../src/handlers/system.js";
import type { HandlerContext } from "../../src/handlers/types.js";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

const BASE_SYSTEM = {
  gameTitle: "My Game",
  currencyUnit: "Gold",
  partyMembers: [1],
  startMapId: 1, startX: 8, startY: 6,
  switches: ["", ""],
  variables: ["", ""],
  titleBgm: { name: "Title1", pan: 0, pitch: 100, volume: 90 },
  battleBgm: { name: "Battle1", pan: 0, pitch: 100, volume: 90 },
  victoryMe: { name: "Victory1", pan: 0, pitch: 100, volume: 90 },
  defeatMe: { name: "Defeat1", pan: 0, pitch: 100, volume: 90 },
  versionId: 1,
  optAutosave: false,
  optDisplayTp: true,
  optSlipDeath: false,
  optFloorDeath: true,
  optFollowerDistance: false,
  optTransparent: true,
};

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-sys-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);
  writeJson(path.join(dataDir, "System.json"), BASE_SYSTEM);
  return dir;
}

function makeCtx(dir: string, input: Record<string, unknown>): HandlerContext {
  return {
    reader: new RPGMakerReader({ projectPath: dir }),
    writer: new RPGMakerWriter({ projectPath: dir, createBackup: false }),
    input,
    projectPath: dir,
    debugBridge: new RPGMakerDebugBridge(),
    changeLog: new ChangeLog(dir),
    debug: false,
  };
}

describe("handleEditSystem", () => {
  let dir: string;
  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("updates the game title", async () => {
    const result = JSON.parse(await handleEditSystem(makeCtx(dir, { game_title: "Dragon Quest" })));
    expect(result.success).toBe(true);
    expect(result.updated).toContain("game_title");
    const sys = readJson(path.join(dir, "data", "System.json")) as Record<string, unknown>;
    expect(sys.gameTitle).toBe("Dragon Quest");
  });

  it("updates currency unit", async () => {
    await handleEditSystem(makeCtx(dir, { currency_unit: "Coins" }));
    const sys = readJson(path.join(dir, "data", "System.json")) as Record<string, unknown>;
    expect(sys.currencyUnit).toBe("Coins");
  });

  it("updates initial party", async () => {
    await handleEditSystem(makeCtx(dir, { initial_party: [1, 2, 3] }));
    const sys = readJson(path.join(dir, "data", "System.json")) as Record<string, unknown>;
    expect(sys.partyMembers).toEqual([1, 2, 3]);
  });

  it("updates start position", async () => {
    await handleEditSystem(makeCtx(dir, { start_map_id: 5, start_x: 3, start_y: 7 }));
    const sys = readJson(path.join(dir, "data", "System.json")) as Record<string, unknown>;
    expect(sys.startMapId).toBe(5);
    expect(sys.startX).toBe(3);
    expect(sys.startY).toBe(7);
  });

  it("names switches by ID", async () => {
    await handleEditSystem(makeCtx(dir, { switch_names: { "1": "Event Done", "3": "Boss Defeated" } }));
    const sys = readJson(path.join(dir, "data", "System.json")) as Record<string, unknown>;
    const sw = sys.switches as string[];
    expect(sw[1]).toBe("Event Done");
    expect(sw[3]).toBe("Boss Defeated");
  });

  it("names variables by ID", async () => {
    await handleEditSystem(makeCtx(dir, { variable_names: { "2": "Score", "5": "Floor" } }));
    const sys = readJson(path.join(dir, "data", "System.json")) as Record<string, unknown>;
    const vars = sys.variables as string[];
    expect(vars[2]).toBe("Score");
    expect(vars[5]).toBe("Floor");
  });

  it("updates battle BGM and preserves other audio", async () => {
    await handleEditSystem(makeCtx(dir, { battle_bgm: { name: "Battle2", volume: 80 } }));
    const sys = readJson(path.join(dir, "data", "System.json")) as Record<string, unknown>;
    const bgm = sys.battleBgm as Record<string, unknown>;
    expect(bgm.name).toBe("Battle2");
    expect(bgm.volume).toBe(80);
    // title BGM unchanged
    expect((sys.titleBgm as Record<string, unknown>).name).toBe("Title1");
  });

  it("updates victory ME", async () => {
    await handleEditSystem(makeCtx(dir, { victory_me: { name: "Fanfare" } }));
    const sys = readJson(path.join(dir, "data", "System.json")) as Record<string, unknown>;
    expect((sys.victoryMe as Record<string, unknown>).name).toBe("Fanfare");
  });

  it("preserves existing fields not in the update", async () => {
    await handleEditSystem(makeCtx(dir, { game_title: "New Title" }));
    const sys = readJson(path.join(dir, "data", "System.json")) as Record<string, unknown>;
    expect(sys.currencyUnit).toBe("Gold");
    expect(sys.startMapId).toBe(1);
  });

  it("returns error when no fields provided", async () => {
    const result = JSON.parse(await handleEditSystem(makeCtx(dir, {})));
    expect(result.error).toMatch(/No fields/);
  });

  it("appends to change log", async () => {
    const ctx = makeCtx(dir, { game_title: "Changed" });
    await handleEditSystem(ctx);
    const entries = ctx.changeLog.read();
    expect(entries[0].tool).toBe("edit-system");
    expect(entries[0].action).toBe("update");
  });

  it("updates all 6 opt_* boolean fields correctly", async () => {
    const result = JSON.parse(await handleEditSystem(makeCtx(dir, {
      opt_autosave: true,
      opt_display_tp: false,
      opt_slip_death: true,
      opt_floor_death: false,
      opt_follower_distance: true,
      opt_transparent: false,
    })));
    expect(result.success).toBe(true);
    const sys = readJson(path.join(dir, "data", "System.json")) as Record<string, unknown>;
    expect(sys.optAutosave).toBe(true);
    expect(sys.optDisplayTp).toBe(false);
    expect(sys.optSlipDeath).toBe(true);
    expect(sys.optFloorDeath).toBe(false);
    expect(sys.optFollowerDistance).toBe(true);
    expect(sys.optTransparent).toBe(false);
  });
});
