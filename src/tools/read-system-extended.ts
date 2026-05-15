import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ReadSystemExtendedTool: Tool = {
  name: "read-system-extended",
  description: "Read extended sections of System.json that are not exposed by edit-system: terms, vehicles, sounds, window settings.",
  inputSchema: {
    type: "object",
    properties: {
      section: { type: "string", enum: ["terms", "vehicles", "sounds", "basic", "all"], description: "Which section to return (default: all)" },
    },
  },
};
