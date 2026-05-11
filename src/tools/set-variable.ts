export const SetVariableTool = {
  name: "set-variable",
  description: "Set a RPG Maker game variable to a value in the running game. Variables store numeric data like counters, scores, item quantities, and story progress. Requires the game to be running with the RPGMakerDebugger plugin.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id:    { type: "number", description: "Variable ID (1-based)" },
      value: { description: "Value to assign (number or string)" },
    },
    required: ["id", "value"],
  },
};
