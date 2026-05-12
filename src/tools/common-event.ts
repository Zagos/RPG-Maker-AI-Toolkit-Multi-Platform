import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const commandSchema = {
  type: "object",
  description: "Event command (same format as create-map-event)",
  properties: {
    type: {
      type: "string",
      enum: ["message", "choice", "wait", "transfer", "script", "switch", "variable", "common-event", "battle", "animation"],
      description: "Command type",
    },
    data: { type: "string", description: "Command payload (text, script code, etc.)" },
  },
  required: ["type"],
};

export const CreateCommonEventTool: Tool = {
  name: "create-common-event",
  description:
    "Create a new common event in CommonEvents.json. Common events are reusable scripts that can be called from any map event, used for shops, cutscenes, shared game logic, and parallel processes.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the common event (shown in the editor)",
      },
      trigger: {
        type: "integer",
        description: "Activation trigger: 0=None (call-only), 1=Autorun (runs when switch is ON), 2=Parallel (loops while switch is ON). Default: 0.",
      },
      switch_id: {
        type: "integer",
        description: "Switch ID that controls autorun/parallel triggers. Required when trigger is 1 or 2.",
      },
      commands: {
        type: "array",
        description: "List of event commands to execute",
        items: commandSchema,
      },
    },
    required: ["name"],
  },
};

export const EditCommonEventTool: Tool = {
  name: "edit-common-event",
  description:
    "Edit an existing common event: rename it, change its trigger type, update its switch, or replace its command list.",
  inputSchema: {
    type: "object",
    properties: {
      event_id: {
        type: "integer",
        description: "ID of the common event to edit",
      },
      name: {
        type: "string",
        description: "New name for the event",
      },
      trigger: {
        type: "integer",
        description: "New trigger type: 0=None, 1=Autorun, 2=Parallel",
      },
      switch_id: {
        type: "integer",
        description: "New controlling switch ID",
      },
      commands: {
        type: "array",
        description: "Replace the full command list",
        items: commandSchema,
      },
    },
    required: ["event_id"],
  },
};
