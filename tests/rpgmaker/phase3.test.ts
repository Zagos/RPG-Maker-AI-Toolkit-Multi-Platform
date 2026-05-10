import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ChangeLog } from "../../src/rpgmaker/change-log.js";
import { RPGMakerWriter } from "../../src/rpgmaker/writer.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-phase3-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);
  fs.mkdirSync(path.join(dir, "js", "plugins"), { recursive: true });

  writeJson(path.join(dataDir, "Actors.json"), [null, { id: 1, name: "Hero" }]);
  writeJson(path.join(dataDir, "Items.json"), [null]);
  writeJson(path.join(dataDir, "Enemies.json"), [null]);
  writeJson(path.join(dataDir, "Weapons.json"), [null]);
  writeJson(path.join(dataDir, "Armors.json"), [null]);
  writeJson(path.join(dataDir, "Skills.json"), [null]);
  writeJson(path.join(dataDir, "Classes.json"), [null]);
  writeJson(path.join(dataDir, "States.json"), [null]);
  writeJson(path.join(dataDir, "CommonEvents.json"), [null]);
  writeJson(path.join(dataDir, "Troops.json"), [null]);
  writeJson(path.join(dataDir, "System.json"), { gameTitle: "Test", versionId: 1 });
  writeJson(path.join(dataDir, "MapInfos.json"), [null]);
  writeJson(path.join(dataDir, "Map001.json"), {
    width: 17, height: 13, tilesetId: 1, data: [], events: [], scrollType: 0,
    autoplayBgm: false, autoplayBgs: false, battleback1Name: "", battleback2Name: "",
    bgm: {}, bgs: {}, disableDashing: false, displayName: "", encounterList: [],
    encounterStep: 30, note: "", parallaxLoopX: false, parallaxLoopY: false,
    parallaxName: "", parallaxShow: false, parallaxSx: 0, parallaxSy: 0,
    specifyBattleback: false,
  });

  return dir;
}

// ── ChangeLog tests ───────────────────────────────────────────────────────────

describe("ChangeLog", () => {
  let dir: string;
  let log: ChangeLog;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "changelog-test-"));
    log = new ChangeLog(dir);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("starts empty when log file does not exist", () => {
    expect(log.read()).toEqual([]);
  });

  it("appends an entry and reads it back", () => {
    log.append({ tool: "edit-actor", entityType: "Actor", entityId: 1, action: "update", summary: "Actor 1 updated" });
    const entries = log.read();
    expect(entries).toHaveLength(1);
    expect(entries[0].tool).toBe("edit-actor");
    expect(entries[0].entityType).toBe("Actor");
    expect(entries[0].entityId).toBe(1);
    expect(entries[0].action).toBe("update");
    expect(entries[0].summary).toBe("Actor 1 updated");
    expect(entries[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns entries newest-first", () => {
    log.append({ tool: "edit-actor", entityType: "Actor", action: "create", summary: "first" });
    log.append({ tool: "edit-item", entityType: "Item", action: "create", summary: "second" });
    const entries = log.read();
    expect(entries[0].summary).toBe("second");
    expect(entries[1].summary).toBe("first");
  });

  it("filters by tool", () => {
    log.append({ tool: "edit-actor", entityType: "Actor", action: "create", summary: "a" });
    log.append({ tool: "edit-item", entityType: "Item", action: "create", summary: "b" });
    const entries = log.read({ tool: "edit-actor" });
    expect(entries).toHaveLength(1);
    expect(entries[0].summary).toBe("a");
  });

  it("filters by entityType", () => {
    log.append({ tool: "edit-actor", entityType: "Actor", action: "create", summary: "a" });
    log.append({ tool: "edit-item", entityType: "Item", action: "create", summary: "b" });
    const entries = log.read({ entityType: "Item" });
    expect(entries).toHaveLength(1);
    expect(entries[0].summary).toBe("b");
  });

  it("filters by action", () => {
    log.append({ tool: "edit-actor", entityType: "Actor", action: "create", summary: "created" });
    log.append({ tool: "edit-actor", entityType: "Actor", entityId: 1, action: "update", summary: "updated" });
    const creates = log.read({ action: "create" });
    expect(creates).toHaveLength(1);
    expect(creates[0].action).toBe("create");
  });

  it("filters by since", () => {
    log.append({ tool: "edit-actor", entityType: "Actor", action: "create", summary: "entry" });
    // A since timestamp in the future excludes all real entries
    const future = new Date(Date.now() + 60000).toISOString();
    expect(log.read({ since: future })).toHaveLength(0);
    // A since timestamp before the entry includes it
    const past = new Date(Date.now() - 60000).toISOString();
    expect(log.read({ since: past })).toHaveLength(1);
  });

  it("respects limit", () => {
    for (let i = 0; i < 5; i++) {
      log.append({ tool: "edit-actor", entityType: "Actor", action: "update", summary: `entry ${i}` });
    }
    const entries = log.read({ limit: 3 });
    expect(entries).toHaveLength(3);
  });

  it("clear() empties the log", () => {
    log.append({ tool: "edit-actor", entityType: "Actor", action: "create", summary: "x" });
    log.clear();
    expect(log.read()).toEqual([]);
  });

  it("never throws on corrupted log file", () => {
    fs.writeFileSync(path.join(dir, "mcp-changes.json"), "{ invalid json", "utf-8");
    expect(() => log.read()).not.toThrow();
    expect(log.read()).toEqual([]);
  });
});

