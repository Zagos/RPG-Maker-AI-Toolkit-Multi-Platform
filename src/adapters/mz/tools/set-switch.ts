export const SetSwitchTool = {
  name: "set-switch",
  description: "Turn a RPG Maker game switch ON or OFF in the running game. Switches control flags like doors, quest progress, and event conditions. Requires the game to be running with the RPGMakerDebugger plugin.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id:    { type: "number", description: "Switch ID (1-based)" },
      value: { type: "boolean", description: "true = ON, false = OFF" },
    },
    required: ["id", "value"],
  },
};
