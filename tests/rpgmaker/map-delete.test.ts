import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/adapters/mz/reader.js";
import { RPGMakerWriter } from "../../src/adapters/mz/writer.js";
import { RPGMakerDebugBridge } from "../../src/adapters/mz/debug-bridge.js";
import { ChangeLog } from "../../src/core/change-log.js";
import { handleDeleteMap } from "../../src/adapters/mz/handlers/map-delete.js";
import type { HandlerContext } from "../../src/adapters/mz/handlers/types.js";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-map-del-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);
  fs.mkdirSync(path.join(dir, "backups"));

  writeJson(path.join(dataDir, "Map001.json"), {
    width: 17, height: 13, data: [], events: [null],
  });
  writeJson(path.join(dataDir, "MapInfos.json"), [
    null,
    { id: 1, name: "Town", parentId: 0, order: 1, expanded: false, scrollX: 0, scrollY: 0 },
  ]);
  writeJson(path.join(dataDir, "System.json"), { gameTitle: "Test", versionId: 1 });

  return dir;
}

function makeCtx(dir: string, input: Record<string, unknown>): HandlerContext {
  return {
    reader: new RPGMakerReader({ projectPath: dir }),
    writer: new RPGMakerWriter({ projectPath: dir, createBackup: true }),
    input,
    projectPath: dir,
    debugBridge: new RPGMakerDebugBridge(),
    changeLog: new ChangeLog(dir),
    debug: false,
  };
}

describe("handleDeleteMap", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("deletes the map file and nulls MapInfos entry", async () => {
    const result = JSON.parse(await handleDeleteMap(makeCtx(dir, { map_id: 1, confirm: true })));

    expect(result.success).toBe(true);
    expect(result.map_id).toBe(1);
    expect(fs.existsSync(path.join(dir, "data", "Map001.json"))).toBe(false);

    const infos = JSON.parse(fs.readFileSync(path.join(dir, "data", "MapInfos.json"), "utf-8")) as Array<unknown>;
    expect(infos[1]).toBeNull();
  });

  it("creates a backup of the map file", async () => {
    await handleDeleteMap(makeCtx(dir, { map_id: 1, confirm: true }));
    const backupFiles = fs.readdirSync(path.join(dir, "backups"));
    expect(backupFiles.some((f) => f.startsWith("Map001_"))).toBe(true);
  });

  it("returns error when confirm is false", async () => {
    const result = JSON.parse(await handleDeleteMap(makeCtx(dir, { map_id: 1, confirm: false })));
    expect(result.error).toBeDefined();
    expect(fs.existsSync(path.join(dir, "data", "Map001.json"))).toBe(true);
  });

  it("returns error when confirm is missing", async () => {
    const result = JSON.parse(await handleDeleteMap(makeCtx(dir, { map_id: 1 })));
    expect(result.error).toBeDefined();
  });

  it("returns error when map_id is missing", async () => {
    const result = JSON.parse(await handleDeleteMap(makeCtx(dir, { confirm: true })));
    expect(result.error).toBeDefined();
  });

  it("returns error when map file does not exist", async () => {
    const result = JSON.parse(await handleDeleteMap(makeCtx(dir, { map_id: 99, confirm: true })));
    expect(result.error).toBeDefined();
  });

  it("appends to change log on success", async () => {
    const ctx = makeCtx(dir, { map_id: 1, confirm: true });
    await handleDeleteMap(ctx);
    const entries = ctx.changeLog.read();
    expect(entries[0].tool).toBe("delete-map");
    expect(entries[0].action).toBe("delete");
    expect(entries[0].entityId).toBe(1);
  });
});
