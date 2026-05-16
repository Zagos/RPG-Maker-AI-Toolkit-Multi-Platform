import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/adapters/mz/reader.js";
import { RPGMakerWriter } from "../../src/adapters/mz/writer.js";
import { RPGMakerDebugBridge } from "../../src/adapters/mz/debug-bridge.js";
import { ChangeLog } from "../../src/core/change-log.js";
import { handleReadEntity } from "../../src/adapters/mz/handlers/read-entity.js";
import type { HandlerContext } from "../../src/adapters/mz/handlers/types.js";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-readent-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);

  writeJson(path.join(dataDir, "Actors.json"), [
    null,
    { id: 1, name: "Harold", classId: 1, initialLevel: 1, maxLevel: 99, traits: [], note: "" },
  ]);
  writeJson(path.join(dataDir, "Items.json"), [
    null,
    { id: 1, name: "Potion", description: "Heals 50 HP", effects: [], price: 50, note: "" },
  ]);
  writeJson(path.join(dataDir, "Enemies.json"), [
    null,
    { id: 1, name: "Slime", battlerName: "", actions: [], traits: [], note: "" },
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
  writeJson(path.join(dataDir, "Troops.json"), [
    null,
    { id: 1, name: "Forest Goblins", members: [], pages: [] },
  ]);
  writeJson(path.join(dataDir, "CommonEvents.json"), [
    null,
    { id: 1, name: "Intro Cutscene", trigger: 0, switchId: 1, list: [] },
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

describe("handleReadEntity", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  const entityCases: Array<[string, string]> = [
    ["Actor", "Harold"],
    ["Item", "Potion"],
    ["Enemy", "Slime"],
    ["Weapon", "Sword"],
    ["Armor", "Shield"],
    ["Skill", "Fire"],
    ["Class", "Warrior"],
    ["State", "Poison"],
    ["Troop", "Forest Goblins"],
    ["CommonEvent", "Intro Cutscene"],
  ];

  for (const [entityType, expectedName] of entityCases) {
    it(`reads a ${entityType}`, async () => {
      const result = JSON.parse(await handleReadEntity(makeCtx(dir, { entity_type: entityType, entity_id: 1 })));
      expect(result.success).toBe(true);
      expect(result.entity_type).toBe(entityType);
      expect(result.entity_id).toBe(1);
      expect((result.data as { name: string }).name).toBe(expectedName);
    });
  }

  it("returns error for invalid entity_type", async () => {
    const result = JSON.parse(await handleReadEntity(makeCtx(dir, { entity_type: "Dragon", entity_id: 1 })));
    expect(result.error).toBeDefined();
  });

  it("returns error when entity_id is missing", async () => {
    const result = JSON.parse(await handleReadEntity(makeCtx(dir, { entity_type: "Actor" })));
    expect(result.error).toBeDefined();
  });

  it("returns error when entity_id is 0", async () => {
    const result = JSON.parse(await handleReadEntity(makeCtx(dir, { entity_type: "Actor", entity_id: 0 })));
    expect(result.error).toBeDefined();
  });

  it("returns error when entity not found", async () => {
    const result = JSON.parse(await handleReadEntity(makeCtx(dir, { entity_type: "Actor", entity_id: 999 })));
    expect(result.error).toBeDefined();
  });
});
