export const SaveGameTool = {
  name: "save-game",
  description: "Save the current game state to a save slot in the running game. Use slot 98 or 99 for test snapshots so you can reproduce exact game states for debugging. Requires the game to be running with the RPGMakerDebugger plugin.",
  inputSchema: {
    type: "object" as const,
    properties: {
      slot: { type: "number", description: "Save slot number (default: 98). Slots 1-20 are standard; 98-99 are recommended for MCP test snapshots." },
    },
  },
};
