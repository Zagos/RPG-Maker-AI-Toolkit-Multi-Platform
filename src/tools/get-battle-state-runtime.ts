import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GetBattleStateRuntimeTool: Tool = {
  name: "get-battle-state-runtime",
  description: "Read current battle state including enemy HP, turns, and party status. Game must be running with the RPGMakerDebugger plugin and in a battle.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};
