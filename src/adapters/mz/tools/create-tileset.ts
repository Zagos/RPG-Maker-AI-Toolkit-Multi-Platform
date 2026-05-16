import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CreateTilesetTool: Tool = {
  name: "create-tileset",
  description:
    "Create a new tileset entry in the project. A tileset defines which graphic files (from img/tilesets/) " +
    "are used for each tile slot. The tilesetNames array must have exactly 9 entries corresponding to " +
    "slots A1, A2, A3, A4, A5, B, C, D, E — use empty string for unused slots. " +
    "All 8192 tile flags default to passable (0); use edit-tileset to change passability after creation.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the new tileset (shown in the editor)",
      },
      mode: {
        type: "integer",
        description: "Tileset mode: 1=Area/Dungeon (default), 0=World map",
      },
      tilesetNames: {
        type: "array",
        items: { type: "string" },
        description:
          "Exactly 9 graphic file names (without extension) from img/tilesets/: [A1, A2, A3, A4, A5, B, C, D, E]. " +
          "Use empty string for unused slots. Omit to create a blank tileset.",
        minItems: 9,
        maxItems: 9,
      },
    },
    required: ["name"],
  },
};
