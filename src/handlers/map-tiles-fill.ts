import type { HandlerContext } from "./types.js";

const LAYER_MAX: Record<number, number> = { 0: 8191, 1: 8191, 2: 8191, 3: 8191, 4: 15, 5: 255 };

export async function handleFillMapRegion(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer, changeLog } = ctx;

  try {
    const mapId = input.map_id as number;
    const x = input.x as number;
    const y = input.y as number;
    const regionW = input.width as number;
    const regionH = input.height as number;
    const layer = input.layer as number;
    const tileId = input.tile_id as number;

    if (typeof mapId !== "number" || mapId < 1) {
      return JSON.stringify({ error: "map_id must be a positive integer" });
    }

    const mapData = reader.readMap(mapId);
    if (!mapData) return JSON.stringify({ error: `Map ${mapId} not found` });

    const { width, height } = mapData;

    if (typeof x !== "number" || x < 0 || x >= width) {
      return JSON.stringify({ error: `x must be 0–${width - 1}` });
    }
    if (typeof y !== "number" || y < 0 || y >= height) {
      return JSON.stringify({ error: `y must be 0–${height - 1}` });
    }
    if (typeof regionW !== "number" || regionW < 1) {
      return JSON.stringify({ error: "width must be >= 1" });
    }
    if (typeof regionH !== "number" || regionH < 1) {
      return JSON.stringify({ error: "height must be >= 1" });
    }
    if (typeof layer !== "number" || layer < 0 || layer > 5) {
      return JSON.stringify({ error: "layer must be 0–5" });
    }
    if (typeof tileId !== "number" || tileId < 0 || tileId > LAYER_MAX[layer]) {
      return JSON.stringify({ error: `tile_id must be 0–${LAYER_MAX[layer]} for layer ${layer}` });
    }

    const data = [...mapData.data];
    const endX = Math.min(x + regionW, width);
    const endY = Math.min(y + regionH, height);
    let count = 0;

    for (let ty = y; ty < endY; ty++) {
      for (let tx = x; tx < endX; tx++) {
        data[tx + ty * width + layer * width * height] = tileId;
        count++;
      }
    }

    writer.writeMap(mapId, { ...mapData, data });

    changeLog.append({
      tool: "fill-map-region",
      entityType: "Map",
      entityId: mapId,
      action: "update",
      summary: `Map ${mapId}: filled ${count} tiles with id=${tileId} on layer ${layer} (${regionW}x${regionH} at ${x},${y})`,
    });

    return JSON.stringify({
      success: true,
      map_id: mapId,
      tiles_filled: count,
      region: { x, y, width: endX - x, height: endY - y },
      layer,
      tile_id: tileId,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
