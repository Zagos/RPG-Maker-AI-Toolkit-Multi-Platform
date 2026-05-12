import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

const DIR_ALL_BLOCKED = 0x000F;
const DIR_ALL_PASSABLE = 0x0000;
const TERRAIN_TAG_SHIFT = 12;
const TERRAIN_TAG_MASK = 0xF000;

export async function handleEditTileset(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer, projectPath, changeLog } = ctx;

  try {
    const tilesetId = input.tileset_id as number | undefined;
    if (typeof tilesetId !== "number" || tilesetId < 1) {
      return JSON.stringify({ error: "tileset_id is required and must be a positive integer" });
    }

    const overrides = input.flag_overrides as Array<{ tile_id: number; passable?: boolean; terrain_tag?: number }> | undefined;
    if (!overrides || overrides.length === 0) {
      return JSON.stringify({ error: "flag_overrides must be a non-empty array" });
    }

    const tileset = reader.readTileset(tilesetId);
    if (!tileset) return JSON.stringify({ error: `Tileset ${tilesetId} not found` });

    const flags = [...(tileset.flags as number[])];

    for (const override of overrides) {
      const tileId = override.tile_id;
      if (typeof tileId !== "number" || tileId < 0 || tileId > 8191) {
        return JSON.stringify({ error: `Invalid tile_id: ${tileId}. Must be 0–8191.` });
      }
      if (override.terrain_tag !== undefined && (override.terrain_tag < 0 || override.terrain_tag > 7)) {
        return JSON.stringify({ error: `terrain_tag must be 0–7, got ${override.terrain_tag}` });
      }

      let flag = flags[tileId] ?? 0;

      if (override.passable !== undefined) {
        flag = (flag & ~DIR_ALL_BLOCKED) | (override.passable ? DIR_ALL_PASSABLE : DIR_ALL_BLOCKED);
      }
      if (override.terrain_tag !== undefined) {
        flag = (flag & ~TERRAIN_TAG_MASK) | (override.terrain_tag << TERRAIN_TAG_SHIFT);
      }

      flags[tileId] = flag;
    }

    const updatedTileset = { ...tileset, flags };

    const tilesetsPath = path.join(projectPath, "data", "Tilesets.json");
    const allTilesets = JSON.parse(fs.readFileSync(tilesetsPath, "utf-8")) as Array<Record<string, unknown> | null>;
    const idx = allTilesets.findIndex((t) => t !== null && (t as Record<string, unknown>).id === tilesetId);
    if (idx !== -1) allTilesets[idx] = updatedTileset;

    writer.writeDataFile("Tilesets.json", allTilesets);

    changeLog.append({
      tool: "edit-tileset",
      entityType: "Tileset",
      entityId: tilesetId,
      action: "update",
      summary: `Tileset ${tilesetId} updated: ${overrides.length} tile flag(s) changed`,
    });

    return JSON.stringify({ success: true, tileset_id: tilesetId, tiles_updated: overrides.length });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
