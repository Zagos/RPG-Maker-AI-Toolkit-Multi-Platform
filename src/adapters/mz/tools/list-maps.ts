import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ListMapsTool: Tool = {
  name: "list-maps",
  description: "List all maps in the RPG Maker project from MapInfos.json, sorted by their display order.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};
