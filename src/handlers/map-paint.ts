import type { HandlerContext } from "./types.js";

const LAYER_MAX: Record<number, number> = { 0: 8191, 1: 8191, 2: 8191, 3: 8191, 4: 15, 5: 255 };

export async function handlePaintMapRegion(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer, changeLog } = ctx;

  try {
    const mapId = input.map_id as number;
    const layer = input.layer as number;
    const x = input.x as number;
    const y = input.y as number;
    const regionW = input.width as number;
    const regionH = input.height as number;
    const tileId = input.tile_id as number | undefined;
    const stampTiles = input.tiles as number[] | undefined;

    if (typeof mapId !== "number" || mapId < 1) {
      return JSON.stringify({ error: "map_id must be a positive integer" });
    }
    if (typeof layer !== "number" || layer < 0 || layer > 5) {
      return JSON.stringify({ error: "layer must be 0–5" });
    }
    if (tileId === undefined && (!Array.isArray(stampTiles) || stampTiles.length === 0)) {
      return JSON.stringify({ error: "Provide either tile_id (fill mode) or tiles (stamp mode)" });
    }
    if (tileId !== undefined && stampTiles !== undefined) {
      return JSON.stringify({ error: "tile_id and tiles are mutually exclusive" });
    }

    const mapData = reader.readMap(mapId);
    if (!mapData) return JSON.stringify({ error: `Map ${mapId} not found` });

    const { width, height } = mapData;

    if (typeof x !== "number" || x < 0 || x >= width) return JSON.stringify({ error: `x must be 0–${width - 1}` });
    if (typeof y !== "number" || y < 0 || y >= height) return JSON.stringify({ error: `y must be 0–${height - 1}` });
    if (typeof regionW !== "number" || regionW < 1) return JSON.stringify({ error: "width must be >= 1" });
    if (typeof regionH !== "number" || regionH < 1) return JSON.stringify({ error: "height must be >= 1" });

    const layerMax = LAYER_MAX[layer];

    if (tileId !== undefined) {
      if (tileId < 0 || tileId > layerMax) {
        return JSON.stringify({ error: `tile_id must be 0–${layerMax} for layer ${layer}` });
      }
    }

    if (stampTiles !== undefined) {
      const expected = regionW * regionH;
      if (stampTiles.length !== expected) {
        return JSON.stringify({ error: `tiles array length (${stampTiles.length}) must equal width×height (${expected})` });
      }
      for (const tid of stampTiles) {
        if (typeof tid !== "number" || tid < 0 || tid > layerMax) {
          return JSON.stringify({ error: `All tiles must be 0–${layerMax} for layer ${layer}` });
        }
      }
    }

    const data = [...mapData.data];
    const endX = Math.min(x + regionW, width);
    const endY = Math.min(y + regionH, height);
    let count = 0;

    for (let ty = y; ty < endY; ty++) {
      for (let tx = x; tx < endX; tx++) {
        const idx = tx + ty * width + layer * width * height;
        if (tileId !== undefined) {
          data[idx] = tileId;
        } else {
          const stampIdx = (ty - y) * regionW + (tx - x);
          data[idx] = stampTiles![stampIdx];
        }
        count++;
      }
    }

    writer.writeMap(mapId, { ...mapData, data });

    const mode = tileId !== undefined ? "fill" : "stamp";
    changeLog.append({
      tool: "paint-map-region",
      entityType: "Map",
      entityId: mapId,
      action: "update",
      summary: `Map ${mapId}: ${mode} ${count} cells on layer ${layer} at (${x},${y}) ${regionW}x${regionH}`,
    });

    return JSON.stringify({ success: true, map_id: mapId, mode, layer, cells_written: count });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
