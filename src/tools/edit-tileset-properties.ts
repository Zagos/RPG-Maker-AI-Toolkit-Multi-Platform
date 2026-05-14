import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditTilesetPropertiesTool: Tool = {
  name: "edit-tileset-properties",
  description:
    "Edit a tileset's display name, mode, or graphic file references (tilesetNames). " +
    "Use this to change which PNG files from img/tilesets/ the tileset uses. " +
    "To edit tile passability/terrain tags use edit-tileset instead.",
  inputSchema: {
    type: "object",
    properties: {
      tileset_id: {
        type: "integer",
        description: "ID of the tileset to edit",
      },
      name: {
        type: "string",
        description: "New display name for the tileset",
      },
      mode: {
        type: "integer",
        description: "Tileset mode: 0=World, 1=Area/Dungeon",
      },
      tilesetNames: {
        type: "array",
        items: { type: "string" },
        description:
          "Full replacement array of 9 graphic file names (without extension) [A1, A2, A3, A4, A5, B, C, D, E]. " +
          "Must have exactly 9 entries.",
        minItems: 9,
        maxItems: 9,
      },
    },
    required: ["tileset_id"],
  },
};
