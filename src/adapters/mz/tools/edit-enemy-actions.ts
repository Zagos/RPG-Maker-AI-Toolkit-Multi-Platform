import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditEnemyActionsTool: Tool = {
  name: "edit-enemy-actions",
  description:
    "Edit the action pattern (AI table) of an enemy. Each action defines which skill to use, " +
    "how frequently (rating 1-9), and under what condition. " +
    "mode=replace overwrites all actions; mode=append adds to existing; mode=clear empties the list.",
  inputSchema: {
    type: "object",
    properties: {
      enemy_id: {
        type: "integer",
        description: "ID of the enemy to edit",
      },
      mode: {
        type: "string",
        enum: ["replace", "append", "clear"],
        description: "replace=overwrite all actions, append=add to existing, clear=remove all actions",
      },
      actions: {
        type: "array",
        description: "Array of enemy actions. Required unless mode is 'clear'.",
        items: {
          type: "object",
          properties: {
            skill_id: {
              type: "integer",
              description: "ID of the skill to use (1=Attack, 2=Guard, or any skill ID)",
            },
            rating: {
              type: "integer",
              description: "Priority weight 1-9 (higher = more frequent when multiple conditions are met)",
            },
            condition_type: {
              type: "integer",
              description:
                "0=always, 1=turn X/Y (fires on turn A, A+B, A+2B...), " +
                "2=HP ≤ %, 3=MP ≤ %, 4=state applied, 5=party level ≥, 6=switch ON",
            },
            condition_param1: {
              type: "integer",
              description: "First condition parameter (turn A, HP%, MP%, state ID, level, switch ID)",
            },
            condition_param2: {
              type: "integer",
              description: "Second condition parameter (turn B for type=1; otherwise unused)",
            },
          },
          required: ["skill_id", "rating", "condition_type", "condition_param1", "condition_param2"],
        },
      },
    },
    required: ["enemy_id", "mode"],
  },
};
