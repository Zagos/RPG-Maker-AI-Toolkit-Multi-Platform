import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditStateTool: Tool = {
  name: "edit-state",
  description: "Create or update a state (status effect) in the RPG Maker MZ project. Omit state_id to create a new state.",
  inputSchema: {
    type: "object",
    properties: {
      state_id: {
        type: "integer",
        description: "ID of the state to update. Omit to create a new state.",
      },
      name: {
        type: "string",
        description: "State name (e.g. 'Poison', 'Blind', 'Haste')",
      },
      icon_index: {
        type: "integer",
        description: "Icon index displayed next to the battler",
      },
      priority: {
        type: "integer",
        description: "Display priority (0-100). Higher values display first.",
      },
      remove_at_battle_end: {
        type: "boolean",
        description: "Whether the state is removed when battle ends",
      },
      remove_by_recover: {
        type: "boolean",
        description: "Whether the state is removed on HP/MP recovery",
      },
      remove_by_damage: {
        type: "boolean",
        description: "Whether the state can be removed when taking damage",
      },
      damage_rate: {
        type: "integer",
        description: "Chance (0-100) to remove state when taking damage (requires remove_by_damage: true)",
      },
      min_turns: {
        type: "integer",
        description: "Minimum number of turns the state lasts",
      },
      max_turns: {
        type: "integer",
        description: "Maximum number of turns the state lasts (0 = permanent until removed)",
      },
      restriction: {
        type: "integer",
        enum: [0, 1, 2, 3, 4],
        description: "Action restriction: 0=None, 1=Attack Ally, 2=Attack Any, 3=Attack Enemy, 4=Cannot Act",
      },
    },
    required: ["name"],
  },
};
