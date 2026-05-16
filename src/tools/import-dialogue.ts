import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ImportDialogueTool: Tool = {
  name: "import-dialogue",
  description: "Write modified dialogue text back into map and common event files. Use with export-dialogue for localization workflows. Line count per entry must match the original export exactly.",
  inputSchema: {
    type: "object",
    properties: {
      entries: {
        type: "array",
        description: "Array of dialogue entries to update. Each must have source_type, source_id, event_id, page, command_index, and lines[].",
        items: {
          type: "object",
          properties: {
            source_type: { type: "string", enum: ["map", "common_event"] },
            source_id: { type: "integer" },
            event_id: { type: "integer" },
            page: { type: "integer" },
            command_index: { type: "integer" },
            lines: { type: "array", items: { type: "string" } },
          },
          required: ["source_type", "source_id", "event_id", "page", "command_index", "lines"],
        },
      },
      confirm: { type: "boolean", description: "Must be true to write changes" },
    },
    required: ["entries", "confirm"],
  },
};
