import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ReadMapTilesTool: Tool = {
  name: "read-map-tiles",
  description:
    "Read the raw tile data of a map. Returns tile IDs per cell and layer. " +
    "Layer 0-3 are tile layers (0=empty, 2048-8191=tile IDs), layer 4 is shadow (0-15), layer 5 is region ID (0-255). " +
    "Tile index formula: x + y*width + layer*width*height. " +
    "Use the optional region parameters to limit output to a sub-area of the map.",
  inputSchema: {
    type: "object",
    properties: {
      map_id: {
        type: "integer",
        description: "Map ID to read tile data from",
      },
      x: {
        type: "integer",
        description: "Top-left X of region to read (default: 0)",
      },
      y: {
        type: "integer",
        description: "Top-left Y of region to read (default: 0)",
      },
      width: {
        type: "integer",
        description: "Width of region in tiles (default: full map width)",
      },
      height: {
        type: "integer",
        description: "Height of region in tiles (default: full map height)",
      },
      layers: {
        type: "array",
        items: { type: "integer" },
        description: "Which layers to include (0-5). Default: all six layers.",
      },
    },
    required: ["map_id"],
  },
};
