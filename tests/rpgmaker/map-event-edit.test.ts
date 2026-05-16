import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/adapters/mz/reader.js";
import { RPGMakerWriter } from "../../src/adapters/mz/writer.js";
import { RPGMakerDebugBridge } from "../../src/adapters/mz/debug-bridge.js";
import { ChangeLog } from "../../src/core/change-log.js";
import { handleEditMapEvent, handleDeleteMapEvent } from "../../src/adapters/mz/handlers/map-event-edit.js";
import type { HandlerContext } from "../../src/adapters/mz/handlers/types.js";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-meedit-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);

  writeJson(path.join(dataDir, "Map001.json"), {
    width: 20,
    height: 15,
    data: [],
    events: [
      null,
      {
        id: 1, name: "NPC", note: "", x: 5, y: 5,
        pages: [
          {
            conditions: {},
            directionFix: false,
            image: {},
            list: [
              { code: 101, indent: 0, parameters: ["", 0, 0, 2, "NPC"] },
              { code: 401, indent: 0, parameters: ["Hello!"] },
              { code: 0, indent: 0, parameters: [] },
            ],
            moveFrequency: 3,
            moveRoute: {},
            moveSpeed: 3,
            moveType: 0,
            priorityType: 1,
            stepAnime: false,
            through: false,
            trigger: 0,
            walkAnime: true,
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

describe("handleEditMapEvent", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("renames an event", async () => {
    const result = JSON.parse(await handleEditMapEvent(makeCtx(dir, { map_id: 1, event_id: 1, name: "Guard" })));
    expect(result.success).toBe(true);
    expect(result.updated).toContain("name");

    const map = readJson(path.join(dir, "data", "Map001.json")) as { events: Array<{ name: string } | null> };
    expect(map.events[1]?.name).toBe("Guard");
  });

  it("moves an event to a new position", async () => {
    const result = JSON.parse(await handleEditMapEvent(makeCtx(dir, { map_id: 1, event_id: 1, x: 10, y: 8 })));
    expect(result.success).toBe(true);
    expect(result.updated).toContain("x");
    expect(result.updated).toContain("y");

    const map = readJson(path.join(dir, "data", "Map001.json")) as { events: Array<{ x: number; y: number } | null> };
    expect(map.events[1]?.x).toBe(10);
    expect(map.events[1]?.y).toBe(8);
  });

  it("updates note", async () => {
    const result = JSON.parse(await handleEditMapEvent(makeCtx(dir, { map_id: 1, event_id: 1, note: "important" })));
    expect(result.success).toBe(true);

    const map = readJson(path.join(dir, "data", "Map001.json")) as { events: Array<{ note: string } | null> };
    expect(map.events[1]?.note).toBe("important");
  });

  it("appends commands before the terminator", async () => {
    const result = JSON.parse(await handleEditMapEvent(makeCtx(dir, {
      map_id: 1,
      event_id: 1,
      append_commands: [{ type: "message", data: "Goodbye!" }],
    })));
    expect(result.success).toBe(true);

    const map = readJson(path.join(dir, "data", "Map001.json")) as {
      events: Array<{ pages: Array<{ list: Array<{ code: number }> }> } | null>
    };
    const list = map.events[1]?.pages[0]?.list ?? [];
    const last = list[list.length - 1];
    expect(last.code).toBe(0); // terminator still at end
    expect(list.length).toBeGreaterThan(3); // new commands inserted
  });

  it("returns error when out-of-bounds coordinates are provided", async () => {
    const result = JSON.parse(await handleEditMapEvent(makeCtx(dir, { map_id: 1, event_id: 1, x: 999 })));
    expect(result.error).toBeDefined();
  });

  it("returns error when map does not exist", async () => {
    const result = JSON.parse(await handleEditMapEvent(makeCtx(dir, { map_id: 99, event_id: 1, name: "x" })));
    expect(result.error).toBeDefined();
  });

  it("returns error when event does not exist", async () => {
    const result = JSON.parse(await handleEditMapEvent(makeCtx(dir, { map_id: 1, event_id: 99, name: "x" })));
    expect(result.error).toBeDefined();
  });

  it("returns error when no fields provided", async () => {
    const result = JSON.parse(await handleEditMapEvent(makeCtx(dir, { map_id: 1, event_id: 1 })));
    expect(result.error).toBeDefined();
  });

  it("appends to change log", async () => {
    const ctx = makeCtx(dir, { map_id: 1, event_id: 1, name: "Updated" });
    await handleEditMapEvent(ctx);
    const entries = ctx.changeLog.read();
    expect(entries[0].tool).toBe("edit-map-event");
    expect(entries[0].entityId).toBe(1);
  });
});

describe("handleDeleteMapEvent", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("nulls the event in the map", async () => {
    const result = JSON.parse(await handleDeleteMapEvent(makeCtx(dir, { map_id: 1, event_id: 1 })));
    expect(result.success).toBe(true);

    const map = readJson(path.join(dir, "data", "Map001.json")) as { events: Array<unknown> };
    expect(map.events[1]).toBeNull();
  });

  it("returns error when event not found", async () => {
    const result = JSON.parse(await handleDeleteMapEvent(makeCtx(dir, { map_id: 1, event_id: 99 })));
    expect(result.error).toBeDefined();
  });

  it("returns error when map not found", async () => {
    const result = JSON.parse(await handleDeleteMapEvent(makeCtx(dir, { map_id: 99, event_id: 1 })));
    expect(result.error).toBeDefined();
  });

  it("appends to change log", async () => {
    const ctx = makeCtx(dir, { map_id: 1, event_id: 1 });
    await handleDeleteMapEvent(ctx);
    const entries = ctx.changeLog.read();
    expect(entries[0].tool).toBe("delete-map-event");
    expect(entries[0].action).toBe("delete");
  });
});
