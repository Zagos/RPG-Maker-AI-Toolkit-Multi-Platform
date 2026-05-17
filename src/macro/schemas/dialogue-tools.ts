import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const DialogueToolsTool: Tool = {
  name: "dialogue-tools",
  description:
    "All dialogue and story authoring operations.\n\n" +
    "Actions:\n" +
    "  add — add dialogue lines as a common event (data: dialogue_lines array required, event_name?, trigger_type?)\n" +
    "  create-advanced — create a dialogue event with full event command control (data: event_name required, commands array)\n" +
    "  generate-story — generate a structured story with multiple scenes (data: story_title, story_description, scenes required)\n" +
    "  export — export all dialogue from maps and common events (data: include_maps?, include_common_events?, map_ids?)\n" +
    "  import — import dialogue entries back into the project (data: entries array required, confirm: true required)",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["add", "create-advanced", "generate-story", "export", "import"],
        description: "Dialogue operation to perform",
      },
      data: {
        type: "object",
        description: "Operation-specific fields — passed directly to the internal handler",
        properties: {},
      },
    },
    required: ["action", "data"],
  },
};
