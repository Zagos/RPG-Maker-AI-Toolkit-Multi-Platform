import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

export async function handleCopyMap(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath, changeLog } = ctx;

  try {
    const sourceMapId = input.source_map_id as number;
    const newName = (input.new_name as string | undefined)?.trim();
    const parentId = (input.parent_id as number | undefined) ?? 0;

    if (!sourceMapId || sourceMapId < 1) return JSON.stringify({ error: "source_map_id must be a positive integer" });
    if (!newName) return JSON.stringify({ error: "new_name is required" });

    const dataDir = path.join(projectPath, "data");
    const sourceFilename = `Map${String(sourceMapId).padStart(3, "0")}.json`;

    if (!fs.existsSync(path.join(dataDir, sourceFilename))) {
      return JSON.stringify({ error: `Source map not found: ${sourceFilename}` });
    }

    const mapData = JSON.parse(fs.readFileSync(path.join(dataDir, sourceFilename), "utf-8")) as Record<string, unknown>;

    const mapInfosPath = path.join(dataDir, "MapInfos.json");
    if (!fs.existsSync(mapInfosPath)) return JSON.stringify({ error: "MapInfos.json not found" });
    const mapInfos = JSON.parse(fs.readFileSync(mapInfosPath, "utf-8")) as Array<Record<string, unknown> | null>;

    const existingIds = fs.readdirSync(dataDir)
      .filter((f) => /^Map\d+\.json$/.test(f))
      .map((f) => parseInt(f.replace("Map", "").replace(".json", ""), 10))
      .filter((n) => !isNaN(n));
    const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

    const newMapData = JSON.parse(JSON.stringify(mapData)) as Record<string, unknown>;
    writer.writeDataFile(`Map${String(newId).padStart(3, "0")}.json`, newMapData);

    while (mapInfos.length <= newId) mapInfos.push(null);
    mapInfos[newId] = { id: newId, name: newName, parentId, order: newId, expanded: false, scrollX: 0, scrollY: 0 };
    writer.writeDataFile("MapInfos.json", mapInfos);

    changeLog.append({
      tool: "copy-map",
      entityType: "Map",
      entityId: newId,
      action: "create",
      summary: `Map ${newId} created as copy of Map ${sourceMapId}: name='${newName}'`,
    });

    return JSON.stringify({ success: true, new_map_id: newId, name: newName, copied_from: sourceMapId });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
