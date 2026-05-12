import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { RPGMakerReader } from "../../src/rpgmaker/reader.js";
import { RPGMakerWriter } from "../../src/rpgmaker/writer.js";
import { RPGMakerDebugBridge } from "../../src/rpgmaker/debug-bridge.js";
import { ChangeLog } from "../../src/rpgmaker/change-log.js";
import { handleEditTileset } from "../../src/handlers/tileset.js";
import type { HandlerContext } from "../../src/handlers/types.js";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function createTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-tileset-"));
  const dataDir = path.join(dir, "data");
  fs.mkdirSync(dataDir);

  // Flags: 8192-element array, all passable (0x0000) initially
  const flags = Array.from({ length: 8192 }, () => 0);

  writeJson(path.join(dataDir, "Tilesets.json"), [
    null,
    {
      id: 1,
      name: "Exterior",
      mode: 1,
      tilesetNames: [],
      flags,
      note: "",
    },
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

describe("handleEditTileset", () => {
  let dir: string;

  beforeEach(() => { dir = createTempProject(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it("marks a tile as impassable", async () => {
    const result = JSON.parse(await handleEditTileset(makeCtx(dir, {
      tileset_id: 1,
      flag_overrides: [{ tile_id: 16, passable: false }],
    })));

    expect(result.success).toBe(true);
    expect(result.tiles_updated).toBe(1);

    const tilesets = readJson(path.join(dir, "data", "Tilesets.json")) as Array<{ flags: number[] } | null>;
    expect(tilesets[1]?.flags[16]).toBe(0x000F); // all directions blocked
  });

  it("marks a tile as passable", async () => {
    // First block it
    await handleEditTileset(makeCtx(dir, {
      tileset_id: 1,
      flag_overrides: [{ tile_id: 16, passable: false }],
    }));
    // Then unblock it
    const result = JSON.parse(await handleEditTileset(makeCtx(dir, {
      tileset_id: 1,
      flag_overrides: [{ tile_id: 16, passable: true }],
    })));

    expect(result.success).toBe(true);
    const tilesets = readJson(path.join(dir, "data", "Tilesets.json")) as Array<{ flags: number[] } | null>;
    expect(tilesets[1]?.flags[16]).toBe(0x0000);
  });

  it("sets a terrain tag on a tile", async () => {
    const result = JSON.parse(await handleEditTileset(makeCtx(dir, {
      tileset_id: 1,
      flag_overrides: [{ tile_id: 5, terrain_tag: 3 }],
    })));

    expect(result.success).toBe(true);
    const tilesets = readJson(path.join(dir, "data", "Tilesets.json")) as Array<{ flags: number[] } | null>;
    expect(tilesets[1]?.flags[5]).toBe(3 << 12); // 0x3000
  });

  it("sets both passable and terrain_tag simultaneously", async () => {
    const result = JSON.parse(await handleEditTileset(makeCtx(dir, {
      tileset_id: 1,
      flag_overrides: [{ tile_id: 10, passable: false, terrain_tag: 5 }],
    })));

    expect(result.success).toBe(true);
    const tilesets = readJson(path.join(dir, "data", "Tilesets.json")) as Array<{ flags: number[] } | null>;
    const flag = tilesets[1]?.flags[10] ?? 0;
    expect(flag & 0x000F).toBe(0x000F); // impassable
    expect((flag >> 12) & 0xF).toBe(5); // terrain tag 5
  });

  it("updates multiple tiles in one call", async () => {
    const result = JSON.parse(await handleEditTileset(makeCtx(dir, {
      tileset_id: 1,
      flag_overrides: [
        { tile_id: 0, passable: false },
        { tile_id: 1, passable: false },
        { tile_id: 2, terrain_tag: 1 },
      ],
    })));

    expect(result.tiles_updated).toBe(3);
  });

  it("returns error for invalid tileset_id", async () => {
    const result = JSON.parse(await handleEditTileset(makeCtx(dir, {
      tileset_id: 99,
      flag_overrides: [{ tile_id: 0, passable: false }],
    })));
    expect(result.error).toBeDefined();
  });

  it("returns error for out-of-range tile_id", async () => {
    const result = JSON.parse(await handleEditTileset(makeCtx(dir, {
      tileset_id: 1,
      flag_overrides: [{ tile_id: 9999, passable: false }],
    })));
    expect(result.error).toBeDefined();
  });

  it("returns error for terrain_tag out of range", async () => {
    const result = JSON.parse(await handleEditTileset(makeCtx(dir, {
      tileset_id: 1,
      flag_overrides: [{ tile_id: 0, terrain_tag: 8 }],
    })));
    expect(result.error).toBeDefined();
  });

  it("returns error when flag_overrides is empty", async () => {
    const result = JSON.parse(await handleEditTileset(makeCtx(dir, {
      tileset_id: 1,
      flag_overrides: [],
    })));
    expect(result.error).toBeDefined();
  });

  it("returns error when tileset_id is missing", async () => {
    const result = JSON.parse(await handleEditTileset(makeCtx(dir, {
      flag_overrides: [{ tile_id: 0, passable: false }],
    })));
    expect(result.error).toBeDefined();
  });

  it("appends to change log", async () => {
    const ctx = makeCtx(dir, {
      tileset_id: 1,
      flag_overrides: [{ tile_id: 0, passable: false }],
    });
    await handleEditTileset(ctx);
    const entries = ctx.changeLog.read();
    expect(entries[0].tool).toBe("edit-tileset");
    expect(entries[0].entityId).toBe(1);
  });
});
