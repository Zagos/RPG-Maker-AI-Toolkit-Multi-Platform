import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

export async function handleEditMapInfo(ctx: HandlerContext): Promise<string> {
  const { input, projectPath } = ctx;
  const mapId = input.map_id as number;

  const mapInfosPath = path.join(projectPath, "data", "MapInfos.json");
  try {
    const mapInfos = JSON.parse(fs.readFileSync(mapInfosPath, "utf-8")) as Array<Record<string, unknown> | null>;

    if (mapId >= mapInfos.length || mapInfos[mapId] === null) {
      return JSON.stringify({ error: `Map ${mapId} not found in MapInfos.json` });
    }

    const current = mapInfos[mapId] as Record<string, unknown>;
    if (input.name !== undefined) current.name = input.name;
    if (input.parent_id !== undefined) current.parentId = input.parent_id;
    if (input.order !== undefined) current.order = input.order;
    if (input.expanded !== undefined) current.expanded = input.expanded;
    if (input.scroll_x !== undefined) current.scrollX = input.scroll_x;
    if (input.scroll_y !== undefined) current.scrollY = input.scroll_y;

    fs.writeFileSync(mapInfosPath, JSON.stringify(mapInfos, null, 2) + "\n", "utf-8");

    ctx.changeLog.append({
      tool: "edit-map-info",
      entityType: "Map",
      entityId: mapId,
      action: "update",
      summary: `MapInfo ${mapId} updated`,
    });
    return JSON.stringify({ success: true, message: `MapInfo for map ${mapId} updated`, map_id: mapId });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
