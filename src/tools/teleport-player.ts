export const TeleportPlayerTool = {
  name: "teleport-player",
  description: "Instantly move the player to a specific map and coordinates in the running game. Useful for testing specific areas, skipping travel, or reproducing bugs at exact locations. Requires the game to be running with the RPGMakerDebugger plugin.",
  inputSchema: {
    type: "object" as const,
    properties: {
      map_id:    { type: "number", description: "Target map ID" },
      x:         { type: "number", description: "Target X coordinate (tile)" },
      y:         { type: "number", description: "Target Y coordinate (tile)" },
      direction: { type: "number", description: "Facing direction: 2=down, 4=left, 6=right, 8=up (default: unchanged)", enum: [0, 2, 4, 6, 8] },
    },
    required: ["map_id", "x", "y"],
  },
};
