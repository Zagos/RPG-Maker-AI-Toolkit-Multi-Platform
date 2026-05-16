import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ExportDialogueTool: Tool = {
  name: "export-dialogue",
  description: "Extract all dialogue text from map events and common events into a single structured JSON. Use for localization and translation workflows.",
  inputSchema: {
    type: "object",
    properties: {
      include_maps: { type: "boolean", description: "Include map event dialogue (default: true)" },
      include_common_events: { type: "boolean", description: "Include common event dialogue (default: true)" },
      map_ids: {
        type: "array",
        description: "Optional: only extract from these map IDs. Default: all maps.",
        items: { type: "integer" },
      },
    },
    required: [],
  },
};
