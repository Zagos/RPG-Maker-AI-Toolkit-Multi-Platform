import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GetInventoryTool: Tool = {
  name: "get-inventory",
  description: "Read the current party inventory from the running game. Requires the game to be running with the debug plugin active.",
  inputSchema: {
    type: "object",
    properties: {
      category: { type: "string", enum: ["items", "weapons", "armors", "all"], description: "Which inventory category to read (default: all)" },
    },
  },
};
