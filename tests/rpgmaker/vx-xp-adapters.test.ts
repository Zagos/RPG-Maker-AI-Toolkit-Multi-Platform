import { describe, it, expect, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { VXReader } from "../../src/adapters/vx/reader.js";
import { VXWriter } from "../../src/adapters/vx/writer.js";
import { XPReader } from "../../src/adapters/xp/reader.js";
import { XPWriter } from "../../src/adapters/xp/writer.js";
import { VXAceReader } from "../../src/adapters/vxace/reader.js";
import { VXAceWriter } from "../../src/adapters/vxace/writer.js";

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// ── VXReader tests ────────────────────────────────────────────────────────────

describe("VXReader", () => {
  let dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
    }
    dirs = [];
  });

  it("throws VX-specific error when data directory is missing", () => {
    const dir = makeTempDir("rpgmaker-vx-reader-");
    dirs.push(dir);
    // No data/ subdirectory created
    expect(() => new VXReader({ projectPath: dir })).toThrowError(
      /Is this a valid RPG Maker VX project\?/
    );
  });

  it("is an instance of VXAceReader", () => {
    const dir = makeTempDir("rpgmaker-vx-reader-");
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, "data"));
    const reader = new VXReader({ projectPath: dir });
    expect(reader).toBeInstanceOf(VXAceReader);
  });

  it("uses .rvdata extension", () => {
    const dir = makeTempDir("rpgmaker-vx-reader-");
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, "data"));
    const reader = new VXReader({ projectPath: dir });
    // Access protected ext via cast
    expect((reader as unknown as { ext: string }).ext).toBe(".rvdata");
  });
});

// ── VXWriter tests ────────────────────────────────────────────────────────────

describe("VXWriter", () => {
  let dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
    }
    dirs = [];
  });

  it("throws VX-specific error when data directory is missing", () => {
    const dir = makeTempDir("rpgmaker-vx-writer-");
    dirs.push(dir);
    // No data/ subdirectory created
    expect(() => new VXWriter({ projectPath: dir })).toThrowError(
      /Is this a valid RPG Maker VX project\?/
    );
  });

  it("is an instance of VXAceWriter", () => {
    const dir = makeTempDir("rpgmaker-vx-writer-");
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, "data"));
    const writer = new VXWriter({ projectPath: dir, createBackup: false });
    expect(writer).toBeInstanceOf(VXAceWriter);
  });

  it("uses .rvdata extension", () => {
    const dir = makeTempDir("rpgmaker-vx-writer-");
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, "data"));
    const writer = new VXWriter({ projectPath: dir, createBackup: false });
    expect((writer as unknown as { ext: string }).ext).toBe(".rvdata");
  });

  it("rejects writeDataFile with wrong extension", () => {
    const dir = makeTempDir("rpgmaker-vx-writer-");
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, "data"));
    const writer = new VXWriter({ projectPath: dir, createBackup: false });
    expect(() => writer.writeDataFile("Actors.rvdata2", {})).toThrowError(/\.rvdata/);
  });
});

// ── XPReader tests ────────────────────────────────────────────────────────────

describe("XPReader", () => {
  let dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
    }
    dirs = [];
  });

  it("throws XP-specific error when data directory is missing", () => {
    const dir = makeTempDir("rpgmaker-xp-reader-");
    dirs.push(dir);
    // No data/ subdirectory created
    expect(() => new XPReader({ projectPath: dir })).toThrowError(
      /Is this a valid RPG Maker XP project\?/
    );
  });

  it("is an instance of VXAceReader", () => {
    const dir = makeTempDir("rpgmaker-xp-reader-");
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, "data"));
    const reader = new XPReader({ projectPath: dir });
    expect(reader).toBeInstanceOf(VXAceReader);
  });

  it("uses .rxdata extension", () => {
    const dir = makeTempDir("rpgmaker-xp-reader-");
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, "data"));
    const reader = new XPReader({ projectPath: dir });
    expect((reader as unknown as { ext: string }).ext).toBe(".rxdata");
  });
});

// ── XPWriter tests ────────────────────────────────────────────────────────────

describe("XPWriter", () => {
  let dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
    }
    dirs = [];
  });

  it("throws XP-specific error when data directory is missing", () => {
    const dir = makeTempDir("rpgmaker-xp-writer-");
    dirs.push(dir);
    // No data/ subdirectory created
    expect(() => new XPWriter({ projectPath: dir })).toThrowError(
      /Is this a valid RPG Maker XP project\?/
    );
  });

  it("is an instance of VXAceWriter", () => {
    const dir = makeTempDir("rpgmaker-xp-writer-");
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, "data"));
    const writer = new XPWriter({ projectPath: dir, createBackup: false });
    expect(writer).toBeInstanceOf(VXAceWriter);
  });

  it("uses .rxdata extension", () => {
    const dir = makeTempDir("rpgmaker-xp-writer-");
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, "data"));
    const writer = new XPWriter({ projectPath: dir, createBackup: false });
    expect((writer as unknown as { ext: string }).ext).toBe(".rxdata");
  });

  it("rejects writeDataFile with wrong extension", () => {
    const dir = makeTempDir("rpgmaker-xp-writer-");
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, "data"));
    const writer = new XPWriter({ projectPath: dir, createBackup: false });
    expect(() => writer.writeDataFile("Actors.rvdata2", {})).toThrowError(/\.rxdata/);
  });
});

// ── VXAceReader ext refactor sanity check ─────────────────────────────────────

describe("VXAceReader ext refactor", () => {
  let dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
    }
    dirs = [];
  });

  it("still uses .rvdata2 extension", () => {
    const dir = makeTempDir("rpgmaker-vxace-reader-");
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, "data"));
    const reader = new VXAceReader({ projectPath: dir });
    expect((reader as unknown as { ext: string }).ext).toBe(".rvdata2");
  });
});

// ── VXAceWriter ext refactor sanity check ─────────────────────────────────────

describe("VXAceWriter ext refactor", () => {
  let dirs: string[] = [];

  afterEach(() => {
    for (const d of dirs) {
      try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
    }
    dirs = [];
  });

  it("still uses .rvdata2 extension", () => {
    const dir = makeTempDir("rpgmaker-vxace-writer-");
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, "data"));
    const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
    expect((writer as unknown as { ext: string }).ext).toBe(".rvdata2");
  });

  it("rejects writeDataFile with wrong extension", () => {
    const dir = makeTempDir("rpgmaker-vxace-writer-");
    dirs.push(dir);
    fs.mkdirSync(path.join(dir, "data"));
    const writer = new VXAceWriter({ projectPath: dir, createBackup: false });
    expect(() => writer.writeDataFile("Actors.rxdata", {})).toThrowError(/\.rvdata2/);
  });
});