// ── Auto-prune tests ──────────────────────────────────────────────────────────

describe("RPGMakerWriter backup auto-prune", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempProject();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("prunes old backups keeping only maxBackups most recent", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: true, maxBackups: 3 });
    // Write Actors.json 5 times → 5 backup files created
    for (let i = 0; i < 5; i++) {
      writer.updateActor(1, { name: `Hero${i}` });
    }

    const backupDir = path.join(dir, "backups");
    const backups = fs.readdirSync(backupDir).filter((f) => f.startsWith("Actors_"));
    expect(backups.length).toBeLessThanOrEqual(3);
  });

  it("does not prune when backup count is within limit", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: true, maxBackups: 10 });
    writer.updateActor(1, { name: "Hero1" });
    writer.updateActor(1, { name: "Hero2" });

    const backupDir = path.join(dir, "backups");
    const backups = fs.readdirSync(backupDir).filter((f) => f.startsWith("Actors_"));
    expect(backups.length).toBe(2);
  });
});

// ── MapInfos validation tests ─────────────────────────────────────────────────

describe("RPGMakerWriter writeMap MapInfos validation", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempProject();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const validMapData = {
    width: 17, height: 13, tilesetId: 1, data: [], events: [], scrollType: 0,
    autoplayBgm: false, autoplayBgs: false, battleback1Name: "",
    battleback2Name: "", bgm: {}, bgs: {}, disableDashing: false, displayName: "",
    encounterList: [], encounterStep: 30, note: "", parallaxLoopX: false,
    parallaxLoopY: false, parallaxName: "", parallaxShow: false, parallaxSx: 0,
    parallaxSy: 0, specifyBattleback: false,
  };

  const validMapInfo = { id: 2, name: "Town", parentId: 0, order: 2, expanded: false, scrollX: 0, scrollY: 0 };

  it("writes map without mapInfo (no validation needed)", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    expect(() => writer.writeMap(1, validMapData)).not.toThrow();
  });

  it("accepts valid mapInfo with all required fields", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    writeJson(path.join(dir, "data", "MapInfos.json"), [null, null]);
    expect(() => writer.writeMap(2, validMapData, validMapInfo)).not.toThrow();
  });

  it("rejects mapInfo missing required fields", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    writeJson(path.join(dir, "data", "MapInfos.json"), [null, null]);
    const badInfo = { id: 2, name: "Town" }; // missing parentId, order, expanded, scrollX, scrollY
    expect(() => writer.writeMap(2, validMapData, badInfo)).toThrow(/missing required fields/);
  });

  it("rejects mapInfo whose id does not match mapId", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    writeJson(path.join(dir, "data", "MapInfos.json"), [null, null, null]);
    const wrongIdInfo = { id: 99, name: "Town", parentId: 0, order: 2, expanded: false, scrollX: 0, scrollY: 0 };
    expect(() => writer.writeMap(2, validMapData, wrongIdInfo)).toThrow(/mapInfo.id must equal/);
  });

  it("stores valid mapInfo in MapInfos.json at the correct index", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    writeJson(path.join(dir, "data", "MapInfos.json"), [null]);
    writer.writeMap(2, validMapData, validMapInfo);
    const infos = readJson(path.join(dir, "data", "MapInfos.json")) as unknown[];
    expect(infos[2]).toMatchObject({ id: 2, name: "Town" });
  });

  it("updates System.json versionId after writing a map", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    const beforeVersion = (readJson(path.join(dir, "data", "System.json")) as { versionId: number }).versionId;
    writer.writeMap(1, validMapData);
    const afterVersion = (readJson(path.join(dir, "data", "System.json")) as { versionId: number }).versionId;
    expect(afterVersion).not.toBe(beforeVersion);
  });
});
