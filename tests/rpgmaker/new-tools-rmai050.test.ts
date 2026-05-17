import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/adapters/mz/reader.js";
import { RPGMakerWriter } from "../../src/adapters/mz/writer.js";
import { RPGMakerDebugBridge } from "../../src/adapters/mz/debug-bridge.js";
import { ChangeLog } from "../../src/core/change-log.js";
import { handleExportDialogue } from "../../src/handlers/export-dialogue.js";
import { handleImportDialogue } from "../../src/handlers/import-dialogue.js";
import { handleBatchUpdateEntities } from "../../src/handlers/batch-update-entities.js";
import { handleValidateProject } from "../../src/handlers/validate-project.js";
import { commandInputToEventCommands } from "../../src/adapters/mz/commands.js";
import type { HandlerContext } from "../../src/handlers/types.js";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-rmai050-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);

  writeJson(path.join(dataDir, "Actors.json"), [
    null,
    { id: 1, name: "Hero", note: "protagonist", classId: 1, initialLevel: 1, maxLevel: 99, traits: [], equips: [0, 0, 0, 0, 0], profile: "", nickname: "" },
  ]);

  writeJson(path.join(dataDir, "Enemies.json"), [
    null,
    { id: 1, name: "Slime", params: [100, 0, 10, 5, 8, 5, 5, 5], exp: 10, gold: 5, dropItems: [], actions: [], traits: [], note: "" },
  ]);

  writeJson(path.join(dataDir, "Troops.json"), [
    null,
    { id: 1, name: "Slime Trio", members: [], pages: [] },
  ]);

  writeJson(path.join(dataDir, "CommonEvents.json"), [
    null,
    {
      id: 1,
      name: "Intro",
      trigger: 0,
      switchId: 0,
      list: [
        { code: 101, indent: 0, parameters: ["", 0, 0, 2, "Guard"] },
        { code: 401, indent: 0, parameters: ["Hello, traveler!"] },
        { code: 401, indent: 0, parameters: ["Welcome to the village."] },
        { code: 0, indent: 0, parameters: [] },
      ],
    },
  ]);

  writeJson(path.join(dataDir, "Map001.json"), {
    width: 10,
    height: 10,
    data: [],
    events: [
      null,
      {
        id: 1,
        name: "NPC",
        x: 5,
        y: 5,
        pages: [
          {
            list: [
              { code: 101, indent: 0, parameters: ["", 0, 0, 2, "NPC"] },
              { code: 401, indent: 0, parameters: ["Buy something?"] },
              { code: 0, indent: 0, parameters: [] },
            ],
          },
        ],
      },
    ],
  });

  writeJson(path.join(dataDir, "MapInfos.json"), [
    null,
    { id: 1, name: "Village", parentId: 0, order: 1, expanded: false, scrollX: 0, scrollY: 0 },
  ]);

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

// ── export-dialogue ────────────────────────────────────────────────────────────

describe("handleExportDialogue", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("extracts dialogue from common events", async () => {
    const result = JSON.parse(await handleExportDialogue(makeCtx(dir, {})));
    expect(result.success).toBe(true);
    const ceEntry = result.entries.find(
      (e: { source_type: string }) => e.source_type === "common_event"
    );
    expect(ceEntry).toBeDefined();
    expect(ceEntry.lines).toEqual(["Hello, traveler!", "Welcome to the village."]);
  });

  it("extracts dialogue from map events", async () => {
    const result = JSON.parse(await handleExportDialogue(makeCtx(dir, {})));
    expect(result.success).toBe(true);
    const mapEntry = result.entries.find(
      (e: { source_type: string; lines: string[] }) =>
        e.source_type === "map" && e.lines.includes("Buy something?")
    );
    expect(mapEntry).toBeDefined();
  });

  it("filters by map_ids", async () => {
    const result = JSON.parse(
      await handleExportDialogue(makeCtx(dir, { map_ids: [999] }))
    );
    expect(result.success).toBe(true);
    const mapEntries = result.entries.filter(
      (e: { source_type: string }) => e.source_type === "map"
    );
    expect(mapEntries).toHaveLength(0);
  });

  it("returns correct total_lines count", async () => {
    const result = JSON.parse(await handleExportDialogue(makeCtx(dir, {})));
    const summed = (result.entries as Array<{ lines: string[] }>).reduce(
      (sum, e) => sum + e.lines.length,
      0
    );
    expect(result.total_lines).toBe(summed);
  });

  it("include_common_events: false skips common events", async () => {
    const result = JSON.parse(
      await handleExportDialogue(makeCtx(dir, { include_common_events: false }))
    );
    expect(result.success).toBe(true);
    const ceEntries = result.entries.filter(
      (e: { source_type: string }) => e.source_type === "common_event"
    );
    expect(ceEntries).toHaveLength(0);
  });
});

