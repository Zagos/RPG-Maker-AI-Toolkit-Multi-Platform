import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/adapters/mz/reader.js";
import { RPGMakerWriter } from "../../src/adapters/mz/writer.js";
import { RPGMakerDebugBridge } from "../../src/adapters/mz/debug-bridge.js";
import { ChangeLog } from "../../src/core/change-log.js";
import { handleEditMap } from "../../src/adapters/mz/handlers/map-edit.js";
import type { HandlerContext } from "../../src/adapters/mz/handlers/types.js";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

const BASE_MAP = {
  displayName: "Old Town",
  width: 17, height: 13,
  tilesetId: 1, encounterStep: 30, scrollType: 0,
  note: "", enableNameDisplay: false,
  autoplayBgm: false, autoplayBgs: false,
  bgm: { name: "", pan: 0, pitch: 100, volume: 90 },
  bgs: { name: "", pan: 0, pitch: 100, volume: 90 },
  specifyBattleback: false, battleback1Name: "", battleback2Name: "",
  parallaxName: "", parallaxShow: false, parallaxLoopX: false, parallaxLoopY: false,
  parallaxSx: 0, parallaxSy: 0,
  encounterList: [], data: [], events: [null],
};

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-mapedit-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);
  writeJson(path.join(dataDir, "Map001.json"), BASE_MAP);
  writeJson(path.join(dataDir, "MapInfos.json"), [
    null,
    { id: 1, name: "Old Town", parentId: 0, order: 1, expanded: false, scrollX: 0, scrollY: 0 },
  ]);
  writeJson(path.join(dataDir, "System.json"), { gameTitle: "Test", versionId: 1 });
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

describe("handleEditMap", () => {
  let dir: string;
  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("updates the display name", async () => {
    const ctx = makeCtx(dir, { map_id: 1, name: "New Town" });
    const result = JSON.parse(await handleEditMap(ctx));
    expect(result.success).toBe(true);
    expect(result.updated).toContain("name");
    const map = readJson(path.join(dir, "data", "Map001.json")) as Record<string, unknown>;
    expect(map.displayName).toBe("New Town");
  });

  it("also updates MapInfos.json when name changes", async () => {
    await handleEditMap(makeCtx(dir, { map_id: 1, name: "Capital City" }));
    const infos = readJson(path.join(dir, "data", "MapInfos.json")) as Array<Record<string, unknown> | null>;
    expect((infos[1] as Record<string, unknown>).name).toBe("Capital City");
  });

  it("updates tileset_id", async () => {
    await handleEditMap(makeCtx(dir, { map_id: 1, tileset_id: 3 }));
    const map = readJson(path.join(dir, "data", "Map001.json")) as Record<string, unknown>;
    expect(map.tilesetId).toBe(3);
  });

  it("updates BGM settings", async () => {
    await handleEditMap(makeCtx(dir, { map_id: 1, autoplay_bgm: true, bgm_name: "Town1", bgm_volume: 80 }));
    const map = readJson(path.join(dir, "data", "Map001.json")) as Record<string, unknown>;
    expect(map.autoplayBgm).toBe(true);
    expect((map.bgm as Record<string, unknown>).name).toBe("Town1");
    expect((map.bgm as Record<string, unknown>).volume).toBe(80);
  });

  it("replaces the encounter list", async () => {
    await handleEditMap(makeCtx(dir, {
      map_id: 1,
      encounters: [{ enemy_id: 1, weight: 10 }, { enemy_id: 2, weight: 5 }],
    }));
    const map = readJson(path.join(dir, "data", "Map001.json")) as Record<string, unknown>;
    const list = map.encounterList as Array<{ troopId: number; weight: number }>;
    expect(list).toHaveLength(2);
    expect(list[0].troopId).toBe(1);
    expect(list[0].weight).toBe(10);
  });

  it("does not overwrite tile data or events", async () => {
    const before = readJson(path.join(dir, "data", "Map001.json")) as Record<string, unknown>;
    await handleEditMap(makeCtx(dir, { map_id: 1, tileset_id: 5 }));
    const after = readJson(path.join(dir, "data", "Map001.json")) as Record<string, unknown>;
    expect(after.data).toEqual(before.data);
    expect(after.events).toEqual(before.events);
  });

  it("returns error for non-existent map", async () => {
    const result = JSON.parse(await handleEditMap(makeCtx(dir, { map_id: 99, name: "Ghost" })));
    expect(result.error).toBeDefined();
  });

  it("returns error when no fields provided", async () => {
    const result = JSON.parse(await handleEditMap(makeCtx(dir, { map_id: 1 })));
    expect(result.error).toMatch(/No fields/);
  });

  it("returns error when map_id is missing", async () => {
    const result = JSON.parse(await handleEditMap(makeCtx(dir, { name: "X" })));
    expect(result.error).toBeDefined();
  });

  it("appends to change log", async () => {
    const ctx = makeCtx(dir, { map_id: 1, encounter_step: 20 });
    await handleEditMap(ctx);
    const entries = ctx.changeLog.read();
    expect(entries[0].tool).toBe("edit-map");
    expect(entries[0].action).toBe("update");
    expect(entries[0].entityId).toBe(1);
  });
});
