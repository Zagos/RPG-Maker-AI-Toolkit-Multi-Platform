import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GameSetupTool: Tool = {
  name: "game-setup",
  description:
    "Server health check and game launch utilities.\n\n" +
    "Actions:\n" +
    "  health-check — verify the MCP server is running and the project is accessible (data: {})\n" +
    "  setup-debug — install the debug bridge plugin into the project for runtime control (data: {})\n" +
    "  launch — launch the game executable (data: game_path? overrides RPGMAKER_EXECUTABLE_PATH)",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["health-check", "setup-debug", "launch"],
        description: "Setup operation to perform",
      },
      data: {
        type: "object",
        description: "Operation-specific fields",
        properties: {
          game_path: {
            type: "string",
            description: "Path to game executable (launch action only)",
          },
        },
      },
    },
    required: ["action"],
  },
};