// ── import-dialogue ────────────────────────────────────────────────────────────

describe("handleImportDialogue", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("updates lines in a common event", async () => {
    // First export to get the correct command_index
    const exported = JSON.parse(await handleExportDialogue(makeCtx(dir, {})));
    const ceEntry = exported.entries.find(
      (e: { source_type: string }) => e.source_type === "common_event"
    );
    expect(ceEntry).toBeDefined();

    // Now import with modified lines
    const importResult = JSON.parse(
      await handleImportDialogue(
        makeCtx(dir, {
          entries: [
            {
              source_type: ceEntry.source_type,
              source_id: ceEntry.source_id,
              event_id: ceEntry.event_id,
              page: ceEntry.page,
              command_index: ceEntry.command_index,
              lines: ["Greetings, hero!", "Safe travels."],
            },
          ],
          confirm: true,
        })
      )
    );
    expect(importResult.success).toBe(true);

    // Verify the file was actually updated
    const ceData = readJson(path.join(dir, "data", "CommonEvents.json")) as Array<{
      id: number;
      list: Array<{ code: number; parameters: unknown[] }>;
    } | null>;
    const ce = ceData.find((e) => e !== null && e.id === 1);
    expect(ce).toBeDefined();
    const line401s = ce!.list.filter((cmd) => cmd.code === 401);
    expect(line401s[0].parameters[0]).toBe("Greetings, hero!");
    expect(line401s[1].parameters[0]).toBe("Safe travels.");
  });

  it("requires confirm: true", async () => {
    const result = JSON.parse(
      await handleImportDialogue(
        makeCtx(dir, {
          entries: [
            { source_type: "common_event", source_id: 1, event_id: 0, page: 0, command_index: 0, lines: ["Test"] },
          ],
          confirm: false,
        })
      )
    );
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/confirm/);
  });

  it("returns error for non-existent source_id", async () => {
    const result = JSON.parse(
      await handleImportDialogue(
        makeCtx(dir, {
          entries: [
            { source_type: "common_event", source_id: 999, event_id: 0, page: 0, command_index: 0, lines: ["Test"] },
          ],
          confirm: true,
        })
      )
    );
    // Should not throw, but should report the error in the errors array
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("reports files_changed correctly", async () => {
    const exported = JSON.parse(await handleExportDialogue(makeCtx(dir, {})));
    const ceEntry = exported.entries.find(
      (e: { source_type: string }) => e.source_type === "common_event"
    );

    const result = JSON.parse(
      await handleImportDialogue(
        makeCtx(dir, {
          entries: [
            {
              source_type: ceEntry.source_type,
              source_id: ceEntry.source_id,
              event_id: ceEntry.event_id,
              page: ceEntry.page,
              command_index: ceEntry.command_index,
              lines: ["Updated line 1.", "Updated line 2."],
            },
          ],
          confirm: true,
        })
      )
    );
    expect(result.files_changed).toContain("CommonEvents.json");
  });
});

// ── batch-update-entities ──────────────────────────────────────────────────────

describe("handleBatchUpdateEntities", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("updates name on multiple enemies", async () => {
    const result = JSON.parse(
      await handleBatchUpdateEntities(
        makeCtx(dir, {
          entity_type: "Enemy",
          entity_ids: [1],
          updates: { name: "Big Slime" },
          confirm: true,
        })
      )
    );
    expect(result.success).toBe(true);
    const enemies = readJson(path.join(dir, "data", "Enemies.json")) as Array<{ id: number; name: string } | null>;
    expect(enemies[1]?.name).toBe("Big Slime");
  });

  it("requires confirm: true", async () => {
    const result = JSON.parse(
      await handleBatchUpdateEntities(
        makeCtx(dir, {
          entity_type: "Enemy",
          entity_ids: [1],
          updates: { name: "Test" },
          confirm: false,
        })
      )
    );
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/confirm/);
  });

  it("rejects unknown entity_type", async () => {
    const result = JSON.parse(
      await handleBatchUpdateEntities(
        makeCtx(dir, {
          entity_type: "Map",
          entity_ids: [1],
          updates: { name: "Test" },
          confirm: true,
        })
      )
    );
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/entity_type/);
  });

  it("reports not-found IDs in results", async () => {
    const result = JSON.parse(
      await handleBatchUpdateEntities(
        makeCtx(dir, {
          entity_type: "Enemy",
          entity_ids: [999],
          updates: { name: "Ghost" },
          confirm: true,
        })
      )
    );
    expect(result.results[0].success).toBe(false);
  });

  it("returns updated count", async () => {
    const result = JSON.parse(
      await handleBatchUpdateEntities(
        makeCtx(dir, {
          entity_type: "Actor",
          entity_ids: [1],
          updates: { name: "Updated Hero" },
          confirm: true,
        })
      )
    );
    expect(result.updated).toBe(1);
  });
});

