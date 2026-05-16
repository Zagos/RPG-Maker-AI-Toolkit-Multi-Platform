import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const FindAndReplaceTool: Tool = {
  name: "find-and-replace",
  description: "Search and replace text across RPG Maker project data: entity names, notes, and event command text.",
  inputSchema: {
    type: "object",
    properties: {
      find: { type: "string", description: "Text to find (case-sensitive)" },
      replace: { type: "string", description: "Replacement text" },
      targets: {
        type: "array",
        description: "Where to search: names, notes, event_commands (default: all three)",
        items: { type: "string", enum: ["names", "notes", "event_commands"] },
      },
      confirm: { type: "boolean", description: "Must be true to write changes" },
    },
    required: ["find", "replace", "confirm"],
  },
};
