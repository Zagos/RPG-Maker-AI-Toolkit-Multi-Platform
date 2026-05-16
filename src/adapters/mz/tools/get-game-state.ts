export const GetGameStateTool = {
  name: "get-game-state",
  description: "Get the current runtime state of the running game: player position, map, party HP/levels, gold, and battle status. Requires the game to be running with the RPGMakerDebugger plugin.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};
