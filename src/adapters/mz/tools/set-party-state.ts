export const SetPartyStateTool = {
  name: "set-party-state",
  description: "Set HP, MP, and status effects for party members in the running game. Use before start-encounter to test specific scenarios (near-death, poisoned, low MP, etc.).",
  inputSchema: {
    type: "object" as const,
    properties: {
      actor_id: {
        type: "number",
        description: "Actor ID to modify. Omit to apply to all party members.",
      },
      hp_percent: {
        type: "number",
        description: "HP as a fraction of max HP (0.0–1.0). Minimum applied is 1 HP to keep actor alive.",
      },
      mp_percent: {
        type: "number",
        description: "MP as a fraction of max MP (0.0–1.0).",
      },
      add_states: {
        type: "array",
        items: { type: "number" },
        description: "List of state IDs to add (e.g. [4] for Poison).",
      },
      remove_states: {
        type: "array",
        items: { type: "number" },
        description: "List of state IDs to remove.",
      },
    },
  },
};
