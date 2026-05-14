import type { HandlerContext } from "./types.js";

interface TileChange {
  x: number;
  y: number;
  layer: number;
  tile_id: number;
}

const LAYER_MAX: Record<number, number> = { 0: 8191, 1: 8191, 2: 8191, 3: 8191, 4: 15, 5: 255 };

export async function handlePaintMapTiles(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer, changeLog } = ctx;

  try {
    const mapId = input.map_id as number;
    if (typeof mapId !== "number" || mapId < 1) {
      return JSON.stringify({ error: "map_id is required and must be a positive integer" });
    }

    const tiles = input.tiles as TileChange[] | undefined;
    if (!Array.isArray(tiles) || tiles.length === 0) {
      return JSON.stringify({ error: "tiles must be a non-empty array" });
    }

    const mapData = reader.readMap(mapId);
    if (!mapData) return JSON.stringify({ error: `Map ${mapId} not found` });

    const { width, height } = mapData;
    const data = [...mapData.data];
    const errors: string[] = [];
    let painted = 0;

    for (const tile of tiles) {
      const { x, y, layer, tile_id } = tile;

      if (typeof x !== "number" || x < 0 || x >= width) {
        errors.push(`Invalid x=${x}: must be 0–${width - 1}`);
        continue;
      }
      if (typeof y !== "number" || y < 0 || y >= height) {
        errors.push(`Invalid y=${y}: must be 0–${height - 1}`);
        continue;
      }
      if (typeof layer !== "number" || layer < 0 || layer > 5) {
        errors.push(`Invalid layer=${layer}: must be 0–5`);
        continue;
      }
      if (typeof tile_id !== "number" || tile_id < 0 || tile_id > LAYER_MAX[layer]) {
        errors.push(`Invalid tile_id=${tile_id} for layer ${layer}: must be 0–${LAYER_MAX[layer]}`);
        continue;
      }

      data[x + y * width + layer * width * height] = tile_id;
      painted++;
    }

    if (painted === 0) {
      return JSON.stringify({ error: "All tile changes had errors", details: errors });
    }

    writer.writeMap(mapId, { ...mapData, data });

    changeLog.append({
      tool: "paint-map-tiles",
      entityType: "Map",
      entityId: mapId,
      action: "update",
      summary: `Map ${mapId}: painted ${painted} tile(s)`,
    });

    return JSON.stringify({
      success: true,
      map_id: mapId,
      tiles_painted: painted,
      ...(errors.length > 0 ? { warnings: errors } : {}),
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
