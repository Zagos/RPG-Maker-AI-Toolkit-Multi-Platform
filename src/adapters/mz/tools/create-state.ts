import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CreateStateTool: Tool = {
  name: "create-state",
  description:
    "Create a new state (status effect) in the RPG Maker MZ database. The name is required. " +
    "A state can represent conditions like Poison, Sleep, Blind, etc. " +
    "Returns the new state_id.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "State name (required, e.g. 'Poison', 'Sleep')",
      },
      icon_index: {
        type: "integer",
        description: "Icon index shown next to the actor while the state is active (default 0)",
      },
      priority: {
        type: "integer",
        description:
          "Display priority 0–100; higher values appear first in status lists (default 50)",
      },
      restriction: {
        type: "integer",
        description:
          "Action restriction: 0=none, 1=can't use magic, 2=attack enemies, " +
          "3=attack anyone, 4=can't move (default 0)",
      },
      overlay: {
        type: "integer",
        description: "Overlay graphic index for the battler sprite (0=none, default 0)",
      },
      motion: {
        type: "integer",
        description: "Battler motion override (0=none, default 0)",
      },
      min_turns: {
        type: "integer",
        description: "Minimum turns the state persists (default 1)",
      },
      max_turns: {
        type: "integer",
        description: "Maximum turns the state persists (default 1)",
      },
      remove_at_battle_end: {
        type: "boolean",
        description: "Remove the state when battle ends (default false)",
      },
      remove_by_restriction: {
        type: "boolean",
        description: "Remove the state when the restriction condition is met (default false)",
      },
      auto_removal_timing: {
        type: "integer",
        description:
          "When auto-removal triggers: 0=none, 1=action end, 2=turn end (default 0)",
      },
      remove_by_damage: {
        type: "boolean",
        description: "Remove the state when the actor takes damage (default false)",
      },
      chance_by_damage: {
        type: "integer",
        description: "Chance 0–100 of removing state on damage hit (default 100)",
      },
      remove_by_walking: {
        type: "boolean",
        description: "Remove the state after walking a number of steps (default false)",
      },
      steps_to_remove: {
        type: "integer",
        description: "Number of steps before the state is removed by walking (default 100)",
      },
      note: {
        type: "string",
        description: "Note field for plugin tags (e.g. '<Custom>')",
      },
    },
    required: ["name"],
  },
};
