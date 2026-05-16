import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const FillMapRegionTool: Tool = {
  name: "fill-map-region",
  description:
    "Fill a rectangular region of a map with a single tile ID. Far more efficient than painting tiles one by one. " +
    "Use tile_id=0 to clear/erase a region. Works on any of the 6 layers (0-3=tile, 4=shadow, 5=region).",
  inputSchema: {
    type: "object",
    properties: {
      map_id: {
        type: "integer",
        description: "Map ID to fill",
      },
      x: {
        type: "integer",
        description: "X coordinate of the top-left corner of the fill region",
      },
      y: {
        type: "integer",
        description: "Y coordinate of the top-left corner of the fill region",
      },
      width: {
        type: "integer",
        description: "Width of the fill region in tiles (clamped to map bounds)",
      },
      height: {
        type: "integer",
        description: "Height of the fill region in tiles (clamped to map bounds)",
      },
      layer: {
        type: "integer",
        description: "Layer to fill: 0-3=tile layers, 4=shadow, 5=region",
      },
      tile_id: {
        type: "integer",
        description: "Tile ID to fill with (0=clear). Layers 0-3: 0-8191. Layer 4: 0-15. Layer 5: 0-255.",
      },
    },
    required: ["map_id", "x", "y", "width", "height", "layer", "tile_id"],
  },
};
