import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ReadTilesetTool: Tool = {
  name: "read-tileset",
  description:
    "Read tileset data. When tileset_id is provided, returns full details for that tileset including name, mode, " +
    "graphic file references (tilesetNames array: [A1,A2,A3,A4,A5,B,C,D,E]), and a flag summary. " +
    "When tileset_id is omitted, lists all tilesets. Set include_flags=true to get the full 8192-entry flags array.",
  inputSchema: {
    type: "object",
    properties: {
      tileset_id: {
        type: "integer",
        description: "Tileset ID to read. Omit to list all tilesets.",
      },
      include_flags: {
        type: "boolean",
        description: "Include the full flags array (8192 entries). Default: false — only a summary is returned.",
      },
    },
  },
};
