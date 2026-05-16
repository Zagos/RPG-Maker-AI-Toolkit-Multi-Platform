import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const DeleteMapTool: Tool = {
  name: "delete-map",
  description:
    "Delete a map from the project: removes MapXXX.json (after creating a backup) and nulls its entry in MapInfos.json. Requires confirm: true to prevent accidental deletion.",
  inputSchema: {
    type: "object",
    properties: {
      map_id: {
        type: "integer",
        description: "ID of the map to delete",
      },
      confirm: {
        type: "boolean",
        description: "Must be true to proceed with deletion",
      },
    },
    required: ["map_id", "confirm"],
  },
};
