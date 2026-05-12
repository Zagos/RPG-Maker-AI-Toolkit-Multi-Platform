import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

export async function handleListMaps(ctx: HandlerContext): Promise<string> {
  try {
    const mapInfosPath = path.join(ctx.projectPath, "data", "MapInfos.json");
    if (!fs.existsSync(mapInfosPath)) {
      return JSON.stringify({ error: "MapInfos.json not found" });
    }

    const raw = JSON.parse(fs.readFileSync(mapInfosPath, "utf-8")) as Array<Record<string, unknown> | null>;

    const maps = raw
      .map((entry, idx) => (entry === null ? null : { id: idx, name: entry.name, parent_id: entry.parentId, order: entry.order, expanded: entry.expanded }))
      .filter((e): e is NonNullable<typeof e> => e !== null);

    maps.sort((a, b) => (a.order as number) - (b.order as number));

    return JSON.stringify({ success: true, count: maps.length, maps });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
