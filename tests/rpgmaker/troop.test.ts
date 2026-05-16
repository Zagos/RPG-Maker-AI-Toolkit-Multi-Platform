import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/adapters/mz/reader.js";
import { RPGMakerWriter } from "../../src/adapters/mz/writer.js";
import { RPGMakerDebugBridge } from "../../src/adapters/mz/debug-bridge.js";
import { ChangeLog } from "../../src/core/change-log.js";
import { handleCreateTroop, handleEditTroop } from "../../src/adapters/mz/handlers/troop.js";
import type { HandlerContext } from "../../src/adapters/mz/handlers/types.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-troop-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);

  writeJson(path.join(dataDir, "Troops.json"), [
    null,
    {
      id: 1,
      name: "Existing Troop",
      members: [{ enemyId: 1, x: 500, y: 400, hidden: false }],
      pages: [],
    },
  ]);
  writeJson(path.join(dataDir, "System.json"), { gameTitle: "Test", versionId: 1 });

  return dir;
}

function makeCtx(dir: string, input: Record<string, unknown>): HandlerContext {
  const reader = new RPGMakerReader({ projectPath: dir });
  const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
  return {
    reader,
    writer,
    input,
    projectPath: dir,
    debugBridge: new RPGMakerDebugBridge(),
    changeLog: new ChangeLog(dir),
    debug: false,
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("handleCreateTroop", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("creates a new troop and returns its ID", async () => {
    const ctx = makeCtx(dir, {
      name: "Forest Ambush",
      members: [{ enemy_id: 2 }, { enemy_id: 3 }],
    });
    const result = JSON.parse(await handleCreateTroop(ctx));

    expect(result.success).toBe(true);
    expect(result.troop_id).toBe(2);
    expect(result.name).toBe("Forest Ambush");
    expect(result.member_count).toBe(2);
  });

  it("persists the troop in Troops.json", async () => {
    const ctx = makeCtx(dir, {
      name: "Cave Bats",
      members: [{ enemy_id: 5, x: 400, y: 350 }],
    });
    await handleCreateTroop(ctx);

    const troops = readJson(path.join(dir, "data", "Troops.json")) as Array<Record<string, unknown> | null>;
    const created = troops.find((t) => t !== null && t.name === "Cave Bats") as Record<string, unknown>;
    expect(created).toBeDefined();
    const members = created.members as Array<{ x: number; y: number; enemyId: number }>;
    expect(members[0].enemyId).toBe(5);
    expect(members[0].x).toBe(400);
    expect(members[0].y).toBe(350);
  });

  it("auto-assigns x/y positions when omitted", async () => {
    const ctx = makeCtx(dir, {
      name: "Squad",
      members: [{ enemy_id: 1 }, { enemy_id: 2 }, { enemy_id: 3 }],
    });
    await handleCreateTroop(ctx);

    const troops = readJson(path.join(dir, "data", "Troops.json")) as Array<Record<string, unknown> | null>;
    const created = troops.find((t) => t !== null && (t as Record<string, unknown>).name === "Squad") as Record<string, unknown>;
    const members = created.members as Array<{ x: number; y: number }>;
    expect(members).toHaveLength(3);
    members.forEach((m) => {
      expect(typeof m.x).toBe("number");
      expect(typeof m.y).toBe("number");
    });
  });

  it("adds a default battle event page", async () => {
    const ctx = makeCtx(dir, {
      name: "Boss",
      members: [{ enemy_id: 10 }],
    });
    await handleCreateTroop(ctx);

    const troops = readJson(path.join(dir, "data", "Troops.json")) as Array<Record<string, unknown> | null>;
    const created = troops.find((t) => t !== null && (t as Record<string, unknown>).name === "Boss") as Record<string, unknown>;
    const pages = created.pages as unknown[];
    expect(pages).toHaveLength(1);
  });

  it("returns error when name is missing", async () => {
    const ctx = makeCtx(dir, { members: [{ enemy_id: 1 }] });
    const result = JSON.parse(await handleCreateTroop(ctx));
    expect(result.error).toBeDefined();
  });

  it("returns error when members array is empty", async () => {
    const ctx = makeCtx(dir, { name: "Empty", members: [] });
    const result = JSON.parse(await handleCreateTroop(ctx));
    expect(result.error).toBeDefined();
  });

  it("returns error when members count exceeds 8", async () => {
    const ctx = makeCtx(dir, {
      name: "Army",
      members: Array.from({ length: 9 }, (_, i) => ({ enemy_id: i + 1 })),
    });
    const result = JSON.parse(await handleCreateTroop(ctx));
    expect(result.error).toMatch(/8/);
  });

  it("returns error for invalid enemy_id", async () => {
    const ctx = makeCtx(dir, { name: "Bad", members: [{ enemy_id: 0 }] });
    const result = JSON.parse(await handleCreateTroop(ctx));
    expect(result.error).toBeDefined();
  });

  it("appends to change log", async () => {
    const ctx = makeCtx(dir, { name: "Logged Troop", members: [{ enemy_id: 1 }] });
    await handleCreateTroop(ctx);
    const entries = ctx.changeLog.read();
    expect(entries[0].tool).toBe("create-troop");
    expect(entries[0].action).toBe("create");
  });
});

describe("handleEditTroop", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("renames an existing troop", async () => {
    const ctx = makeCtx(dir, { troop_id: 1, name: "Renamed Troop" });
    const result = JSON.parse(await handleEditTroop(ctx));

    expect(result.success).toBe(true);
    expect(result.updated).toContain("name");

    const troops = readJson(path.join(dir, "data", "Troops.json")) as Array<Record<string, unknown> | null>;
    const troop = troops[1] as Record<string, unknown>;
    expect(troop.name).toBe("Renamed Troop");
  });

  it("replaces members", async () => {
    const ctx = makeCtx(dir, {
      troop_id: 1,
      members: [{ enemy_id: 7, x: 450, y: 420 }, { enemy_id: 8 }],
    });
    const result = JSON.parse(await handleEditTroop(ctx));
    expect(result.success).toBe(true);

    const troops = readJson(path.join(dir, "data", "Troops.json")) as Array<Record<string, unknown> | null>;
    const troop = troops[1] as Record<string, unknown>;
    const members = troop.members as Array<{ enemyId: number; x: number }>;
    expect(members).toHaveLength(2);
    expect(members[0].enemyId).toBe(7);
    expect(members[0].x).toBe(450);
  });

  it("returns error when troop_id does not exist", async () => {
    const ctx = makeCtx(dir, { troop_id: 99, name: "Ghost" });
    const result = JSON.parse(await handleEditTroop(ctx));
    expect(result.error).toBeDefined();
  });

  it("returns error when no fields are provided", async () => {
    const ctx = makeCtx(dir, { troop_id: 1 });
    const result = JSON.parse(await handleEditTroop(ctx));
    expect(result.error).toMatch(/No fields/);
  });

  it("returns error when troop_id is missing", async () => {
    const ctx = makeCtx(dir, { name: "New Name" });
    const result = JSON.parse(await handleEditTroop(ctx));
    expect(result.error).toBeDefined();
  });

  it("appends to change log on edit", async () => {
    const ctx = makeCtx(dir, { troop_id: 1, name: "Updated" });
    await handleEditTroop(ctx);
    const entries = ctx.changeLog.read();
    expect(entries[0].tool).toBe("edit-troop");
    expect(entries[0].action).toBe("update");
    expect(entries[0].entityId).toBe(1);
  });
});
