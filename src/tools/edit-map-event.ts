import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const commandSchema = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["message", "choice", "wait", "transfer", "script", "switch", "variable", "common-event", "battle", "animation"],
    },
    data: { type: "string" },
  },
  required: ["type"],
};

export const EditMapEventTool: Tool = {
  name: "edit-map-event",
  description:
    "Edit an existing event on a map: rename it, move its position, replace all its pages, or append commands to page 0.",
  inputSchema: {
    type: "object",
    properties: {
      map_id: { type: "integer", description: "Map containing the event" },
      event_id: { type: "integer", description: "ID of the event to edit" },
      name: { type: "string", description: "New display name for the event" },
      x: { type: "integer", description: "New X tile coordinate" },
      y: { type: "integer", description: "New Y tile coordinate" },
      note: { type: "string", description: "New developer note" },
      append_commands: {
        type: "array",
        description: "Commands to append to the end of page 0's command list (before the terminator)",
        items: commandSchema,
      },
    },
    required: ["map_id", "event_id"],
  },
};

export const DeleteMapEventTool: Tool = {
  name: "delete-map-event",
  description: "Remove an event from a map (sets its slot to null in the events array).",
  inputSchema: {
    type: "object",
    properties: {
      map_id: { type: "integer", description: "Map containing the event" },
      event_id: { type: "integer", description: "ID of the event to delete" },
    },
    required: ["map_id", "event_id"],
  },
};
