import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerWriter } from "../../src/rpgmaker/writer.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-test-"));
  const dataDir = path.join(dir, "data");
  const jsDir = path.join(dir, "js", "plugins");
  fs.mkdirSync(dataDir);
  fs.mkdirSync(jsDir, { recursive: true });

  writeJson(path.join(dataDir, "Actors.json"), [
    null,
    { id: 1, name: "Hero", nickname: "", classId: 1, initialLevel: 1, maxLevel: 99, traits: [], equips: [] },
  ]);
  writeJson(path.join(dataDir, "Items.json"), [
    null,
    { id: 1, name: "Potion", description: "", price: 50, iconIndex: 0 },
  ]);
  writeJson(path.join(dataDir, "Enemies.json"), [
    null,
    { id: 1, name: "Slime", battlerName: "Slime", exp: 10, gold: 5, dropItems: [], actions: [], traits: [] },
  ]);
  writeJson(path.join(dataDir, "Weapons.json"), [
    null,
    { id: 1, name: "Sword", description: "", price: 100, wtypeId: 1, traits: [], parameters: [0, 0, 10, 0, 0, 0, 0, 0], note: "" },
  ]);
  writeJson(path.join(dataDir, "Armors.json"), [
    null,
    { id: 1, name: "Shield", description: "", price: 80, atypeId: 1, traits: [], parameters: [0, 0, 0, 10, 0, 0, 0, 0], note: "" },
  ]);
  writeJson(path.join(dataDir, "Skills.json"), [
    null,
    { id: 1, name: "Fire", mpCost: 10, tpCost: 0, scope: 1, effects: [], traits: [] },
  ]);
  writeJson(path.join(dataDir, "Classes.json"), [
    null,
    { id: 1, name: "Warrior", expParams: [30, 20, 30, 30], params: [], traits: [], learnings: [] },
  ]);
  writeJson(path.join(dataDir, "States.json"), [
    null,
    { id: 1, name: "Poison", iconIndex: 12, priority: 50, traits: [] },
  ]);
  writeJson(path.join(dataDir, "CommonEvents.json"), [null]);
  writeJson(path.join(dataDir, "Troops.json"), [null]);
  writeJson(path.join(dataDir, "System.json"), { gameTitle: "Test", versionId: 1 });
  writeJson(path.join(dataDir, "MapInfos.json"), [null]);
  writeJson(path.join(dataDir, "Map001.json"), {
    displayName: "Test Map", width: 17, height: 13,
    tilesetId: 1, encounterStep: 30, encounterList: [],
    events: [null, { id: 1, name: "NPC", note: "", pages: [], x: 2, y: 3 }],
    data: [], bgm: { name: "", pan: 0, pitch: 100, volume: 90 },
    bgs: { name: "", pan: 0, pitch: 100, volume: 90 },
    autoplayBgm: false, autoplayBgs: false, parallaxName: "",
    parallaxLoopX: false, parallaxLoopY: false, parallaxSx: 0, parallaxSy: 0,
    parallaxShow: false, scrollType: 0, specifyBattleback: false,
    battleback1Name: "", battleback2Name: "", note: "",
    enableNameDisplay: false,
  });

  return dir;
}

