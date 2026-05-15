export const GetActorRuntimeTool = {
  name: "get-actor-runtime",
  description: "Get a live actor's runtime state from a running RPG Maker MZ game, including current HP, MP, TP, level, EXP, states, and buffs",
  inputSchema: {
    type: "object" as const,
    properties: {
      actor_id: {
        type: "number",
        description: "The actor ID to query (e.g. 1 for the first actor)",
      },
    },
    required: ["actor_id"],
  },
};
