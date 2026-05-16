export const GetMapStateRuntimeTool = {
  name: "get-map-state-runtime",
  description: "Get the current map state from a running RPG Maker MZ game, including map ID, dimensions, player position, event count, weather, and parallax",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};