// ── validate-project (Troop/CommonEvent) ──────────────────────────────────────

describe("handleValidateProject (Troop/CommonEvent)", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("validates Troop entities and catches empty name", async () => {
    writeJson(path.join(dir, "data", "Troops.json"), [
      null,
      { id: 1, name: "", members: [], pages: [] },
    ]);
    const result = JSON.parse(
      await handleValidateProject(makeCtx(dir, { entity_types: ["Troop"] }))
    );
    expect(result.valid).toBe(false);
    expect(result.total_errors).toBeGreaterThan(0);
    const troopIssue = result.issues.find(
      (i: { entity_type: string }) => i.entity_type === "Troop"
    );
    expect(troopIssue).toBeDefined();
  });

  it("validates CommonEvent entities and catches invalid trigger", async () => {
    writeJson(path.join(dir, "data", "CommonEvents.json"), [
      null,
      { id: 1, name: "Bad Event", trigger: 99, switchId: 0, list: [] },
    ]);
    const result = JSON.parse(
      await handleValidateProject(makeCtx(dir, { entity_types: ["CommonEvent"] }))
    );
    expect(result.valid).toBe(false);
    expect(result.total_errors).toBeGreaterThan(0);
    const ceIssue = result.issues.find(
      (i: { entity_type: string }) => i.entity_type === "CommonEvent"
    );
    expect(ceIssue).toBeDefined();
  });
});

// ── new commands (v3.0+) ───────────────────────────────────────────────────────

describe("new commands (v3.0+)", () => {
  it("show-balloon produces code 213", () => {
    const cmds = commandInputToEventCommands({
      type: "show-balloon",
      data: { character_id: -1, balloon_id: 1, wait: true },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(213);
    expect(cmds[0].parameters[0]).toBe(-1);
    expect(cmds[0].parameters[1]).toBe(1);
    expect(cmds[0].parameters[2]).toBe(true);
  });

  it("set-event-location produces code 203", () => {
    const cmds = commandInputToEventCommands({
      type: "set-event-location",
      data: { event_id: 5, location_type: 0, x: 8, y: 3, direction: 0 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(203);
    expect(cmds[0].parameters[0]).toBe(5); // event_id
    expect(cmds[0].parameters[2]).toBe(8); // x
    expect(cmds[0].parameters[3]).toBe(3); // y
  });

  it("move-picture produces code 232", () => {
    const cmds = commandInputToEventCommands({
      type: "move-picture",
      data: { picture_id: 1, x: 400, y: 300, duration: 120, wait: true },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(232);
    expect(cmds[0].parameters[0]).toBe(1); // picture_id
    expect(cmds[0].parameters[3]).toBe(400); // x
    expect(cmds[0].parameters[4]).toBe(300); // y
    expect(cmds[0].parameters[9]).toBe(120); // duration
    expect(cmds[0].parameters[10]).toBe(true); // wait
  });

  it("rotate-picture produces code 233", () => {
    const cmds = commandInputToEventCommands({
      type: "rotate-picture",
      data: { picture_id: 2, speed: 5 },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(233);
    expect(cmds[0].parameters[0]).toBe(2);
    expect(cmds[0].parameters[1]).toBe(5);
  });

  it("change-actor-images produces code 322", () => {
    const cmds = commandInputToEventCommands({
      type: "change-actor-images",
      data: {
        actor_id: 1,
        character_name: "Actor1_Armored",
        character_index: 0,
        face_name: "Actor1_Armored",
        face_index: 0,
        battler_name: "Actor1_SV_Armored",
      },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(322);
    expect(cmds[0].parameters[0]).toBe(1); // actor_id
    expect(cmds[0].parameters[1]).toBe("Actor1_Armored"); // face_name
    expect(cmds[0].parameters[3]).toBe("Actor1_Armored"); // character_name
    expect(cmds[0].parameters[5]).toBe("Actor1_SV_Armored"); // battler_name
  });

  it("toggle-party-member produces code 340", () => {
    const cmds = commandInputToEventCommands({
      type: "toggle-party-member",
      data: { actor_id: 3, enable: false },
    });
    expect(cmds).toHaveLength(1);
    expect(cmds[0].code).toBe(340);
    expect(cmds[0].parameters[0]).toBe(3); // actor_id
    // enable: false → parameter[1] = 1 (disabled)
    expect(cmds[0].parameters[1]).toBe(1);
  });
});
