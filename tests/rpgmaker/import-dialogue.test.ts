import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/adapters/mz/reader.js";
import { RPGMakerWriter } from "../../src/adapters/mz/writer.js";
import { RPGMakerDebugBridge } from "../../src/adapters/mz/debug-bridge.js";
import { ChangeLog } from "../../src/core/change-log.js";
import { handleImportDialogue } from "../../src/adapters/mz/handlers/import-dialogue.js";
import type { HandlerContext } from "../../src/adapters/mz/handlers/types.js";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-import-dialogue-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);

  // Minimal map with a message (code 101) followed by ONE continuation block (code 401)
  writeJson(path.join(dataDir, "Map001.json"), {
    displayName: "Test Map",
    width: 17,
    height: 13,
    tilesetId: 1,
    encounterStep: 30,
    encounterList: [],
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
    events: [
      null,
      {
        id: 1,
        name: "NPC",
        note: "",
        x: 2,
        y: 3,
        pages: [
          {
            conditions: {
              actorId: 1, actorValid: false, itemId: 1, itemValid: false,
              selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1,
              switch1Valid: false, switch2Id: 1, switch2Valid: false,
              variableId: 1, variableValid: false, variableValue: 0,
            },
            directionFix: false,
            image: { characterIndex: 0, characterName: "", direction: 2, pattern: 0, tileId: 0 },
            moveFrequency: 3,
            moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
            moveSpeed: 3,
            moveType: 0,
            priorityType: 1,
            stepAnime: false,
            through: false,
            trigger: 0,
            walkAnime: true,
            list: [
              { code: 101, indent: 0, parameters: ["", 0, 0, 2, ""] },
              { code: 401, indent: 0, parameters: ["Original line 1"] },
              { code: 0, indent: 0, parameters: [] },
            ],
          },
        ],
      },
    ],
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

describe("handleImportDialogue", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("updates a single line when entry.lines matches continuation block count", async () => {
    const result = JSON.parse(
      await handleImportDialogue(makeCtx(dir, {
        confirm: true,
        entries: [
          {
            source_type: "map",
            source_id: 1,
            event_id: 1,
            page: 0,
            command_index: 0,
            lines: ["Updated line 1"],
          },
        ],
      }))
    );
    expect(result.success).toBe(true);
    expect(result.total_lines_updated).toBe(1);
    const mapData = readJson(path.join(dir, "data", "Map001.json")) as Record<string, unknown>;
    const events = mapData.events as Array<Record<string, unknown> | null>;
    const page = (events[1]!.pages as Array<Record<string, unknown>>)[0];
    const list = page.list as Array<Record<string, unknown>>;
    expect((list[1].parameters as unknown[])[0]).toBe("Updated line 1");
  });

  it("reports a warning when entry.lines has more elements than continuation blocks", async () => {
    // The map only has ONE code-401 block, but we provide TWO lines
    const result = JSON.parse(
      await handleImportDialogue(makeCtx(dir, {
        confirm: true,
        entries: [
          {
            source_type: "map",
            source_id: 1,
            event_id: 1,
            page: 0,
            command_index: 0,
            lines: ["Line one", "Line two — will be discarded"],
          },
        ],
      }))
    );
    // The first line was written, so total_lines_updated > 0
    expect(result.total_lines_updated).toBe(1);
    // The result should include an error about discarded lines
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/discarded/i);
  });

  it("returns error when confirm is not true", async () => {
    const result = JSON.parse(
      await handleImportDialogue(makeCtx(dir, {
        confirm: false,
        entries: [
          {
            source_type: "map",
            source_id: 1,
            event_id: 1,
            page: 0,
            command_index: 0,
            lines: ["Hello"],
          },
        ],
      }))
    );
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/confirm/i);
  });

  it("returns error when entries is empty", async () => {
    const result = JSON.parse(
      await handleImportDialogue(makeCtx(dir, { confirm: true, entries: [] }))
    );
    expect(result.error).toBeDefined();
  });

  it("reports error for non-existent event", async () => {
    const result = JSON.parse(
      await handleImportDialogue(makeCtx(dir, {
        confirm: true,
        entries: [
          {
            source_type: "map",
            source_id: 1,
            event_id: 999,
            page: 0,
            command_index: 0,
            lines: ["Hello"],
          },
        ],
      }))
    );
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
