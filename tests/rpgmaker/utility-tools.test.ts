import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/rpgmaker/reader.js";
import { RPGMakerWriter } from "../../src/rpgmaker/writer.js";
import { RPGMakerDebugBridge } from "../../src/rpgmaker/debug-bridge.js";
import { ChangeLog } from "../../src/rpgmaker/change-log.js";
import { handleSearchEntity } from "../../src/handlers/search-entity.js";
import { handleDuplicateEntity } from "../../src/handlers/duplicate-entity.js";
import { handleExportProjectSummary } from "../../src/handlers/project-summary.js";
import { handleEditMapInfo } from "../../src/handlers/map-info.js";
import { handleValidateProject } from "../../src/handlers/validate-project.js";
import { handleFindAndReplace } from "../../src/handlers/find-and-replace.js";
import { handleCopyMap } from "../../src/handlers/copy-map.js";
import { handleCleanupProject } from "../../src/handlers/cleanup-project.js";
import type { HandlerContext } from "../../src/handlers/types.js";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-utility-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);

  writeJson(path.join(dataDir, "Actors.json"), [
    null,
    { id: 1, name: "Harold", classId: 1, initialLevel: 1, maxLevel: 99, traits: [], note: "hero note" },
    { id: 2, name: "Therese", classId: 2, initialLevel: 1, maxLevel: 99, traits: [], note: "" },
  ]);
  writeJson(path.join(dataDir, "Items.json"), [
    null,
    { id: 1, name: "Potion", description: "Heals HP", price: 50, effects: [], note: "" },
  ]);
  writeJson(path.join(dataDir, "Weapons.json"), [
    null,
    { id: 1, name: "Sword", wtypeId: 1, traits: [], note: "" },
  ]);
  writeJson(path.join(dataDir, "Armors.json"), [
    null,
    { id: 1, name: "Shield", atypeId: 1, traits: [], note: "" },
  ]);
  writeJson(path.join(dataDir, "Skills.json"), [
    null,
    { id: 1, name: "Fire", stypeId: 1, mpCost: 10, effects: [], traits: [], note: "" },
  ]);
  writeJson(path.join(dataDir, "Classes.json"), [
    null,
    { id: 1, name: "Warrior", traits: [], note: "" },
  ]);
  writeJson(path.join(dataDir, "States.json"), [
    null,
    { id: 1, name: "Poison", traits: [], note: "" },
  ]);
  writeJson(path.join(dataDir, "Enemies.json"), [
    null,
    { id: 1, name: "Slime", battlerName: "", actions: [], traits: [], note: "" },
  ]);
  writeJson(path.join(dataDir, "Troops.json"), [
    null,
    { id: 1, name: "Forest Goblins", members: [], pages: [] },
  ]);
  writeJson(path.join(dataDir, "CommonEvents.json"), [
    null,
    { id: 1, name: "Game Start", trigger: 0, switchId: 1, list: [] },
  ]);
  writeJson(path.join(dataDir, "Animations.json"), [
    null,
    { id: 1, name: "Fire Anim", effectName: "", displayType: 0, flashTimings: [], soundTimings: [] },
  ]);
  writeJson(path.join(dataDir, "System.json"), {
    gameTitle: "Test",
    versionId: 1,
    switches: ["", "Switch A", "Switch B"],
    variables: ["", "Var A"],
  });
  writeJson(path.join(dataDir, "MapInfos.json"), [
    null,
    { id: 1, name: "Town", parentId: 0, order: 1, expanded: false, scrollX: 0, scrollY: 0 },
  ]);

  // Map file for copy-map tests
  writeJson(path.join(dataDir, "Map001.json"), {
    displayName: "Town",
    width: 17,
    height: 13,
    tilesetId: 1,
    encounterStep: 30,
    encounterList: [],
    events: [null],
    data: [],
    bgm: { name: "", pan: 0, pitch: 100, volume: 90 },
    bgs: { name: "", pan: 0, pitch: 100, volume: 90 },
    autoplayBgm: false,
    autoplayBgs: false,
    parallaxName: "",
    parallaxLoopX: false,
    parallaxLoopY: false,
    parallaxSx: 0,
    parallaxSy: 0,
    parallaxShow: false,
    scrollType: 0,
    specifyBattleback: false,
    battleback1Name: "",
    battleback2Name: "",
    note: "",
    enableNameDisplay: false,
  });

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

// ── search-entity ─────────────────────────────────────────────────────────────

describe("handleSearchEntity", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("finds actors by name substring", async () => {
    const result = JSON.parse(
      await handleSearchEntity(makeCtx(dir, { entity_type: "Actor", query: "har", field: "name" }))
    );
    expect(result.success).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);
    expect((result.results[0] as { name: string }).name).toBe("Harold");
  });

  it("returns empty results when no match", async () => {
    const result = JSON.parse(
      await handleSearchEntity(makeCtx(dir, { entity_type: "Actor", query: "zzz" }))
    );
    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(0);
  });

  it("returns error for unknown entity_type", async () => {
    const result = JSON.parse(
      await handleSearchEntity(makeCtx(dir, { entity_type: "Dragon", query: "x" }))
    );
    expect(result.error).toBeDefined();
  });
});

