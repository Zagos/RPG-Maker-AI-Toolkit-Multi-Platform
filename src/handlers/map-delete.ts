import type { HandlerContext } from "./types.js";

export async function handleDeleteMap(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const mapId = input.map_id as number | undefined;
    if (typeof mapId !== "number" || mapId < 1) {
      return JSON.stringify({ error: "map_id is required and must be a positive integer" });
    }
    if (input.confirm !== true) {
      return JSON.stringify({ error: "Set confirm: true to proceed with map deletion. This action creates a backup but cannot be undone easily." });
    }

    writer.deleteMap(mapId);

    changeLog.append({
      tool: "delete-map",
      entityType: "Map",
      entityId: mapId,
      action: "delete",
      summary: `Map ${mapId} deleted (backup created)`,
    });

    return JSON.stringify({ success: true, map_id: mapId, message: `Map ${mapId} deleted. A backup was created in the backups/ directory.` });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
