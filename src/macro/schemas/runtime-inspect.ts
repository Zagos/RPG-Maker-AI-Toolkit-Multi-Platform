export const RuntimeInspectTool = {
  name: "runtime-inspect",
  description:
    "Read live state from the running RPG Maker game: game state, switches, variables, inventory, actor stats, party members, map state, battle state, or timer. Game must be running with the debug plugin active.",
  inputSchema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["game-state", "switch", "variable", "inventory", "actor", "party", "map", "battle", "timer"],
        description: "What to inspect: game-state (full snapshot), switch, variable, inventory, actor, party members, map, battle, or timer",
      },
      id: { type: "integer", description: "Switch or variable ID to read (for switch / variable)" },
      actor_id: { type: "number", description: "Actor ID to read (for actor)" },
      category: {
        type: "string",
        enum: ["items", "weapons", "armors", "all"],
        description: "Inventory category to read (for inventory, default: all)",
      },
    },
    required: ["type"],
  },
};