// ── duplicate-entity ──────────────────────────────────────────────────────────

describe("handleDuplicateEntity", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("duplicates an actor with a new name", async () => {
    const result = JSON.parse(
      await handleDuplicateEntity(
        makeCtx(dir, { entity_type: "Actor", entity_id: 1, new_name: "Harold Clone" })
      )
    );
    expect(result.success).toBe(true);
    expect(result.new_id).toBeGreaterThan(1);
    expect(result.new_name).toBe("Harold Clone");
    expect(result.source_id).toBe(1);

    const actors = readJson(path.join(dir, "data", "Actors.json")) as Array<{ id: number; name: string } | null>;
    const clone = actors.find((a) => a !== null && a.id === result.new_id);
    expect(clone).toBeDefined();
    expect(clone?.name).toBe("Harold Clone");
  });

  it("returns error when source entity not found", async () => {
    const result = JSON.parse(
      await handleDuplicateEntity(
        makeCtx(dir, { entity_type: "Actor", entity_id: 999, new_name: "Ghost" })
      )
    );
    expect(result.error).toBeDefined();
  });
});

// ── export-project-summary ────────────────────────────────────────────────────

describe("handleExportProjectSummary", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("returns summary with actors, items, and other entity lists", async () => {
    const result = JSON.parse(await handleExportProjectSummary(makeCtx(dir, {})));
    expect(result.success).toBe(true);
    expect(result.summary).toBeDefined();
    expect(Array.isArray(result.summary.actors)).toBe(true);
    expect(result.summary.actors.length).toBeGreaterThan(0);
    expect(Array.isArray(result.summary.items)).toBe(true);
    expect(Array.isArray(result.summary.enemies)).toBe(true);
  });
});

// ── edit-map-info ─────────────────────────────────────────────────────────────

describe("handleEditMapInfo", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("updates map name in MapInfos.json", async () => {
    const result = JSON.parse(
      await handleEditMapInfo(makeCtx(dir, { map_id: 1, name: "Renamed Town" }))
    );
    expect(result.success).toBe(true);
    const mapInfos = readJson(path.join(dir, "data", "MapInfos.json")) as Array<{ id: number; name: string } | null>;
    expect(mapInfos[1]?.name).toBe("Renamed Town");
  });

  it("returns error for non-existent map", async () => {
    const result = JSON.parse(
      await handleEditMapInfo(makeCtx(dir, { map_id: 999, name: "Ghost Map" }))
    );
    expect(result.error).toBeDefined();
  });
});

// ── validate-project ──────────────────────────────────────────────────────────

describe("handleValidateProject", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("returns valid:true for a clean project", async () => {
    const result = JSON.parse(await handleValidateProject(makeCtx(dir, {})));
    expect(result.success).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.total_errors).toBe(0);
  });

  it("returns issues for an actor with empty name", async () => {
    // Overwrite Actors.json with an actor that has no name
    writeJson(path.join(dir, "data", "Actors.json"), [
      null,
      { id: 1, name: "", classId: 1, initialLevel: 1, maxLevel: 99, traits: [] },
    ]);
    const result = JSON.parse(await handleValidateProject(makeCtx(dir, {})));
    expect(result.valid).toBe(false);
    expect(result.total_errors).toBeGreaterThan(0);
    const actorIssue = result.issues.find((i: { entity_type: string }) => i.entity_type === "Actor");
    expect(actorIssue).toBeDefined();
  });

  it("filters by entity_types when specified", async () => {
    const result = JSON.parse(
      await handleValidateProject(makeCtx(dir, { entity_types: ["Actor"] }))
    );
    expect(result.success).toBe(true);
    // Only actors should be checked — all other types are not in issues
    for (const issue of result.issues as Array<{ entity_type: string }>) {
      expect(issue.entity_type).toBe("Actor");
    }
  });
});

// ── find-and-replace ──────────────────────────────────────────────────────────

