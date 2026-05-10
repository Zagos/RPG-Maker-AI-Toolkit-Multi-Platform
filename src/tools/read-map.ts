import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ReadMapTool: Tool = {
  name: "read-map",
  description: "Read map information from the RPG Maker MZ project: dimensions, events, encounters, tileset, display name.",
  inputSchema: {
    type: "object",
    properties: {
      map_id: {
        type: "integer",
        description: "Map ID to read (e.g. 1 reads Map001.json)",
      },
      include_events: {
        type: "boolean",
        description: "Include the full list of events on the map (default: true)",
      },
      include_encounters: {
        type: "boolean",
        description: "Include the encounter list (default: true)",
      },
    },
    required: ["map_id"],
  },
};
