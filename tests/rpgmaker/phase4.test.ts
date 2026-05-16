import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerValidator } from "../../src/adapters/mz/validator.js";
import { RPGMakerWriter } from "../../src/adapters/mz/writer.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-phase4-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);
  fs.mkdirSync(path.join(dir, "js", "plugins"), { recursive: true });
  fs.mkdirSync(path.join(dir, "backups"), { recursive: true });

  writeJson(path.join(dataDir, "Actors.json"), [null, { id: 1, name: "Hero" }]);
  writeJson(path.join(dataDir, "Items.json"), [null]);
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

// ── 4.1 validateActor (traits) ────────────────────────────────────────────────

describe("RPGMakerValidator.validateActor — traits", () => {
  it("accepts missing traits", () => {
    const result = RPGMakerValidator.validateActor({ name: "Hero" });
    expect(result.valid).toBe(true);
  });

  it("accepts valid traits array", () => {
    const result = RPGMakerValidator.validateActor({
      name: "Hero",
      traits: [{ code: 31, dataId: 0, value: 0 }],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects traits that is not an array", () => {
    const result = RPGMakerValidator.validateActor({ name: "Hero", traits: "invalid" });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/traits.*array/)]));
  });

  it("rejects trait objects missing numeric code", () => {
    const result = RPGMakerValidator.validateActor({
      name: "Hero",
      traits: [{ code: "not-a-number" }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/traits\[0\].*code/);
  });

  it("still catches initialLevel > maxLevel alongside trait errors", () => {
    const result = RPGMakerValidator.validateActor({
      name: "Hero",
      initialLevel: 50,
      maxLevel: 10,
      traits: "bad",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ── 4.1 validateItem (effects) ────────────────────────────────────────────────

describe("RPGMakerValidator.validateItem — effects", () => {
  it("accepts missing effects", () => {
    const result = RPGMakerValidator.validateItem({ name: "Potion" });
    expect(result.valid).toBe(true);
  });

  it("accepts valid effects array", () => {
    const result = RPGMakerValidator.validateItem({
      name: "Potion",
      effects: [{ code: 11, dataId: 0, value1: 0.5, value2: 0 }],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects effects that is not an array", () => {
    const result = RPGMakerValidator.validateItem({ name: "Potion", effects: {} });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/effects.*array/)]));
  });

  it("rejects effect missing numeric code", () => {
    const result = RPGMakerValidator.validateItem({ name: "Potion", effects: [{ dataId: 0 }] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/effects\[0\].*code/);
  });

  it("rejects effect with non-numeric value1", () => {
    const result = RPGMakerValidator.validateItem({
      name: "Potion",
      effects: [{ code: 11, dataId: 0, value1: "half", value2: 0 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/value1.*numeric/);
  });

  it("rejects non-object entry in effects array", () => {
    const result = RPGMakerValidator.validateItem({ name: "Potion", effects: [42] });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/effects\[0\].*object/);
  });
});

// ── 4.1 validateEnemy (actions) ───────────────────────────────────────────────

describe("RPGMakerValidator.validateEnemy — actions", () => {
  it("accepts missing actions", () => {
    const result = RPGMakerValidator.validateEnemy({ name: "Slime" });
    expect(result.valid).toBe(true);
  });

  it("accepts valid actions array", () => {
    const result = RPGMakerValidator.validateEnemy({
      name: "Slime",
      actions: [{ skillId: 1, conditionType: 0, conditionParam1: 0, conditionParam2: 0, rating: 5 }],
    });
    expect(result.valid).toBe(true);
  });

  it("rejects actions that is not an array", () => {
    const result = RPGMakerValidator.validateEnemy({ name: "Slime", actions: "attack" });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/actions.*array/)]));
  });

  it("rejects action with non-positive skillId", () => {
    const result = RPGMakerValidator.validateEnemy({
      name: "Slime",
      actions: [{ skillId: 0, conditionType: 0, rating: 5 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/skillId.*positive/);
  });

  it("rejects action with invalid conditionType", () => {
    const result = RPGMakerValidator.validateEnemy({
      name: "Slime",
      actions: [{ skillId: 1, conditionType: 99, rating: 5 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/conditionType.*0.5/);
  });

  it("warns about rating out of 1–9 range", () => {
    const result = RPGMakerValidator.validateEnemy({
      name: "Slime",
      actions: [{ skillId: 1, conditionType: 0, rating: 10 }],
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual(expect.arrayContaining([expect.stringMatching(/rating.*1.9/)]));
  });
});

// ── 4.1 validateMapEvent ──────────────────────────────────────────────────────

describe("RPGMakerValidator.validateMapEvent", () => {
  const map = { width: 20, height: 15 };

  it("accepts valid coordinates", () => {
    const result = RPGMakerValidator.validateMapEvent({ x: 0, y: 0 }, map);
    expect(result.valid).toBe(true);
  });

  it("accepts max valid coordinates", () => {
    const result = RPGMakerValidator.validateMapEvent({ x: 19, y: 14 }, map);
    expect(result.valid).toBe(true);
  });

  it("rejects x out of bounds", () => {
    const result = RPGMakerValidator.validateMapEvent({ x: 20, y: 5 }, map);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/x.*out of map bounds/);
  });

  it("rejects negative x", () => {
    const result = RPGMakerValidator.validateMapEvent({ x: -1, y: 5 }, map);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/x.*out of map bounds/);
  });

  it("rejects y out of bounds", () => {
    const result = RPGMakerValidator.validateMapEvent({ x: 5, y: 15 }, map);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/y.*out of map bounds/);
  });

  it("rejects non-integer x", () => {
    const result = RPGMakerValidator.validateMapEvent({ x: 1.5, y: 5 }, map);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/x.*integer/);
  });

  it("rejects non-string name", () => {
    const result = RPGMakerValidator.validateMapEvent({ x: 0, y: 0, name: 42 as unknown as string }, map);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/name.*string/);
  });
});

// ── 4.2 writePlugin filename sanitization ─────────────────────────────────────

describe("RPGMakerWriter.writePlugin — filename sanitization", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempProject();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("accepts a normal plugin filename", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    expect(() => writer.writePlugin("MyPlugin.js", "// code")).not.toThrow();
  });

  it("rejects filename with angle brackets", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    expect(() => writer.writePlugin("<evil>.js", "// code")).toThrow(/Invalid plugin filename/);
  });

  it("rejects filename with colon", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    expect(() => writer.writePlugin("C:plugin.js", "// code")).toThrow(/Invalid plugin filename/);
  });

  it("rejects filename with path separator", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    expect(() => writer.writePlugin("../evil.js", "// code")).toThrow(/Invalid plugin filename/);
  });

  it("rejects filename with backslash", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    expect(() => writer.writePlugin("path\\evil.js", "// code")).toThrow(/Invalid plugin filename/);
  });

  it("rejects reserved Windows name NUL", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    expect(() => writer.writePlugin("NUL.js", "// code")).toThrow(/Invalid plugin filename/);
  });

  it("rejects reserved Windows name COM1", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    expect(() => writer.writePlugin("COM1.js", "// code")).toThrow(/Invalid plugin filename/);
  });

  it("writes the file when filename is valid", () => {
    const writer = new RPGMakerWriter({ projectPath: dir, createBackup: false });
    writer.writePlugin("ValidPlugin.js", "// code");
    expect(fs.existsSync(path.join(dir, "js", "plugins", "ValidPlugin.js"))).toBe(true);
  });
});
