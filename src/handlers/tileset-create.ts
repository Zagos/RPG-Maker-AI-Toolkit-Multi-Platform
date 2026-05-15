import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

export async function handleCreateTileset(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath, changeLog } = ctx;

  try {
    const name = input.name as string;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return JSON.stringify({ error: "name is required and must be a non-empty string" });
    }

    const mode = (input.mode as number | undefined) ?? 1;
    if (mode !== 0 && mode !== 1) {
      return JSON.stringify({ error: "mode must be 0 (World) or 1 (Area/Dungeon)" });
    }

    let tilesetNames = (input.tilesetNames as string[] | undefined) ?? ["", "", "", "", "", "", "", "", ""];
    if (!Array.isArray(tilesetNames) || tilesetNames.length !== 9) {
      return JSON.stringify({ error: "tilesetNames must be an array of exactly 9 strings [A1,A2,A3,A4,A5,B,C,D,E]" });
    }

    const tilesetsPath = path.join(projectPath, "data", "Tilesets.json");
    let allTilesets: Array<Record<string, unknown> | null> = [];
    if (fs.existsSync(tilesetsPath)) {
      allTilesets = JSON.parse(fs.readFileSync(tilesetsPath, "utf-8")) as Array<Record<string, unknown> | null>;
    }

    let maxId = 0;
    for (const t of allTilesets) {
      if (t !== null && typeof (t as Record<string, unknown>).id === "number") {
        maxId = Math.max(maxId, (t as Record<string, unknown>).id as number);
      }
    }
    const newId = maxId + 1;

    const newTileset: Record<string, unknown> = {
      id: newId,
      flags: new Array(8192).fill(0),
      mode,
      name,
      tilesetNames,
    };

    while (allTilesets.length <= newId) allTilesets.push(null);
    allTilesets[newId] = newTileset;

    writer.writeDataFile("Tilesets.json", allTilesets);

    changeLog.append({
      tool: "create-tileset",
      entityType: "Tileset",
      entityId: newId,
      action: "create",
      summary: `Tileset ${newId} created: name='${name}' mode=${mode}`,
    });

    return JSON.stringify({
      success: true,
      tileset_id: newId,
      name,
      mode,
      tilesetNames,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
