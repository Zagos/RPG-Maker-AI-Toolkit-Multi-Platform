import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ModifyActorRuntimeTool: Tool = {
  name: "modify-actor-runtime",
  description: "Modify an actor's stats (level, exp, HP, MP, TP) in the running game. Requires the debug plugin to be active.",
  inputSchema: {
    type: "object",
    properties: {
      actor_id: { type: "integer", description: "Actor ID to modify" },
      operations: {
        type: "array",
        description: "List of stat modifications",
        items: {
          type: "object",
          properties: {
            field: { type: "string", enum: ["level", "exp", "hp", "mp", "tp"], description: "Stat to modify" },
            mode: { type: "string", enum: ["set", "add"], description: "set: assign value directly. add: add to current value." },
            value: { type: "number", description: "Value to set or add" },
          },
          required: ["field", "mode", "value"],
        },
      },
    },
    required: ["actor_id", "operations"],
  },
};
