import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const memberSchema = {
  type: "object",
  properties: {
    enemy_id: { type: "integer", description: "ID of the enemy in this slot" },
    x: { type: "integer", description: "X position on the battle screen (0-816). Defaults to auto-spread." },
    y: { type: "integer", description: "Y position on the battle screen (0-624). Defaults to auto-spread." },
    hidden: { type: "boolean", description: "Start hidden (default: false)" },
  },
  required: ["enemy_id"],
};

export const CreateTroopTool: Tool = {
  name: "create-troop",
  description:
    "Create a new enemy formation (troop) in Troops.json. Troops define which enemies appear together in a battle and where they stand on the battle screen.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the troop (shown in the editor, e.g. 'Forest Ambush')",
      },
      members: {
        type: "array",
        description: "Enemy members in this formation (1–8). If x/y are omitted they are auto-spaced.",
        items: memberSchema,
      },
    },
    required: ["name", "members"],
  },
};

export const EditTroopTool: Tool = {
  name: "edit-troop",
  description:
    "Edit an existing troop (enemy formation): rename it or replace its member list.",
  inputSchema: {
    type: "object",
    properties: {
      troop_id: {
        type: "integer",
        description: "ID of the troop to edit",
      },
      name: {
        type: "string",
        description: "New name for the troop",
      },
      members: {
        type: "array",
        description: "Replace the full member list. Omit to keep existing members.",
        items: memberSchema,
      },
    },
    required: ["troop_id"],
  },
};
