import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/adapters/mz/reader.js";
import { RPGMakerWriter } from "../../src/adapters/mz/writer.js";
import { RPGMakerDebugBridge } from "../../src/adapters/mz/debug-bridge.js";
import { ChangeLog } from "../../src/core/change-log.js";
import { handleListMaps } from "../../src/handlers/map-list.js";
import type { HandlerContext } from "../../src/handlers/types.js";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-map-list-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);

  writeJson(path.join(dataDir, "MapInfos.json"), [
    null,
    { id: 1, name: "Town", parentId: 0, order: 2, expanded: false, scrollX: 0, scrollY: 0 },
    { id: 2, name: "Dungeon", parentId: 0, order: 1, expanded: false, scrollX: 0, scrollY: 0 },
    null,
  ]);

  return dir;
}

function makeCtx(dir: string): HandlerContext {
  return {
    reader: new RPGMakerReader({ projectPath: dir }),
    writer: new RPGMakerWriter({ projectPath: dir, createBackup: false }),
    input: {},
    projectPath: dir,
    debugBridge: new RPGMakerDebugBridge(),
    changeLog: new ChangeLog(dir),
    debug: false,
  };
}

describe("handleListMaps", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("returns all non-null maps sorted by order", async () => {
    const result = JSON.parse(await handleListMaps(makeCtx(dir)));

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.maps[0].name).toBe("Dungeon"); // order: 1
    expect(result.maps[1].name).toBe("Town");    // order: 2
  });

  it("returns id, name, parent_id, order, expanded fields", async () => {
    const result = JSON.parse(await handleListMaps(makeCtx(dir)));
    const town = result.maps.find((m: { name: string }) => m.name === "Town");

    expect(town).toBeDefined();
    expect(town.id).toBe(1);
    expect(town.parent_id).toBe(0);
    expect(town.order).toBe(2);
    expect(town.expanded).toBe(false);
  });

  it("handles MapInfos.json with only null entries", async () => {
    writeJson(path.join(dir, "data", "MapInfos.json"), [null, null]);
    const result = JSON.parse(await handleListMaps(makeCtx(dir)));

    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
    expect(result.maps).toEqual([]);
  });

  it("returns error when MapInfos.json is missing", async () => {
    fs.unlinkSync(path.join(dir, "data", "MapInfos.json"));
    const result = JSON.parse(await handleListMaps(makeCtx(dir)));

    expect(result.error).toBeDefined();
  });
});
