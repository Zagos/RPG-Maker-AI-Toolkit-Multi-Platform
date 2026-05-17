import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { handleBatchEdit } from "../../src/handlers/batch-edit.js";
import { RPGMakerReader } from "../../src/adapters/mz/reader.js";
import { RPGMakerWriter } from "../../src/adapters/mz/writer.js";
import { RPGMakerDebugBridge } from "../../src/adapters/mz/debug-bridge.js";
import { ChangeLog } from "../../src/core/change-log.js";
import type { HandlerContext } from "../../src/handlers/types.js";

// ── helpers ───────────────────────────────────────────────────────────────────

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-phase5-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);
  fs.mkdirSync(path.join(dir, "js", "plugins"), { recursive: true });
  fs.mkdirSync(path.join(dir, "backups"), { recursive: true });

  writeJson(path.join(dataDir, "Actors.json"), [
    null,
    { id: 1, name: "Hero", classId: 1, initialLevel: 1, maxLevel: 99, traits: [], equips: [] },
    { id: 2, name: "Mage", classId: 2, initialLevel: 1, maxLevel: 99, traits: [], equips: [] },
  ]);
  writeJson(path.join(dataDir, "Items.json"), [
    null,
    { id: 1, name: "Potion", description: "", price: 50, iconIndex: 0, consumable: true, itypeId: 1, scope: 7, occasion: 1, effects: [], traits: [], note: "" },
  ]);
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

// ── batch-edit tests ──────────────────────────────────────────────────────────

describe("handleBatchEdit", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("returns error when operations is missing", async () => {
    const result = JSON.parse(await handleBatchEdit(makeCtx(dir, {})));
    expect(result.error).toMatch(/operations/);
  });

  it("returns error when operations is empty array", async () => {
    const result = JSON.parse(await handleBatchEdit(makeCtx(dir, { operations: [] })));
    expect(result.error).toMatch(/operations/);
  });

  it("returns error when operations exceeds 50 items", async () => {
    const ops = Array.from({ length: 51 }, (_, i) => ({ tool: "edit-actor", input: { actor_id: 1, name: `A${i}` } }));
    const result = JSON.parse(await handleBatchEdit(makeCtx(dir, { operations: ops })));
    expect(result.error).toMatch(/maximum/);
  });

  it("executes a single operation successfully", async () => {
    const result = JSON.parse(await handleBatchEdit(makeCtx(dir, {
      operations: [{ tool: "edit-actor", input: { actor_id: 1, name: "NewHero" } }],
    })));
    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].success).toBe(true);
    // Verify the change was applied
    const actors = readJson(path.join(dir, "data", "Actors.json")) as Array<{ id: number; name: string } | null>;
    expect(actors[1]?.name).toBe("NewHero");
  });

  it("executes multiple operations in order", async () => {
    const result = JSON.parse(await handleBatchEdit(makeCtx(dir, {
      operations: [
        { tool: "edit-actor", input: { actor_id: 1, name: "Hero2" } },
        { tool: "edit-actor", input: { actor_id: 2, name: "Wizard" } },
        { tool: "edit-item",  input: { item_id: 1, name: "Elixir" } },
      ],
    })));
    expect(result.success).toBe(true);
    expect(result.total).toBe(3);
    expect(result.executed).toBe(3);

    const actors = readJson(path.join(dir, "data", "Actors.json")) as Array<{ name: string } | null>;
    expect(actors[1]?.name).toBe("Hero2");
    expect(actors[2]?.name).toBe("Wizard");
    const items = readJson(path.join(dir, "data", "Items.json")) as Array<{ name: string } | null>;
    expect(items[1]?.name).toBe("Elixir");
  });

  it("reports per-operation index in results", async () => {
    const result = JSON.parse(await handleBatchEdit(makeCtx(dir, {
      operations: [
        { tool: "edit-actor", input: { actor_id: 1, name: "A" } },
        { tool: "edit-actor", input: { actor_id: 2, name: "B" } },
      ],
    })));
    expect(result.results[0].index).toBe(0);
    expect(result.results[1].index).toBe(1);
  });

  it("continues after a failed operation by default", async () => {
    const result = JSON.parse(await handleBatchEdit(makeCtx(dir, {
      operations: [
        { tool: "edit-actor", input: { actor_id: 999, name: "Ghost" } }, // non-existent
        { tool: "edit-actor", input: { actor_id: 2, name: "Wizard" } },  // valid
      ],
    })));
    expect(result.success).toBe(false);
    expect(result.executed).toBe(2);
    // Second op still ran
    const actors = readJson(path.join(dir, "data", "Actors.json")) as Array<{ name: string } | null>;
    expect(actors[2]?.name).toBe("Wizard");
  });

  it("stops on first error when stop_on_error is true", async () => {
    const result = JSON.parse(await handleBatchEdit(makeCtx(dir, {
      stop_on_error: true,
      operations: [
        { tool: "edit-actor", input: { actor_id: 999, name: "Ghost" } }, // fails
        { tool: "edit-actor", input: { actor_id: 2, name: "Wizard" } },  // should not run
      ],
    })));
    expect(result.success).toBe(false);
    expect(result.executed).toBe(1);
    // Second op did NOT run
    const actors = readJson(path.join(dir, "data", "Actors.json")) as Array<{ name: string } | null>;
    expect(actors[2]?.name).toBe("Mage"); // unchanged
  });

  it("reports unknown tool as per-operation error", async () => {
    const result = JSON.parse(await handleBatchEdit(makeCtx(dir, {
      operations: [{ tool: "nonexistent-tool", input: {} }],
    })));
    expect(result.success).toBe(false);
    expect(result.results[0].error).toMatch(/Unknown tool/);
  });

  it("rejects nested batch-edit", async () => {
    const result = JSON.parse(await handleBatchEdit(makeCtx(dir, {
      operations: [{ tool: "batch-edit", input: { operations: [] } }],
    })));
    expect(result.success).toBe(false);
    expect(result.results[0].error).toMatch(/nested/i);
  });

  it("reports operation missing tool field", async () => {
    const result = JSON.parse(await handleBatchEdit(makeCtx(dir, {
      operations: [{ input: { actor_id: 1 } }],
    })));
    expect(result.success).toBe(false);
    expect(result.results[0].error).toMatch(/tool/);
  });

  it("appends a change log entry", async () => {
    const ctx = makeCtx(dir, {
      operations: [{ tool: "edit-actor", input: { actor_id: 1, name: "X" } }],
    });
    await handleBatchEdit(ctx);
    const entries = ctx.changeLog.read({ tool: "batch-edit" });
    expect(entries).toHaveLength(1);
    expect(entries[0].entityType).toBe("Batch");
  });
});
