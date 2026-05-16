import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/rpgmaker/reader.js";
import { RPGMakerWriter } from "../../src/rpgmaker/writer.js";
import { RPGMakerDebugBridge } from "../../src/rpgmaker/debug-bridge.js";
import { ChangeLog } from "../../src/rpgmaker/change-log.js";
import { handleCreateActor } from "../../src/handlers/create-actor.js";
import { handleCreateItem } from "../../src/handlers/create-item.js";
import { handleCreateWeapon } from "../../src/handlers/create-weapon.js";
import { handleCreateArmor } from "../../src/handlers/create-armor.js";
import { handleCreateSkill } from "../../src/handlers/create-skill.js";
import { handleCreateClass } from "../../src/handlers/create-class.js";
import { handleCreateState } from "../../src/handlers/create-state.js";
import { handleCreateEnemy } from "../../src/handlers/create-enemy.js";
import { handleCreateAnimation } from "../../src/handlers/create-animation.js";
import type { HandlerContext } from "../../src/handlers/types.js";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-createhnd-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);

  // Start each file with [null] so the first created entity gets id=1
  writeJson(path.join(dataDir, "Actors.json"), [null]);
  writeJson(path.join(dataDir, "Items.json"), [null]);
  writeJson(path.join(dataDir, "Weapons.json"), [null]);
  writeJson(path.join(dataDir, "Armors.json"), [null]);
  writeJson(path.join(dataDir, "Skills.json"), [null]);
  writeJson(path.join(dataDir, "Classes.json"), [null]);
  writeJson(path.join(dataDir, "States.json"), [null]);
  writeJson(path.join(dataDir, "Enemies.json"), [null]);
  writeJson(path.join(dataDir, "Animations.json"), [null]);

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

// ── create-actor ──────────────────────────────────────────────────────────────

describe("handleCreateActor", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("creates actor with minimal input and returns correct shape", async () => {
    const result = JSON.parse(await handleCreateActor(makeCtx(dir, { name: "Hero" })));
    expect(result.success).toBe(true);
    expect(result.actor_id).toBeGreaterThan(0);
    expect(result.name).toBe("Hero");
  });

  it("created actor exists in Actors.json", async () => {
    const result = JSON.parse(await handleCreateActor(makeCtx(dir, { name: "Hero" })));
    const actors = readJson(path.join(dir, "data", "Actors.json")) as Array<{ id: number; name: string } | null>;
    const found = actors.find((a) => a !== null && a.id === result.actor_id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Hero");
  });

  it("returns error when name is missing", async () => {
    const result = JSON.parse(await handleCreateActor(makeCtx(dir, {})));
    expect(result.error).toBeDefined();
  });
});

// ── create-item ───────────────────────────────────────────────────────────────

describe("handleCreateItem", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("creates item with minimal input and returns correct shape", async () => {
    const result = JSON.parse(await handleCreateItem(makeCtx(dir, { name: "Potion" })));
    expect(result.success).toBe(true);
    expect(result.item_id).toBeGreaterThan(0);
    expect(result.name).toBe("Potion");
  });

  it("created item exists in Items.json", async () => {
    const result = JSON.parse(await handleCreateItem(makeCtx(dir, { name: "Potion" })));
    const items = readJson(path.join(dir, "data", "Items.json")) as Array<{ id: number; name: string } | null>;
    const found = items.find((i) => i !== null && i.id === result.item_id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Potion");
  });

  it("returns error when name is missing", async () => {
    const result = JSON.parse(await handleCreateItem(makeCtx(dir, {})));
    expect(result.error).toBeDefined();
  });
});

// ── create-weapon ─────────────────────────────────────────────────────────────

describe("handleCreateWeapon", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("creates weapon with minimal input and returns correct shape", async () => {
    const result = JSON.parse(await handleCreateWeapon(makeCtx(dir, { name: "Sword" })));
    expect(result.success).toBe(true);
    expect(result.weapon_id).toBeGreaterThan(0);
    expect(result.name).toBe("Sword");
  });

  it("created weapon exists in Weapons.json", async () => {
    const result = JSON.parse(await handleCreateWeapon(makeCtx(dir, { name: "Sword" })));
    const weapons = readJson(path.join(dir, "data", "Weapons.json")) as Array<{ id: number; name: string } | null>;
    const found = weapons.find((w) => w !== null && w.id === result.weapon_id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Sword");
  });

  it("returns error when name is missing", async () => {
    const result = JSON.parse(await handleCreateWeapon(makeCtx(dir, {})));
    expect(result.error).toBeDefined();
  });
});

// ── create-armor ──────────────────────────────────────────────────────────────

describe("handleCreateArmor", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("creates armor with minimal input and returns correct shape", async () => {
    const result = JSON.parse(await handleCreateArmor(makeCtx(dir, { name: "Shield" })));
    expect(result.success).toBe(true);
    expect(result.armor_id).toBeGreaterThan(0);
    expect(result.name).toBe("Shield");
  });

  it("created armor exists in Armors.json", async () => {
    const result = JSON.parse(await handleCreateArmor(makeCtx(dir, { name: "Shield" })));
    const armors = readJson(path.join(dir, "data", "Armors.json")) as Array<{ id: number; name: string } | null>;
    const found = armors.find((a) => a !== null && a.id === result.armor_id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Shield");
  });

  it("returns error when name is missing", async () => {
    const result = JSON.parse(await handleCreateArmor(makeCtx(dir, {})));
    expect(result.error).toBeDefined();
  });
});

