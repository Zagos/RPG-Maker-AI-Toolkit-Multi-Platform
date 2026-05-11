export const RunBattleSuiteTool = {
  name: "run-battle-suite",
  description: "Run the same battle N times and return aggregated statistics: win rate, average HP remaining per actor, average damage dealt/taken, and average turns. Use set-party-state beforehand if you need a specific starting state, or pass party_state directly here to reset before every run.",
  inputSchema: {
    type: "object" as const,
    properties: {
      troop_id: {
        type: "number",
        description: "Troop ID from the database. Takes priority over enemy_id.",
      },
      enemy_id: {
        type: "number",
        description: "Enemy ID — creates a temporary troop on the fly.",
      },
      count: {
        type: "number",
        description: "Number of enemies when using enemy_id (default: 1).",
      },
      runs: {
        type: "number",
        description: "Number of battles to run (default: 5, max: 50).",
      },
      party_state: {
        type: "object",
        description: "Party state applied before every run. Defaults to full HP/MP restore if omitted.",
        properties: {
          hp_percent:    { type: "number" },
          mp_percent:    { type: "number" },
          add_states:    { type: "array", items: { type: "number" } },
          remove_states: { type: "array", items: { type: "number" } },
        },
      },
      actions: {
        type: "array",
        description: "Per-turn action plan (same format as start-encounter).",
        items: {
          type: "array",
          items: { type: "object" },
        },
      },
    },
  },
};
