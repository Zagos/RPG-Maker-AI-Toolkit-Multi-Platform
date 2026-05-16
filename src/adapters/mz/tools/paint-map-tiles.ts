import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const PaintMapTilesTool: Tool = {
  name: "paint-map-tiles",
  description:
    "Paint individual tiles on a map. Accepts an array of tile changes, each specifying coordinates, layer, and tile ID. " +
    "Layer 0-3: tile layers (0=empty, valid non-zero IDs start at 2048). Layer 4: shadow flags (0-15). Layer 5: region ID (0-255). " +
    "All changes are written atomically — the map file is saved once after all edits.",
  inputSchema: {
    type: "object",
    properties: {
      map_id: {
        type: "integer",
        description: "Map ID to paint tiles on",
      },
      tiles: {
        type: "array",
        description: "Array of tile changes to apply",
        items: {
          type: "object",
          properties: {
            x: { type: "integer", description: "Column (0 = leftmost)" },
            y: { type: "integer", description: "Row (0 = topmost)" },
            layer: {
              type: "integer",
              description: "Layer 0-3=tile, 4=shadow, 5=region",
            },
            tile_id: {
              type: "integer",
              description: "Tile ID to place (0=clear). Layers 0-3: 0-8191. Layer 4: 0-15. Layer 5: 0-255.",
            },
          },
          required: ["x", "y", "layer", "tile_id"],
        },
        minItems: 1,
      },
    },
    required: ["map_id", "tiles"],
  },
};
