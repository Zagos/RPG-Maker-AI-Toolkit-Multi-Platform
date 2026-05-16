import { describe, it, expect, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  snakeToCamel,
  camelToSnake,
  normalizeKeys,
  denormalizeKeys,
} from "../../src/adapters/vxace/normalize.js";
import { VXAceReader } from "../../src/adapters/vxace/reader.js";
import { VXAceWriter } from "../../src/adapters/vxace/writer.js";
import { isRubyAvailable, writeMarshalFile } from "../../src/adapters/ruby-bridge/index.js";

const rubyAvailable = isRubyAvailable();
const itWithRuby = it.skipIf(!rubyAvailable);

// ── normalize utilities ────────────────────────────────────────────────────────

describe("snakeToCamel", () => {
  it("converts snake_case to camelCase", () => {
    expect(snakeToCamel("initial_level")).toBe("initialLevel");
    expect(snakeToCamel("max_level")).toBe("maxLevel");
    expect(snakeToCamel("base_damage")).toBe("baseDamage");
  });

  it("leaves already-camelCase strings unchanged", () => {
    expect(snakeToCamel("name")).toBe("name");
    expect(snakeToCamel("id")).toBe("id");
    expect(snakeToCamel("iconIndex")).toBe("iconIndex");
  });

  it("handles single-segment strings", () => {
    expect(snakeToCamel("name")).toBe("name");
  });
});

describe("camelToSnake", () => {
  it("converts camelCase to snake_case", () => {
    expect(camelToSnake("initialLevel")).toBe("initial_level");
    expect(camelToSnake("maxLevel")).toBe("max_level");
    expect(camelToSnake("baseDamage")).toBe("base_damage");
  });

  it("leaves already-snake_case strings unchanged", () => {
    expect(camelToSnake("name")).toBe("name");
    expect(camelToSnake("id")).toBe("id");
  });
});

describe("normalizeKeys", () => {
  it("converts top-level object keys from snake_case to camelCase", () => {
    const input = { initial_level: 1, max_level: 99 };
    const result = normalizeKeys(input) as Record<string, unknown>;
    expect(result["initialLevel"]).toBe(1);
    expect(result["maxLevel"]).toBe(99);
    expect(result["initial_level"]).toBeUndefined();
  });

  it("recursively normalizes nested objects", () => {
    const input = { actor_data: { base_hp: 100 } };
    const result = normalizeKeys(input) as Record<string, unknown>;
    const nested = result["actorData"] as Record<string, unknown>;
    expect(nested["baseHp"]).toBe(100);
  });

  it("recursively normalizes arrays of objects", () => {
    const input = [{ actor_id: 1, base_name: "Hero" }];
    const result = normalizeKeys(input) as Array<Record<string, unknown>>;
    expect(result[0]["actorId"]).toBe(1);
    expect(result[0]["baseName"]).toBe("Hero");
  });

  it("passes through null values", () => {
    expect(normalizeKeys(null)).toBeNull();
  });

  it("passes through primitive values unchanged", () => {
    expect(normalizeKeys(42)).toBe(42);
    expect(normalizeKeys("hello")).toBe("hello");
    expect(normalizeKeys(true)).toBe(true);
  });

  it("handles arrays with null entries", () => {
    const input = [null, { actor_id: 1 }];
    const result = normalizeKeys(input) as Array<Record<string, unknown> | null>;
    expect(result[0]).toBeNull();
    expect((result[1] as Record<string, unknown>)["actorId"]).toBe(1);
  });
});

