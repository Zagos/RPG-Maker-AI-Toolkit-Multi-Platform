import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GetSwitchTool: Tool = {
  name: "get-switch",
  description: "Read the current value of a game switch from the running game. Requires the debug plugin to be active.",
  inputSchema: { type: "object", properties: { id: { type: "integer", description: "Switch ID to read" } }, required: ["id"] },
};

export const GetVariableTool: Tool = {
  name: "get-variable",
  description: "Read the current value of a game variable from the running game. Requires the debug plugin to be active.",
  inputSchema: { type: "object", properties: { id: { type: "integer", description: "Variable ID to read" } }, required: ["id"] },
};
