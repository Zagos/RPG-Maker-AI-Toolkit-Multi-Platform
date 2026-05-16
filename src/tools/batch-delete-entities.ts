import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const BatchDeleteEntitiesTool: Tool = {
  name: "batch-delete-entities",
  description: "Delete multiple entities of the same type in a single operation by setting them to null. Requires confirm:true.",
  inputSchema: {
    type: "object",
    properties: {
      entity_type: {
        type: "string",
        description: "Type of entity to delete. One of: Actor, Item, Enemy, Weapon, Armor, Skill, Class, State, Troop, CommonEvent, Animation, Tileset",
        enum: ["Actor", "Item", "Enemy", "Weapon", "Armor", "Skill", "Class", "State", "Troop", "CommonEvent", "Animation", "Tileset"],
      },
      entity_ids: {
        type: "array",
        description: "Array of entity IDs to delete",
        items: { type: "integer" },
        minItems: 1,
        maxItems: 100,
      },
      confirm: {
        type: "boolean",
        description: "Must be true to proceed with deletion",
      },
    },
    required: ["entity_type", "entity_ids", "confirm"],
  },
};