describe("denormalizeKeys", () => {
  it("converts top-level camelCase to snake_case", () => {
    const input = { initialLevel: 1, maxLevel: 99 };
    const result = denormalizeKeys(input) as Record<string, unknown>;
    expect(result["initial_level"]).toBe(1);
    expect(result["max_level"]).toBe(99);
    expect(result["initialLevel"]).toBeUndefined();
  });

  it("recursively denormalizes nested objects", () => {
    const input = { actorData: { baseHp: 100 } };
    const result = denormalizeKeys(input) as Record<string, unknown>;
    const nested = result["actor_data"] as Record<string, unknown>;
    expect(nested["base_hp"]).toBe(100);
  });

  it("preserves __class key as-is", () => {
    const input = { __class: "RPG::Actor", baseName: "Hero" };
    const result = denormalizeKeys(input) as Record<string, unknown>;
    expect(result["__class"]).toBe("RPG::Actor");
    expect(result["base_name"]).toBe("Hero");
  });

  it("passes through null values", () => {
    expect(denormalizeKeys(null)).toBeNull();
  });

  it("handles arrays recursively", () => {
    const input = [{ actorId: 1 }];
    const result = denormalizeKeys(input) as Array<Record<string, unknown>>;
    expect(result[0]["actor_id"]).toBe(1);
  });
});

describe("normalize round-trip", () => {
  it("normalizeKeys then denormalizeKeys returns original snake_case keys", () => {
    const original = { initial_level: 1, max_level: 99, actor_name: "Hero" };
    const normalized = normalizeKeys(original);
    const denormalized = denormalizeKeys(normalized) as Record<string, unknown>;
    expect(denormalized).toEqual(original);
  });
});

// ── VXAceReader constructor ────────────────────────────────────────────────────

