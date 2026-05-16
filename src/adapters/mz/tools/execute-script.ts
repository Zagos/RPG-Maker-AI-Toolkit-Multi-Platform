import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ExecuteScriptTool: Tool = {
  name: "execute-script",
  description:
    "Execute arbitrary JavaScript in the running game via the debug bridge. Requires the game to be running with RPGMakerDebugger plugin enabled. The script runs in the game's global scope (access $gameParty, $gameSwitches, etc.). WARNING: invalid JS can crash the game.",
  inputSchema: {
    type: "object",
    properties: {
      code: {
        type: "string",
        description: "JavaScript code to evaluate in the game (e.g. '$gameParty.gainGold(500)')",
      },
      timeout: {
        type: "integer",
        description: "Milliseconds to wait for the game to confirm execution (default: 5000)",
      },
    },
    required: ["code"],
  },
};
