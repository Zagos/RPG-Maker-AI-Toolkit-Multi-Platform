import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

export async function handleEditTilesetProperties(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer, projectPath, changeLog } = ctx;

  try {
    const tilesetId = input.tileset_id as number | undefined;
    if (typeof tilesetId !== "number" || tilesetId < 1) {
      return JSON.stringify({ error: "tileset_id is required and must be a positive integer" });
    }

    const tileset = reader.readTileset(tilesetId);
    if (!tileset) return JSON.stringify({ error: `Tileset ${tilesetId} not found` });

    const updates: Record<string, unknown> = {};
    const changes: string[] = [];

    if (input.name !== undefined) {
      const name = input.name as string;
      if (!name || name.trim() === "") return JSON.stringify({ error: "name must be a non-empty string" });
      updates.name = name;
      changes.push(`name='${name}'`);
    }

    if (input.mode !== undefined) {
      const mode = input.mode as number;
      if (mode !== 0 && mode !== 1) return JSON.stringify({ error: "mode must be 0 (World) or 1 (Area)" });
      updates.mode = mode;
      changes.push(`mode=${mode}`);
    }

    if (input.tilesetNames !== undefined) {
      const tilesetNames = input.tilesetNames as string[];
      if (!Array.isArray(tilesetNames) || tilesetNames.length !== 9) {
        return JSON.stringify({ error: "tilesetNames must be an array of exactly 9 entries" });
      }
      updates.tilesetNames = tilesetNames;
      changes.push("tilesetNames updated");
    }

    if (changes.length === 0) {
      return JSON.stringify({ error: "No fields to update. Provide at least one of: name, mode, tilesetNames" });
    }

    const updatedTileset = { ...tileset, ...updates };

    const tilesetsPath = path.join(projectPath, "data", "Tilesets.json");
    const allTilesets = JSON.parse(fs.readFileSync(tilesetsPath, "utf-8")) as Array<Record<string, unknown> | null>;
    const idx = allTilesets.findIndex(
      (t) => t !== null && (t as Record<string, unknown>).id === tilesetId
    );
    if (idx === -1) return JSON.stringify({ error: `Tileset ${tilesetId} not found in Tilesets.json` });
    allTilesets[idx] = updatedTileset;

    writer.writeDataFile("Tilesets.json", allTilesets);

    changeLog.append({
      tool: "edit-tileset-properties",
      entityType: "Tileset",
      entityId: tilesetId,
      action: "update",
      summary: `Tileset ${tilesetId} updated: ${changes.join(", ")}`,
    });

    return JSON.stringify({
      success: true,
      tileset_id: tilesetId,
      changes: changes.join(", "),
      name: updatedTileset.name,
      mode: updatedTileset.mode,
      tilesetNames: updatedTileset.tilesetNames,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