// ── create-skill ──────────────────────────────────────────────────────────────

describe("handleCreateSkill", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("creates skill with minimal input and returns correct shape", async () => {
    const result = JSON.parse(await handleCreateSkill(makeCtx(dir, { name: "Fire" })));
    expect(result.success).toBe(true);
    expect(result.skill_id).toBeGreaterThan(0);
    expect(result.name).toBe("Fire");
  });

  it("created skill exists in Skills.json", async () => {
    const result = JSON.parse(await handleCreateSkill(makeCtx(dir, { name: "Fire" })));
    const skills = readJson(path.join(dir, "data", "Skills.json")) as Array<{ id: number; name: string } | null>;
    const found = skills.find((s) => s !== null && s.id === result.skill_id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Fire");
  });

  it("returns error when name is missing", async () => {
    const result = JSON.parse(await handleCreateSkill(makeCtx(dir, {})));
    expect(result.error).toBeDefined();
  });
});

// ── create-class ──────────────────────────────────────────────────────────────

describe("handleCreateClass", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("creates class with minimal input and returns correct shape", async () => {
    const result = JSON.parse(await handleCreateClass(makeCtx(dir, { name: "Warrior" })));
    expect(result.success).toBe(true);
    expect(result.class_id).toBeGreaterThan(0);
    expect(result.name).toBe("Warrior");
  });

  it("created class exists in Classes.json", async () => {
    const result = JSON.parse(await handleCreateClass(makeCtx(dir, { name: "Warrior" })));
    const classes = readJson(path.join(dir, "data", "Classes.json")) as Array<{ id: number; name: string } | null>;
    const found = classes.find((c) => c !== null && c.id === result.class_id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Warrior");
  });

  it("returns error when name is missing", async () => {
    const result = JSON.parse(await handleCreateClass(makeCtx(dir, {})));
    expect(result.error).toBeDefined();
  });
});

// ── create-state ──────────────────────────────────────────────────────────────

describe("handleCreateState", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("creates state with minimal input and returns correct shape", async () => {
    const result = JSON.parse(await handleCreateState(makeCtx(dir, { name: "Poison" })));
    expect(result.success).toBe(true);
    expect(result.state_id).toBeGreaterThan(0);
    expect(result.name).toBe("Poison");
  });

  it("created state exists in States.json", async () => {
    const result = JSON.parse(await handleCreateState(makeCtx(dir, { name: "Poison" })));
    const states = readJson(path.join(dir, "data", "States.json")) as Array<{ id: number; name: string } | null>;
    const found = states.find((s) => s !== null && s.id === result.state_id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Poison");
  });

  it("returns error when name is missing", async () => {
    const result = JSON.parse(await handleCreateState(makeCtx(dir, {})));
    expect(result.error).toBeDefined();
  });
});

// ── create-enemy ──────────────────────────────────────────────────────────────

describe("handleCreateEnemy", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("creates enemy with minimal input and returns correct shape", async () => {
    const result = JSON.parse(await handleCreateEnemy(makeCtx(dir, { name: "Slime" })));
    expect(result.success).toBe(true);
    expect(result.enemy_id).toBeGreaterThan(0);
    expect(result.name).toBe("Slime");
  });

  it("created enemy exists in Enemies.json", async () => {
    const result = JSON.parse(await handleCreateEnemy(makeCtx(dir, { name: "Slime" })));
    const enemies = readJson(path.join(dir, "data", "Enemies.json")) as Array<{ id: number; name: string } | null>;
    const found = enemies.find((e) => e !== null && e.id === result.enemy_id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Slime");
  });

  it("returns error when name is missing", async () => {
    const result = JSON.parse(await handleCreateEnemy(makeCtx(dir, {})));
    expect(result.error).toBeDefined();
  });
});

// ── create-animation ──────────────────────────────────────────────────────────

describe("handleCreateAnimation", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("creates animation with minimal input and returns correct shape", async () => {
    const result = JSON.parse(await handleCreateAnimation(makeCtx(dir, { name: "Flame" })));
    expect(result.success).toBe(true);
    expect(result.animation_id).toBeGreaterThan(0);
    expect(result.name).toBe("Flame");
  });

  it("created animation exists in Animations.json", async () => {
    const result = JSON.parse(await handleCreateAnimation(makeCtx(dir, { name: "Flame" })));
    const animations = readJson(path.join(dir, "data", "Animations.json")) as Array<Record<string, unknown> | null>;
    const found = animations.find((a) => a !== null && a.id === result.animation_id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Flame");
  });

  it("animation has effectName, displayType, flashTimings, soundTimings defaults", async () => {
    const result = JSON.parse(await handleCreateAnimation(makeCtx(dir, { name: "Flame" })));
    const animations = readJson(path.join(dir, "data", "Animations.json")) as Array<Record<string, unknown> | null>;
    const found = animations.find((a) => a !== null && a.id === result.animation_id) as Record<string, unknown>;
    expect(found).toBeDefined();
    expect(found.effectName).toBe("");
    expect(found.displayType).toBe(0);
    expect(Array.isArray(found.flashTimings)).toBe(true);
    expect(Array.isArray(found.soundTimings)).toBe(true);
  });

  it("returns error when name is missing", async () => {
    const result = JSON.parse(await handleCreateAnimation(makeCtx(dir, {})));
    expect(result.error).toBeDefined();
  });
});