describe("handleFindAndReplace", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("replaces text in entity names", async () => {
    const result = JSON.parse(
      await handleFindAndReplace(
        makeCtx(dir, { find: "Harold", replace: "Hero", confirm: true, targets: ["names"] })
      )
    );
    expect(result.success).toBe(true);
    expect(result.total_replacements).toBeGreaterThan(0);
    const actors = readJson(path.join(dir, "data", "Actors.json")) as Array<{ id: number; name: string } | null>;
    expect(actors[1]?.name).toBe("Hero");
  });

  it("replaces text in entity notes", async () => {
    const result = JSON.parse(
      await handleFindAndReplace(
        makeCtx(dir, { find: "hero note", replace: "brave note", confirm: true, targets: ["notes"] })
      )
    );
    expect(result.success).toBe(true);
    expect(result.total_replacements).toBeGreaterThan(0);
    const actors = readJson(path.join(dir, "data", "Actors.json")) as Array<{ id: number; name: string; note: string } | null>;
    expect(actors[1]?.note).toBe("brave note");
  });

  it("returns total_replacements count", async () => {
    const result = JSON.parse(
      await handleFindAndReplace(
        makeCtx(dir, { find: "Harold", replace: "X", confirm: true, targets: ["names"] })
      )
    );
    expect(typeof result.total_replacements).toBe("number");
    expect(result.total_replacements).toBeGreaterThanOrEqual(1);
  });

  it("rejects when confirm is not true", async () => {
    const result = JSON.parse(
      await handleFindAndReplace(
        makeCtx(dir, { find: "Harold", replace: "X", confirm: false })
      )
    );
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/confirm/);
  });

  it("returns files_changed list", async () => {
    const result = JSON.parse(
      await handleFindAndReplace(
        makeCtx(dir, { find: "Harold", replace: "Hero", confirm: true, targets: ["names"] })
      )
    );
    expect(Array.isArray(result.files_changed)).toBe(true);
    expect(result.files_changed).toContain("Actors.json");
  });

  it("replaces in nickname and profile fields when scope is notes", async () => {
    // Set up an actor with nickname and profile containing the search term
    writeJson(path.join(dir, "data", "Actors.json"), [
      null,
      {
        id: 1,
        name: "Harold",
        classId: 1,
        initialLevel: 1,
        maxLevel: 99,
        traits: [],
        note: "",
        nickname: "The Hero",
        profile: "A brave warrior named Hero",
      },
    ]);

    const result = JSON.parse(
      await handleFindAndReplace(
        makeCtx(dir, { find: "Hero", replace: "Legend", confirm: true, targets: ["notes"] })
      )
    );
    expect(result.success).toBe(true);
    expect(result.total_replacements).toBeGreaterThanOrEqual(2);

    const actors = readJson(path.join(dir, "data", "Actors.json")) as Array<{
      id: number; name: string; nickname: string; profile: string;
    } | null>;
    // nickname: "The Hero" → "The Legend"
    expect(actors[1]?.nickname).toBe("The Legend");
    // profile: "A brave warrior named Hero" → "A brave warrior named Legend"
    expect(actors[1]?.profile).toBe("A brave warrior named Legend");
    // name should be unchanged (targets=["notes"] does not include "names")
    expect(actors[1]?.name).toBe("Harold");
  });
});

// ── copy-map ──────────────────────────────────────────────────────────────────

describe("handleCopyMap", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("creates a new map file and adds entry to MapInfos.json", async () => {
    const result = JSON.parse(
      await handleCopyMap(makeCtx(dir, { source_map_id: 1, new_name: "Town Copy" }))
    );
    expect(result.success).toBe(true);
    expect(result.new_map_id).toBeGreaterThan(1);
    expect(result.name).toBe("Town Copy");
    expect(result.copied_from).toBe(1);

    const newMapFile = path.join(dir, "data", `Map${String(result.new_map_id).padStart(3, "0")}.json`);
    expect(fs.existsSync(newMapFile)).toBe(true);

    const mapInfos = readJson(path.join(dir, "data", "MapInfos.json")) as Array<{ id: number; name: string } | null>;
    const entry = mapInfos[result.new_map_id];
    expect(entry).toBeDefined();
    expect((entry as { name: string }).name).toBe("Town Copy");
  });

  it("fails when source map does not exist", async () => {
    const result = JSON.parse(
      await handleCopyMap(makeCtx(dir, { source_map_id: 999, new_name: "Ghost Copy" }))
    );
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/not found/i);
  });

  it("fails when new_name is missing", async () => {
    const result = JSON.parse(
      await handleCopyMap(makeCtx(dir, { source_map_id: 1 }))
    );
    expect(result.error).toBeDefined();
  });
});

// ── cleanup-project ───────────────────────────────────────────────────────────

describe("handleCleanupProject", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("reports null_slots correctly for entity files", async () => {
    // Actors.json has [null, actor1, actor2] → 1 null slot
    const result = JSON.parse(await handleCleanupProject(makeCtx(dir, {})));
    expect(result.success).toBe(true);
    const actorReport = result.report.find((r: { entity_type: string }) => r.entity_type === "Actor");
    expect(actorReport).toBeDefined();
    expect(actorReport.null_slots).toBe(1); // only the leading null
    expect(actorReport.active_entities).toBe(2);
  });

  it("does not modify any files (read-only)", async () => {
    const actorsBefore = JSON.stringify(readJson(path.join(dir, "data", "Actors.json")));
    await handleCleanupProject(makeCtx(dir, {}));
    const actorsAfter = JSON.stringify(readJson(path.join(dir, "data", "Actors.json")));
    expect(actorsBefore).toBe(actorsAfter);
  });

  it("filters by entity_types when specified", async () => {
    const result = JSON.parse(
      await handleCleanupProject(makeCtx(dir, { entity_types: ["Actor", "Item"] }))
    );
    expect(result.success).toBe(true);
    // Only Actor and Item should appear in report
    for (const entry of result.report as Array<{ entity_type: string }>) {
      expect(["Actor", "Item"]).toContain(entry.entity_type);
    }
    expect(result.report).toHaveLength(2);
  });
});