describe("VXAceReader constructor", () => {
  it("throws when data directory does not exist", () => {
    const nonExistent = path.join(os.tmpdir(), `vxace-missing-${Date.now()}`);
    expect(() => new VXAceReader({ projectPath: nonExistent })).toThrow(
      /Data directory not found/
    );
  });

  it("throws with VX Ace-specific message", () => {
    const nonExistent = path.join(os.tmpdir(), `vxace-missing-${Date.now()}`);
    expect(() => new VXAceReader({ projectPath: nonExistent })).toThrow(
      /VX Ace/
    );
  });

  it("constructs successfully when data dir exists", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vxace-test-"));
    const dataDir = path.join(dir, "data");
    fs.mkdirSync(dataDir);
    try {
      expect(() => new VXAceReader({ projectPath: dir })).not.toThrow();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("getPluginFiles returns empty array", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vxace-test-"));
    const dataDir = path.join(dir, "data");
    fs.mkdirSync(dataDir);
    try {
      const reader = new VXAceReader({ projectPath: dir });
      expect(reader.getPluginFiles()).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("readPlugin throws with VX Ace error", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vxace-test-"));
    const dataDir = path.join(dir, "data");
    fs.mkdirSync(dataDir);
    try {
      const reader = new VXAceReader({ projectPath: dir });
      expect(() => reader.readPlugin("SomePlugin.rb")).toThrow(/Ruby scripts/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ── VXAceWriter constructor ────────────────────────────────────────────────────

describe("VXAceWriter constructor", () => {
  it("throws when data directory does not exist", () => {
    const nonExistent = path.join(os.tmpdir(), `vxace-missing-${Date.now()}`);
    expect(() => new VXAceWriter({ projectPath: nonExistent })).toThrow(
      /Data directory not found/
    );
  });

  it("throws with VX Ace-specific message", () => {
    const nonExistent = path.join(os.tmpdir(), `vxace-missing-${Date.now()}`);
    expect(() => new VXAceWriter({ projectPath: nonExistent })).toThrow(
      /VX Ace/
    );
  });

  it("constructs successfully when data dir exists", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vxace-writer-test-"));
    const dataDir = path.join(dir, "data");
    fs.mkdirSync(dataDir);
    try {
      expect(() => new VXAceWriter({ projectPath: dir, createBackup: false })).not.toThrow();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("writePlugin throws with VX Ace error", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vxace-writer-test-"));
    const dataDir = path.join(dir, "data");
    fs.mkdirSync(dataDir);
    try {
      const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
      expect(() => writer.writePlugin("SomePlugin.js", "// code")).toThrow(/Ruby scripts/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("updatePluginsRegistry throws with VX Ace error", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vxace-writer-test-"));
    const dataDir = path.join(dir, "data");
    fs.mkdirSync(dataDir);
    try {
      const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
      expect(() => writer.updatePluginsRegistry({ name: "Test" })).toThrow(/Ruby scripts/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("listPlugins returns empty array", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vxace-writer-test-"));
    const dataDir = path.join(dir, "data");
    fs.mkdirSync(dataDir);
    try {
      const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
      expect(writer.listPlugins()).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("writeDataFile throws for non-.rvdata2 files", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vxace-writer-test-"));
    const dataDir = path.join(dir, "data");
    fs.mkdirSync(dataDir);
    try {
      const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
      expect(() => writer.writeDataFile("Actors.json", [])).toThrow(/rvdata2/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("getBackups returns empty array when backup dir does not exist", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vxace-writer-test-"));
    const dataDir = path.join(dir, "data");
    fs.mkdirSync(dataDir);
    try {
      const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
      expect(writer.getBackups()).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("deleteBackup throws for invalid filename", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vxace-writer-test-"));
    const dataDir = path.join(dir, "data");
    fs.mkdirSync(dataDir);
    try {
      const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
      expect(() => writer.deleteBackup("../evil.rvdata2")).toThrow(/Invalid backup filename/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("restoreFromBackup throws for invalid filename", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vxace-writer-test-"));
    const dataDir = path.join(dir, "data");
    fs.mkdirSync(dataDir);
    try {
      const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
      expect(() => writer.restoreFromBackup("../evil.rvdata2")).toThrow(/Invalid backup filename/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ── Integration tests (require Ruby) ─────────────────────────────────────────

describe("VXAceReader integration (Ruby required)", () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const d of tmpDirs.splice(0)) {
      try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  });

  function createTempProject(): { dir: string; dataDir: string } {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vxace-int-"));
    tmpDirs.push(dir);
    const dataDir = path.join(dir, "data");
    fs.mkdirSync(dataDir);
    return { dir, dataDir };
  }

  itWithRuby("readActors returns actors from Actors.rvdata2", () => {
    const { dir, dataDir } = createTempProject();
    const actors = [null, { id: 1, name: "Hero", initial_level: 1, max_level: 99 }];
    writeMarshalFile(path.join(dataDir, "Actors.rvdata2"), actors);

    const reader = new VXAceReader({ projectPath: dir });
    const result = reader.readActors();
    expect(result).toHaveLength(1);
    // keys normalized: initial_level → initialLevel
    expect((result[0] as Record<string, unknown>)["initialLevel"]).toBe(1);
    expect((result[0] as Record<string, unknown>)["maxLevel"]).toBe(99);
  });

  itWithRuby("readActor returns null for missing id", () => {
    const { dir, dataDir } = createTempProject();
    writeMarshalFile(path.join(dataDir, "Actors.rvdata2"), [null, { id: 1, name: "Hero" }]);

    const reader = new VXAceReader({ projectPath: dir });
    expect(reader.readActor(999)).toBeNull();
  });

  itWithRuby("readActor finds by id", () => {
    const { dir, dataDir } = createTempProject();
    writeMarshalFile(path.join(dataDir, "Actors.rvdata2"), [
      null,
      { id: 1, name: "Hero" },
      { id: 2, name: "Mage" },
    ]);

    const reader = new VXAceReader({ projectPath: dir });
    const actor = reader.readActor(2);
    expect(actor).not.toBeNull();
    expect((actor as Record<string, unknown>)["name"]).toBe("Mage");
  });

  itWithRuby("readMap returns null for missing map file", () => {
    const { dir } = createTempProject();
    const reader = new VXAceReader({ projectPath: dir });
    expect(reader.readMap(999)).toBeNull();
  });

  itWithRuby("getDataInfo returns count and preview", () => {
    const { dir, dataDir } = createTempProject();
    writeMarshalFile(path.join(dataDir, "Actors.rvdata2"), [
      null,
      { id: 1, name: "Hero" },
      { id: 2, name: "Mage" },
    ]);

    const reader = new VXAceReader({ projectPath: dir });
    const info = reader.getDataInfo("Actors");
    expect(info.count).toBe(2);
    expect(info.preview).toHaveLength(2);
  });

  itWithRuby("clearCache clears internal cache", () => {
    const { dir, dataDir } = createTempProject();
    writeMarshalFile(path.join(dataDir, "Actors.rvdata2"), [null, { id: 1, name: "Hero" }]);

    const reader = new VXAceReader({ projectPath: dir });
    reader.readActors(); // populate cache

    // Overwrite the file
    writeMarshalFile(path.join(dataDir, "Actors.rvdata2"), [
      null,
      { id: 1, name: "NewHero" },
    ]);

    // Without clearing cache, still returns old data
    const cached = reader.readActors();
    expect((cached[0] as Record<string, unknown>)["name"]).toBe("Hero");

    // After clearing cache, returns updated data
    reader.clearCache();
    const fresh = reader.readActors();
    expect((fresh[0] as Record<string, unknown>)["name"]).toBe("NewHero");
  });
});

describe("VXAceWriter integration (Ruby required)", () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const d of tmpDirs.splice(0)) {
      try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* ignore */ }
    }
  });

  function createTempProject(): { dir: string; dataDir: string } {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vxace-writer-int-"));
    tmpDirs.push(dir);
    const dataDir = path.join(dir, "data");
    fs.mkdirSync(dataDir);
    fs.mkdirSync(path.join(dir, "backups"), { recursive: true });
    return { dir, dataDir };
  }

  itWithRuby("addActor appends to Actors.rvdata2 and returns new id", () => {
    const { dir, dataDir } = createTempProject();
    writeMarshalFile(path.join(dataDir, "Actors.rvdata2"), [null, { id: 1, name: "Hero" }]);

    const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
    const newId = writer.addActor({ name: "Mage", initial_level: 1 });
    expect(newId).toBe(2);

    // Verify by reading back
    const reader = new VXAceReader({ projectPath: dir });
    const mage = reader.readActor(2);
    expect(mage).not.toBeNull();
    expect((mage as Record<string, unknown>)["name"]).toBe("Mage");
  });

  itWithRuby("updateActor modifies existing entry", () => {
    const { dir, dataDir } = createTempProject();
    writeMarshalFile(path.join(dataDir, "Actors.rvdata2"), [null, { id: 1, name: "Hero" }]);

    const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
    writer.updateActor(1, { name: "SuperHero" });

    const reader = new VXAceReader({ projectPath: dir });
    const actor = reader.readActor(1);
    expect((actor as Record<string, unknown>)["name"]).toBe("SuperHero");
  });

  itWithRuby("updateActor throws for non-existent id", () => {
    const { dir, dataDir } = createTempProject();
    writeMarshalFile(path.join(dataDir, "Actors.rvdata2"), [null, { id: 1, name: "Hero" }]);

    const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
    expect(() => writer.updateActor(999, { name: "Ghost" })).toThrow(/Actor with ID 999 not found/);
  });

  itWithRuby("deleteMap removes map file", () => {
    const { dir, dataDir } = createTempProject();
    const mapFile = path.join(dataDir, "Map001.rvdata2");
    writeMarshalFile(mapFile, { width: 10, height: 10 });

    const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
    writer.deleteMap(1);
    expect(fs.existsSync(mapFile)).toBe(false);
  });

  itWithRuby("deleteMap throws when file does not exist", () => {
    const { dir } = createTempProject();
    const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
    expect(() => writer.deleteMap(999)).toThrow(/Map file not found/);
  });

  itWithRuby("pruneBackups removes excess backup files", () => {
    const { dir, dataDir } = createTempProject();
    writeMarshalFile(path.join(dataDir, "Actors.rvdata2"), [null, { id: 1, name: "Hero" }]);

    const writer = new VXAceWriter({ projectPath: dir, createBackup: true, maxBackups: 2 });

    // Create 4 backups by calling updateActor 4 times
    for (let i = 0; i < 4; i++) {
      writer.updateActor(1, { name: `Hero${i}` });
    }

    const backups = writer.getBackups("Actors");
    expect(backups.length).toBeLessThanOrEqual(2);
  });
});
