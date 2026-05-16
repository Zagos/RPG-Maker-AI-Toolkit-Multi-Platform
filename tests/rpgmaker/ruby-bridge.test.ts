import { describe, it, expect, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { spawnSync } from "child_process";
import {
  isRubyAvailable,
  readMarshalFile,
  writeMarshalFile,
  getBridgeScriptPath,
} from "../../src/adapters/ruby-bridge/index.js";

const rubyAvailable = isRubyAvailable();

// ── Static checks (no Ruby needed) ───────────────────────────────────────────

describe("getBridgeScriptPath", () => {
  it("returns a path ending in bridge.rb", () => {
    expect(getBridgeScriptPath()).toMatch(/bridge\.rb$/);
  });

  it("bridge.rb exists on disk", () => {
    expect(fs.existsSync(getBridgeScriptPath())).toBe(true);
  });
});

describe("isRubyAvailable", () => {
  it("returns a boolean", () => {
    expect(typeof isRubyAvailable()).toBe("boolean");
  });

  it("returns false for a non-existent ruby binary", () => {
    expect(isRubyAvailable("/definitely/not/ruby")).toBe(false);
  });
});

describe("readMarshalFile (no Ruby)", () => {
  it("throws when Ruby is not found", () => {
    expect(() =>
      readMarshalFile("whatever.rvdata2", { rubyPath: "/no/ruby" })
    ).toThrow(/Ruby bridge failed to start/);
  });
});

describe("writeMarshalFile (no Ruby)", () => {
  it("throws when Ruby is not found", () => {
    expect(() =>
      writeMarshalFile("whatever.rvdata2", {}, { rubyPath: "/no/ruby" })
    ).toThrow(/Ruby bridge failed to start/);
  });
});

// ── Integration tests (require Ruby) ─────────────────────────────────────────

const itWithRuby = it.skipIf(!rubyAvailable);

describe("round-trip integration (Ruby required)", () => {
  const tmpFiles: string[] = [];

  afterEach(() => {
    for (const f of tmpFiles.splice(0)) {
      try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
  });

  function tmpFile(ext: string): string {
    const f = path.join(os.tmpdir(), `bridge-test-${Date.now()}${ext}`);
    tmpFiles.push(f);
    return f;
  }

  itWithRuby("reads a simple array Marshal file", () => {
    const file = tmpFile(".rvdata2");
    const code = `File.binwrite(${JSON.stringify(file)}, Marshal.dump([nil, {"id" => 1, "name" => "Hero"}]))`;
    const r = spawnSync("ruby", ["-e", code], { encoding: "utf-8", timeout: 10_000 });
    expect(r.status).toBe(0);

    const data = readMarshalFile(file) as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toBeNull();
    const entry = data[1] as Record<string, unknown>;
    expect(entry["id"]).toBe(1);
    expect(entry["name"]).toBe("Hero");
  });

  itWithRuby("round-trips a hash Marshal file", () => {
    const file = tmpFile(".rxdata");

    // Write a simple hash with Marshal
    const writeCode = `File.binwrite(${JSON.stringify(file)}, Marshal.dump({"title" => "Test Game", "version" => 3}))`;
    spawnSync("ruby", ["-e", writeCode], { encoding: "utf-8", timeout: 10_000 });

    // Read with bridge
    const data = readMarshalFile(file) as Record<string, unknown>;
    expect(data["title"]).toBe("Test Game");
    expect(data["version"]).toBe(3);

    // Mutate and write back
    data["version"] = 4;
    const out = tmpFile(".rxdata");
    writeMarshalFile(out, data);

    // Read back with Ruby to verify
    const readCode = `require 'json'; d = Marshal.load(File.binread(${JSON.stringify(out)})); puts JSON.generate(d)`;
    const r = spawnSync("ruby", ["-e", readCode], { encoding: "utf-8", timeout: 10_000 });
    const result = JSON.parse(r.stdout) as Record<string, unknown>;
    expect(result["version"]).toBe(4);
  });

  itWithRuby("handles nil entries in arrays (RPG Maker pattern)", () => {
    const file = tmpFile(".rvdata2");
    const code = `File.binwrite(${JSON.stringify(file)}, Marshal.dump([nil, nil, {"id"=>2,"name"=>"Slime"}]))`;
    spawnSync("ruby", ["-e", code], { encoding: "utf-8", timeout: 10_000 });

    const data = readMarshalFile(file) as unknown[];
    expect(data[0]).toBeNull();
    expect(data[1]).toBeNull();
    expect((data[2] as Record<string, unknown>)["name"]).toBe("Slime");
  });
});
