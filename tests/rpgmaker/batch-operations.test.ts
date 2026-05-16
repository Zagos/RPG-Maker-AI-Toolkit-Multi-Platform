import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/adapters/mz/reader.js";
import { RPGMakerWriter } from "../../src/adapters/mz/writer.js";
import { RPGMakerDebugBridge } from "../../src/adapters/mz/debug-bridge.js";
import { ChangeLog } from "../../src/core/change-log.js";
import { handleBatchCreateEntities } from "../../src/adapters/mz/handlers/batch-create-entities.js";
import { handleBatchDeleteEntities } from "../../src/adapters/mz/handlers/batch-delete-entities.js";
import type { HandlerContext } from "../../src/adapters/mz/handlers/types.js";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-batchops-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);

  const existing = [null, { id: 1, name: "Existing" }];

  writeJson(path.join(dataDir, "Actors.json"), existing);
  writeJson(path.join(dataDir, "Items.json"), existing);
  writeJson(path.join(dataDir, "Weapons.json"), existing);
  writeJson(path.join(dataDir, "Armors.json"), existing);
  writeJson(path.join(dataDir, "Skills.json"), existing);
  writeJson(path.join(dataDir, "Classes.json"), existing);
  writeJson(path.join(dataDir, "States.json"), existing);
  writeJson(path.join(dataDir, "Enemies.json"), existing);
  writeJson(path.join(dataDir, "Troops.json"), existing);
  writeJson(path.join(dataDir, "CommonEvents.json"), existing);
  writeJson(path.join(dataDir, "Animations.json"), existing);
  writeJson(path.join(dataDir, "Tilesets.json"), existing);

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

// ── batch-create-entities ─────────────────────────────────────────────────────

describe("handleBatchCreateEntities", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("creates multiple actors and returns correct IDs", async () => {
    const result = JSON.parse(
      await handleBatchCreateEntities(
        makeCtx(dir, {
          entity_type: "Actor",
          entities: [
            { name: "Alice", classId: 1, initialLevel: 1, maxLevel: 99, traits: [] },
            { name: "Bob", classId: 1, initialLevel: 1, maxLevel: 99, traits: [] },
          ],
        })
      )
    );
    expect(result.success).toBe(true);
    expect(result.created).toBe(2);
    expect(result.results[0].id).toBe(2);
    expect(result.results[1].id).toBe(3);
    // Verify they exist in the file
    const actors = readJson(path.join(dir, "data", "Actors.json")) as unknown[];
    expect(actors).toHaveLength(4); // null + existing + 2 new
  });

  it("rejects unknown entity_type", async () => {
    const result = JSON.parse(
      await handleBatchCreateEntities(
        makeCtx(dir, { entity_type: "Dragon", entities: [{ name: "Foo" }] })
      )
    );
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/entity_type/);
  });

  it("rejects when entities array is empty", async () => {
    const result = JSON.parse(
      await handleBatchCreateEntities(
        makeCtx(dir, { entity_type: "Actor", entities: [] })
      )
    );
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/non-empty/);
  });

  it("rejects when entities exceed 50 items", async () => {
    const entities = Array.from({ length: 51 }, (_, i) => ({ name: `Entity${i}` }));
    const result = JSON.parse(
      await handleBatchCreateEntities(
        makeCtx(dir, { entity_type: "Actor", entities })
      )
    );
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/50/);
  });

  it("creates Troops (newly added type)", async () => {
    const result = JSON.parse(
      await handleBatchCreateEntities(
        makeCtx(dir, {
          entity_type: "Troop",
          entities: [
            { name: "Forest Wolves", members: [], pages: [] },
          ],
        })
      )
    );
    expect(result.success).toBe(true);
    expect(result.created).toBe(1);
    expect(result.results[0].id).toBeGreaterThan(0);
  });

  it("creates CommonEvents (newly added type)", async () => {
    const result = JSON.parse(
      await handleBatchCreateEntities(
        makeCtx(dir, {
          entity_type: "CommonEvent",
          entities: [
            { name: "Game Start", trigger: 0, switchId: 1, list: [] },
          ],
        })
      )
    );
    expect(result.success).toBe(true);
    expect(result.created).toBe(1);
    expect(result.results[0].id).toBeGreaterThan(0);
  });

  it("creates Animations (newly added type)", async () => {
    const result = JSON.parse(
      await handleBatchCreateEntities(
        makeCtx(dir, {
          entity_type: "Animation",
          entities: [
            { name: "Flame", effectName: "", displayType: 0, flashTimings: [], soundTimings: [] },
          ],
        })
      )
    );
    expect(result.success).toBe(true);
    expect(result.created).toBe(1);
    expect(result.results[0].id).toBeGreaterThan(0);
  });
});

// ── batch-delete-entities ─────────────────────────────────────────────────────

describe("handleBatchDeleteEntities", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("deletes multiple entities, nulls their slots", async () => {
    // First add a second actor so we can delete both
    const dataDir = path.join(dir, "data");
    writeJson(path.join(dataDir, "Actors.json"), [
      null,
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);

    const result = JSON.parse(
      await handleBatchDeleteEntities(
        makeCtx(dir, {
          entity_type: "Actor",
          entity_ids: [1, 2],
          confirm: true,
        })
      )
    );
    expect(result.success).toBe(true);
    expect(result.deleted).toBe(2);
    const actors = readJson(path.join(dataDir, "Actors.json")) as (unknown | null)[];
    expect(actors[1]).toBeNull();
    expect(actors[2]).toBeNull();
  });

  it("rejects without confirm:true", async () => {
    const result = JSON.parse(
      await handleBatchDeleteEntities(
        makeCtx(dir, {
          entity_type: "Actor",
          entity_ids: [1],
          confirm: false,
        })
      )
    );
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/confirm/);
  });

  it("rejects when confirm is omitted", async () => {
    const result = JSON.parse(
      await handleBatchDeleteEntities(
        makeCtx(dir, {
          entity_type: "Actor",
          entity_ids: [1],
        })
      )
    );
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/confirm/);
  });

  it("reports not-found IDs in results without failing the whole batch", async () => {
    const result = JSON.parse(
      await handleBatchDeleteEntities(
        makeCtx(dir, {
          entity_type: "Actor",
          entity_ids: [1, 999],
          confirm: true,
        })
      )
    );
    expect(result.deleted).toBe(1);
    expect(result.success).toBe(false); // partial success
    const notFound = result.results.find((r: { id: number; success: boolean; error?: string }) => r.id === 999);
    expect(notFound).toBeDefined();
    expect(notFound.success).toBe(false);
    expect(notFound.error).toMatch(/not found/i);
  });

  it("returns correct deleted count", async () => {
    const result = JSON.parse(
      await handleBatchDeleteEntities(
        makeCtx(dir, {
          entity_type: "Item",
          entity_ids: [1],
          confirm: true,
        })
      )
    );
    expect(result.deleted).toBe(1);
    expect(result.total).toBe(1);
  });

  it("deletes Tileset (newly added type)", async () => {
    const result = JSON.parse(
      await handleBatchDeleteEntities(
        makeCtx(dir, {
          entity_type: "Tileset",
          entity_ids: [1],
          confirm: true,
        })
      )
    );
    expect(result.deleted).toBe(1);
    expect(result.success).toBe(true);
    const tilesets = readJson(path.join(dir, "data", "Tilesets.json")) as (unknown | null)[];
    expect(tilesets[1]).toBeNull();
  });
});
