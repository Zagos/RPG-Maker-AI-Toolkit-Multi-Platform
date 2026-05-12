import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditTilesetTool: Tool = {
  name: "edit-tileset",
  description:
    "Edit passage flags and terrain tags for individual tiles in a tileset (Tilesets.json). Use list-game-data with Tilesets to find tileset IDs.",
  inputSchema: {
    type: "object",
    properties: {
      tileset_id: {
        type: "integer",
        description: "ID of the tileset to edit",
      },
      flag_overrides: {
        type: "array",
        description: "List of tile flag changes to apply",
        items: {
          type: "object",
          properties: {
            tile_id: {
              type: "integer",
              description: "Tile ID to modify (0–8191)",
            },
            passable: {
              type: "boolean",
              description: "true = passable in all directions (clears direction bits), false = impassable (sets all 4 direction bits)",
            },
            terrain_tag: {
              type: "integer",
              description: "Terrain tag 0–7. Used by scripts to identify terrain type (water, damage floor, etc.)",
            },
          },
          required: ["tile_id"],
        },
      },
    },
    required: ["tileset_id", "flag_overrides"],
  },
};
