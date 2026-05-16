import { describe, it, expect, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { MVReader } from "../../src/adapters/mv/reader.js";
import { MVWriter } from "../../src/adapters/mv/writer.js";
import { RPGMakerReader } from "../../src/adapters/mz/reader.js";
import { RPGMakerWriter } from "../../src/adapters/mz/writer.js";

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-mv-test-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);
  fs.writeFileSync(
    path.join(dataDir, "Actors.json"),
    JSON.stringify([null, { id: 1, name: "Hero", classId: 1, initialLevel: 1, maxLevel: 99, traits: [], equips: [] }]),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(dataDir, "System.json"),
    JSON.stringify({ gameTitle: "Test MV Game", versionId: 1 }),
    "utf-8"
  );
  return dir;
}

const dirs: string[] = [];

afterEach(() => {
  for (const d of dirs.splice(0)) {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

describe("MVReader", () => {
  it("is a subclass of RPGMakerReader", () => {
    const dir = createTempProject();
    dirs.push(dir);
    const reader = new MVReader({ projectPath: dir });
    expect(reader).toBeInstanceOf(RPGMakerReader);
    expect(reader).toBeInstanceOf(MVReader);
  });

  it("reads actors from an MV project", () => {
    const dir = createTempProject();
    dirs.push(dir);
    const reader = new MVReader({ projectPath: dir });
    const actors = reader.readActors();
    expect(actors).toHaveLength(1);
    expect(actors[0].name).toBe("Hero");
  });

  it("throws with MV-specific error when data dir missing", () => {
    expect(() => new MVReader({ projectPath: "/nonexistent/path" })).toThrow(
      /RPG Maker MV project/
    );
  });

  it("MZ reader throws with MZ-specific error when data dir missing", () => {
    expect(() => new RPGMakerReader({ projectPath: "/nonexistent/path" })).toThrow(
      /RPG Maker MZ project/
    );
  });
});

describe("MVWriter", () => {
  it("is a subclass of RPGMakerWriter", () => {
    const dir = createTempProject();
    dirs.push(dir);
    const writer = new MVWriter({ projectPath: dir });
    expect(writer).toBeInstanceOf(RPGMakerWriter);
    expect(writer).toBeInstanceOf(MVWriter);
  });

  it("throws with MV-specific error when data dir missing", () => {
    expect(() => new MVWriter({ projectPath: "/nonexistent/path" })).toThrow(
      /RPG Maker MV project/
    );
  });

  it("can update an actor in an MV project", () => {
    const dir = createTempProject();
    dirs.push(dir);
    const writer = new MVWriter({ projectPath: dir, createBackup: false });
    writer.updateActor(1, { name: "MVHero" });
    const reader = new MVReader({ projectPath: dir });
    const actor = reader.readActor(1);
    expect(actor?.name).toBe("MVHero");
  });
});
