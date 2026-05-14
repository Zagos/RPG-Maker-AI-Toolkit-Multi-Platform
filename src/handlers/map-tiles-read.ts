import type { HandlerContext } from "./types.js";

export async function handleReadMapTiles(ctx: HandlerContext): Promise<string> {
  const { input, reader } = ctx;

  try {
    const mapId = input.map_id as number;
    if (typeof mapId !== "number" || mapId < 1) {
      return JSON.stringify({ error: "map_id is required and must be a positive integer" });
    }

    const mapData = reader.readMap(mapId);
    if (!mapData) return JSON.stringify({ error: `Map ${mapId} not found` });

    const { width, height, data } = mapData;

    const startX = (input.x as number | undefined) ?? 0;
    const startY = (input.y as number | undefined) ?? 0;
    const regionW = (input.width as number | undefined) ?? width;
    const regionH = (input.height as number | undefined) ?? height;
    const layersFilter = (input.layers as number[] | undefined) ?? [0, 1, 2, 3, 4, 5];

    if (startX < 0 || startX >= width) {
      return JSON.stringify({ error: `x must be 0–${width - 1}` });
    }
    if (startY < 0 || startY >= height) {
      return JSON.stringify({ error: `y must be 0–${height - 1}` });
    }
    for (const z of layersFilter) {
      if (z < 0 || z > 5) return JSON.stringify({ error: `layer ${z} is out of range 0–5` });
    }

    const endX = Math.min(startX + regionW, width);
    const endY = Math.min(startY + regionH, height);

    const tiles: Array<{ x: number; y: number; layers: number[] }> = [];

    for (let ty = startY; ty < endY; ty++) {
      for (let tx = startX; tx < endX; tx++) {
        const layerValues = layersFilter.map((z) => data[tx + ty * width + z * width * height] ?? 0);
        tiles.push({ x: tx, y: ty, layers: layerValues });
      }
    }

    return JSON.stringify({
      map_id: mapId,
      map_width: width,
      map_height: height,
      region: { x: startX, y: startY, width: endX - startX, height: endY - startY },
      layers_reported: layersFilter,
      tiles,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
