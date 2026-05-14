import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditTroopEventsTool: Tool = {
  name: "edit-troop-events",
  description:
    "Add, replace, or clear battle event pages in a troop. " +
    "Battle event pages define scripted actions during combat: boss phases, reinforcements, dialogue, etc. " +
    "Each page has trigger conditions (turn count, HP threshold, switch) and a command list.",
  inputSchema: {
    type: "object",
    properties: {
      troop_id: {
        type: "integer",
        description: "ID of the troop to edit",
      },
      mode: {
        type: "string",
        enum: ["replace_all", "append", "clear"],
        description: "replace_all=overwrite all pages, append=add pages to existing, clear=remove all pages",
      },
      pages: {
        type: "array",
        description: "Array of battle event pages (required unless mode is 'clear')",
        items: {
          type: "object",
          properties: {
            span: {
              type: "integer",
              description: "When commands execute: 0=once per battle, 1=once per turn, 2=each moment (default: 0)",
            },
            conditions: {
              type: "object",
              description: "Trigger conditions for this page",
              properties: {
                turnValid: { type: "boolean", description: "Enable turn condition" },
                turnA: { type: "integer", description: "Turn interval A (fires on turn A, A+B, A+2B...)" },
                turnB: { type: "integer", description: "Turn interval B" },
                turnEnding: { type: "boolean", description: "Trigger at turn end" },
                enemyValid: { type: "boolean", description: "Enable enemy HP condition" },
                enemyIndex: { type: "integer", description: "Enemy member index (0-based)" },
                enemyHp: { type: "integer", description: "Enemy HP% threshold (0-100)" },
                actorValid: { type: "boolean", description: "Enable actor HP condition" },
                actorId: { type: "integer", description: "Actor ID" },
                actorHp: { type: "integer", description: "Actor HP% threshold (0-100)" },
                switchValid: { type: "boolean", description: "Enable switch condition" },
                switchId: { type: "integer", description: "Switch ID that must be ON" },
              },
            },
            commands: {
              type: "array",
              description: "Event commands to execute. Same format as create-map-event: [{type, data}]",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["message", "choice", "wait", "transfer", "script", "switch", "variable", "common-event", "battle", "animation"],
                  },
                  data: { type: "string" },
                },
                required: ["type"],
              },
            },
          },
        },
      },
    },
    required: ["troop_id", "mode"],
  },
};