function removeTempProject(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ── tests ─────────────────────────────────────────────────────────────────────

let tmpDir: string;
let writer: RPGMakerWriter;

beforeEach(() => {
  tmpDir = createTempProject();
  writer = new RPGMakerWriter({ projectPath: tmpDir, createBackup: true, debug: false });
});

afterEach(() => {
  removeTempProject(tmpDir);
});

describe("RPGMakerWriter — Actors", () => {
  it("updateActor modifica el nombre", () => {
    writer.updateActor(1, { name: "NewHero" });
    const actors = readJson(path.join(tmpDir, "data", "Actors.json")) as Array<{ id: number; name: string } | null>;
    expect(actors[1]?.name).toBe("NewHero");
  });

  it("updateActor lanza error si ID no existe", () => {
    expect(() => writer.updateActor(99, { name: "Ghost" })).toThrow("not found");
  });

  it("addActor añade con el siguiente ID", () => {
    const newId = writer.addActor({ name: "Mage", classId: 2 });
    expect(newId).toBe(2);
    const actors = readJson(path.join(tmpDir, "data", "Actors.json")) as unknown[];
    expect(actors).toHaveLength(3);
  });
});

describe("RPGMakerWriter — Items", () => {
  it("updateItem modifica el precio", () => {
    writer.updateItem(1, { price: 200 });
    const items = readJson(path.join(tmpDir, "data", "Items.json")) as Array<{ id: number; price: number } | null>;
    expect(items[1]?.price).toBe(200);
  });

  it("addItem asigna ID 2 cuando solo existe el 1", () => {
    const newId = writer.addItem({ name: "Ether", price: 300 });
    expect(newId).toBe(2);
  });
});

describe("RPGMakerWriter — Enemies", () => {
  it("updateEnemy modifica el gold", () => {
    writer.updateEnemy(1, { gold: 100 });
    const enemies = readJson(path.join(tmpDir, "data", "Enemies.json")) as Array<{ id: number; gold: number } | null>;
    expect(enemies[1]?.gold).toBe(100);
  });

  it("addEnemy crea con ID 2", () => {
    const newId = writer.addEnemy({ name: "Dragon", battlerName: "Dragon" });
    expect(newId).toBe(2);
  });
});

describe("RPGMakerWriter — Weapons, Armors, Skills, Classes, States", () => {
  it("updateWeapon modifica el precio", () => {
    writer.updateWeapon(1, { price: 500 });
    const weapons = readJson(path.join(tmpDir, "data", "Weapons.json")) as Array<{ id: number; price: number } | null>;
    expect(weapons[1]?.price).toBe(500);
  });

  it("addWeapon crea con ID 2", () => {
    const id = writer.addWeapon({ name: "Axe", wtypeId: 2, parameters: [0,0,15,0,0,0,0,0], traits: [], note: "" });
    expect(id).toBe(2);
  });

  it("updateArmor modifica la descripción", () => {
    writer.updateArmor(1, { description: "Un buen escudo" });
    const armors = readJson(path.join(tmpDir, "data", "Armors.json")) as Array<{ description: string } | null>;
    expect(armors[1]?.description).toBe("Un buen escudo");
  });

  it("updateSkill modifica el mpCost", () => {
    writer.updateSkill(1, { mpCost: 20 });
    const skills = readJson(path.join(tmpDir, "data", "Skills.json")) as Array<{ mpCost: number } | null>;
    expect(skills[1]?.mpCost).toBe(20);
  });

  it("updateClass modifica el nombre", () => {
    writer.updateClass(1, { name: "Knight" });
    const classes = readJson(path.join(tmpDir, "data", "Classes.json")) as Array<{ name: string } | null>;
    expect(classes[1]?.name).toBe("Knight");
  });

  it("updateState modifica el iconIndex", () => {
    writer.updateState(1, { iconIndex: 99 });
    const states = readJson(path.join(tmpDir, "data", "States.json")) as Array<{ iconIndex: number } | null>;
    expect(states[1]?.iconIndex).toBe(99);
  });
});

describe("RPGMakerWriter — Plugins", () => {
  it("writePlugin escribe el archivo .js", () => {
    writer.writePlugin("MyPlugin.js", "/* test plugin */");
    const pluginPath = path.join(tmpDir, "js", "plugins", "MyPlugin.js");
    expect(fs.existsSync(pluginPath)).toBe(true);
    expect(fs.readFileSync(pluginPath, "utf-8")).toBe("/* test plugin */");
  });

  it("updatePluginsRegistry crea plugins.js con la entrada", () => {
    writer.updatePluginsRegistry({ name: "TestPlugin", status: true, description: "desc", parameters: {} });
    const content = fs.readFileSync(path.join(tmpDir, "js", "plugins.js"), "utf-8");
    expect(content).toContain("TestPlugin");
    expect(content).toContain("desc");
  });

  it("updatePluginsRegistry actualiza entrada existente sin duplicar", () => {
    writer.updatePluginsRegistry({ name: "P1", status: true, description: "v1", parameters: {} });
    writer.updatePluginsRegistry({ name: "P1", status: true, description: "v2", parameters: {} });
    const content = fs.readFileSync(path.join(tmpDir, "js", "plugins.js"), "utf-8");
    expect(content.split("P1")).toHaveLength(2); // solo 1 ocurrencia del name
    expect(content).toContain("v2");
  });
});

describe("RPGMakerWriter — Backups", () => {
  it("crea backup al actualizar actor", () => {
    writer.updateActor(1, { name: "Changed" });
    const backups = writer.getBackups("Actors.json");
    expect(backups.length).toBeGreaterThan(0);
    expect(backups[0]).toMatch(/^Actors/);
  });

  it("restoreFromBackup rechaza path traversal", () => {
    expect(() => writer.restoreFromBackup("../evil.json")).toThrow("Invalid backup filename");
    expect(() => writer.restoreFromBackup("../../etc/passwd")).toThrow("Invalid backup filename");
  });

  it("pruneBackups elimina los más antiguos", () => {
    // Crear 3 backups modificando el actor 3 veces
    for (let i = 0; i < 3; i++) {
      writer.updateActor(1, { name: `Hero${i}` });
    }
    const before = writer.getBackups("Actors.json");
    expect(before.length).toBe(3);

    const deleted = writer.pruneBackups("Actors.json", 1);
    expect(deleted).toBe(2);
    expect(writer.getBackups("Actors.json")).toHaveLength(1);
  });

  it("deleteBackup elimina un backup específico", () => {
    writer.updateActor(1, { name: "Changed" });
    const backups = writer.getBackups("Actors.json");
    expect(backups.length).toBe(1);

    writer.deleteBackup(backups[0]);
    expect(writer.getBackups("Actors.json")).toHaveLength(0);
  });
});

describe("RPGMakerWriter — CommonEvents", () => {
  it("addCommonEvent añade el evento con ID correcto", () => {
    const id = writer.addCommonEvent({ name: "TestEvent", trigger: 0, switchId: 1, list: [] });
    expect(id).toBe(1); // [null] → siguiente es 1
    const events = readJson(path.join(tmpDir, "data", "CommonEvents.json")) as unknown[];
    expect(events).toHaveLength(2);
  });
});

describe("RPGMakerWriter — refreshVersionId", () => {
  it("cambia versionId en System.json", () => {
    writer.refreshVersionId();
    const system = readJson(path.join(tmpDir, "data", "System.json")) as { versionId: number };
    expect(system.versionId).not.toBe(1);
    expect(typeof system.versionId).toBe("number");
  });
});

describe("Animation and Tileset methods", () => {
  const MINIMAL_ANIMATION = {
    id: 1, name: "Test", frames: [], timings: [], displayType: 0,
    flashTimings: [], soundTimings: [], rotation: 0, offsetX: 0, offsetY: 0,
    speed: 100, scale: 100,
  };

  const MINIMAL_TILESET = {
    id: 1, name: "Test", mode: 1, tilesetNames: [], flags: [], note: "",
  };

  it("addAnimation creates an entry with the correct id and name", () => {
    writeJson(path.join(tmpDir, "data", "Animations.json"), [null]);
    const newId = writer.addAnimation({ name: "Fireball" });
    expect(newId).toBe(1);
    const anims = readJson(path.join(tmpDir, "data", "Animations.json")) as Array<{ id: number; name: string } | null>;
    expect(anims[1]?.id).toBe(1);
    expect(anims[1]?.name).toBe("Fireball");
  });

  it("addTileset creates an entry with the correct id and name", () => {
    writeJson(path.join(tmpDir, "data", "Tilesets.json"), [null]);
    const newId = writer.addTileset({ name: "WorldMap" });
    expect(newId).toBe(1);
    const tilesets = readJson(path.join(tmpDir, "data", "Tilesets.json")) as Array<{ id: number; name: string } | null>;
    expect(tilesets[1]?.id).toBe(1);
    expect(tilesets[1]?.name).toBe("WorldMap");
  });

  it("updateAnimation changes the name of an existing entry", () => {
    writeJson(path.join(tmpDir, "data", "Animations.json"), [null, { ...MINIMAL_ANIMATION }]);
    writer.updateAnimation(1, { name: "Updated" });
    const anims = readJson(path.join(tmpDir, "data", "Animations.json")) as Array<{ id: number; name: string } | null>;
    expect(anims[1]?.name).toBe("Updated");
  });

  it("updateTileset changes the name of an existing entry", () => {
    writeJson(path.join(tmpDir, "data", "Tilesets.json"), [null, { ...MINIMAL_TILESET }]);
    writer.updateTileset(1, { name: "Updated" });
    const tilesets = readJson(path.join(tmpDir, "data", "Tilesets.json")) as Array<{ id: number; name: string } | null>;
    expect(tilesets[1]?.name).toBe("Updated");
  });

  it("updateAnimation throws when id does not exist", () => {
    writeJson(path.join(tmpDir, "data", "Animations.json"), [null, { ...MINIMAL_ANIMATION }]);
    expect(() => writer.updateAnimation(99, { name: "Ghost" })).toThrow(/not found/i);
  });
});
