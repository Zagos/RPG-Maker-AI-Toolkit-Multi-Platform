export const LoadGameTool = {
  name: "load-game",
  description: "Load a save file by slot number and wait for the map to be ready. Use save-game first to create a known state you can restore between tests.",
  inputSchema: {
    type: "object" as const,
    properties: {
      slot: {
        type: "number",
        description: "Save slot number to load (default: 98)",
      },
    },
  },
};
