import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const PaintMapRegionTool: Tool = {
  name: "paint-map-region",
  description:
    "Write tile IDs into a rectangular region of a map's data array. " +
    "Two modes: fill mode (provide tile_id — fills the entire rectangle with one tile) " +
    "or stamp mode (provide tiles — flat row-major array of length width×height). " +
    "Only one layer is written per call. Use fill-map-region for multi-layer clears.",
  inputSchema: {
    type: "object",
    properties: {
      map_id: {
        type: "integer",
        description: "Map ID to write tiles to",
      },
      layer: {
        type: "integer",
        description: "Layer to write (0-3=tile layers, 4=shadow 0-15, 5=region 0-255)",
      },
      x: {
        type: "integer",
        description: "Top-left X coordinate of the region",
      },
      y: {
        type: "integer",
        description: "Top-left Y coordinate of the region",
      },
      width: {
        type: "integer",
        description: "Width of the region in tiles",
      },
      height: {
        type: "integer",
        description: "Height of the region in tiles",
      },
      tile_id: {
        type: "integer",
        description: "Single tile ID to fill the whole region (mutually exclusive with tiles)",
      },
      tiles: {
        type: "array",
        items: { type: "integer" },
        description:
          "Flat row-major tile ID array of exactly width×height entries (stamp mode). " +
          "Mutually exclusive with tile_id.",
      },
    },
    required: ["map_id", "layer", "x", "y", "width", "height"],
  },
};
