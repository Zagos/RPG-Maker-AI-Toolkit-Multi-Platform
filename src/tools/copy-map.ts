import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CopyMapTool: Tool = {
  name: "copy-map",
  description: "Duplicate an existing map (tiles + events) as a new map with a new name and next available ID.",
  inputSchema: {
    type: "object",
    properties: {
      source_map_id: { type: "integer", description: "ID of the map to copy" },
      new_name: { type: "string", description: "Name for the new map" },
      parent_id: { type: "integer", description: "Parent map ID in the tree (default 0 = root)" },
    },
    required: ["source_map_id", "new_name"],
  },
};
