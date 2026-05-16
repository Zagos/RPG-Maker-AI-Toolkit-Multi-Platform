import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/adapters/mz/reader.js";
import { RPGMakerWriter } from "../../src/adapters/mz/writer.js";
import { RPGMakerDebugBridge } from "../../src/adapters/mz/debug-bridge.js";
import { ChangeLog } from "../../src/core/change-log.js";
import { handleCreateCommonEvent, handleEditCommonEvent } from "../../src/adapters/mz/handlers/common-event.js";
import type { HandlerContext } from "../../src/adapters/mz/handlers/types.js";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-ce-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);
  writeJson(path.join(dataDir, "CommonEvents.json"), [
    null,
    { id: 1, name: "Existing Shop", trigger: 0, switchId: 1, list: [{ code: 0, indent: 0, parameters: [] }] },
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

describe("handleCreateCommonEvent", () => {
  let dir: string;
  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("creates a call-only event (trigger 0) and returns new ID", async () => {
    const ctx = makeCtx(dir, { name: "Treasure Chest Logic", trigger: 0 });
    const result = JSON.parse(await handleCreateCommonEvent(ctx));
    expect(result.success).toBe(true);
    expect(result.event_id).toBe(2);
    expect(result.name).toBe("Treasure Chest Logic");
    expect(result.trigger).toBe(0);
  });

  it("persists the event in CommonEvents.json", async () => {
    const ctx = makeCtx(dir, { name: "Battle Intro", trigger: 0 });
    await handleCreateCommonEvent(ctx);
    const events = readJson(path.join(dir, "data", "CommonEvents.json")) as Array<Record<string, unknown> | null>;
    const created = events.find((e) => e !== null && e.name === "Battle Intro") as Record<string, unknown>;
    expect(created).toBeDefined();
    expect(created.trigger).toBe(0);
  });

  it("always appends a terminating command (code 0)", async () => {
    const ctx = makeCtx(dir, {
      name: "Script Event",
      commands: [{ type: "message", data: "Hello!" }],
    });
    await handleCreateCommonEvent(ctx);
    const events = readJson(path.join(dir, "data", "CommonEvents.json")) as Array<Record<string, unknown> | null>;
    const created = events.find((e) => e !== null && (e as Record<string, unknown>).name === "Script Event") as Record<string, unknown>;
    const list = created.list as Array<{ code: number }>;
    expect(list[list.length - 1].code).toBe(0);
  });

  it("creates an autorun event (trigger 1) with switch_id", async () => {
    const ctx = makeCtx(dir, { name: "Intro Cutscene", trigger: 1, switch_id: 3 });
    const result = JSON.parse(await handleCreateCommonEvent(ctx));
    expect(result.success).toBe(true);
    const events = readJson(path.join(dir, "data", "CommonEvents.json")) as Array<Record<string, unknown> | null>;
    const created = events.find((e) => e !== null && (e as Record<string, unknown>).name === "Intro Cutscene") as Record<string, unknown>;
    expect(created.trigger).toBe(1);
    expect(created.switchId).toBe(3);
  });

  it("returns error when name is missing", async () => {
    const result = JSON.parse(await handleCreateCommonEvent(makeCtx(dir, { trigger: 0 })));
    expect(result.error).toBeDefined();
  });

  it("returns error for invalid trigger value", async () => {
    const result = JSON.parse(await handleCreateCommonEvent(makeCtx(dir, { name: "X", trigger: 5 })));
    expect(result.error).toBeDefined();
  });

  it("appends to change log", async () => {
    const ctx = makeCtx(dir, { name: "Logged", trigger: 0 });
    await handleCreateCommonEvent(ctx);
    const entries = ctx.changeLog.read();
    expect(entries[0].tool).toBe("create-common-event");
    expect(entries[0].action).toBe("create");
  });
});

describe("handleEditCommonEvent", () => {
  let dir: string;
  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("renames an existing common event", async () => {
    const ctx = makeCtx(dir, { event_id: 1, name: "Item Shop" });
    const result = JSON.parse(await handleEditCommonEvent(ctx));
    expect(result.success).toBe(true);
    expect(result.updated).toContain("name");
    const events = readJson(path.join(dir, "data", "CommonEvents.json")) as Array<Record<string, unknown> | null>;
    expect((events[1] as Record<string, unknown>).name).toBe("Item Shop");
  });

  it("updates trigger and switch_id", async () => {
    const ctx = makeCtx(dir, { event_id: 1, trigger: 2, switch_id: 5 });
    const result = JSON.parse(await handleEditCommonEvent(ctx));
    expect(result.success).toBe(true);
    const events = readJson(path.join(dir, "data", "CommonEvents.json")) as Array<Record<string, unknown> | null>;
    const e = events[1] as Record<string, unknown>;
    expect(e.trigger).toBe(2);
    expect(e.switchId).toBe(5);
  });

  it("replaces the command list", async () => {
    const ctx = makeCtx(dir, {
      event_id: 1,
      commands: [{ type: "message", data: "New text" }],
    });
    const result = JSON.parse(await handleEditCommonEvent(ctx));
    expect(result.success).toBe(true);
    const events = readJson(path.join(dir, "data", "CommonEvents.json")) as Array<Record<string, unknown> | null>;
    const list = (events[1] as Record<string, unknown>).list as Array<{ code: number }>;
    expect(list.length).toBeGreaterThan(1);
    expect(list[list.length - 1].code).toBe(0);
  });

  it("returns error when event_id does not exist", async () => {
    const result = JSON.parse(await handleEditCommonEvent(makeCtx(dir, { event_id: 99, name: "Ghost" })));
    expect(result.error).toBeDefined();
  });

  it("returns error when no fields provided", async () => {
    const result = JSON.parse(await handleEditCommonEvent(makeCtx(dir, { event_id: 1 })));
    expect(result.error).toMatch(/No fields/);
  });

  it("appends to change log", async () => {
    const ctx = makeCtx(dir, { event_id: 1, name: "Updated" });
    await handleEditCommonEvent(ctx);
    const entries = ctx.changeLog.read();
    expect(entries[0].tool).toBe("edit-common-event");
    expect(entries[0].action).toBe("update");
  });
});
