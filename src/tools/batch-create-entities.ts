import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const BatchCreateEntitiesTool: Tool = {
  name: "batch-create-entities",
  description: "Create multiple entities of the same type in a single operation. Returns an array of new IDs.",
  inputSchema: {
    type: "object",
    properties: {
      entity_type: {
        type: "string",
        description: "Type of entity to create. One of: Actor, Item, Weapon, Armor, Skill, Class, State, Enemy, Troop, CommonEvent, Animation, Tileset",
        enum: ["Actor", "Item", "Weapon", "Armor", "Skill", "Class", "State", "Enemy", "Troop", "CommonEvent", "Animation", "Tileset"],
      },
      entities: {
        type: "array",
        description: "Array of entity data objects. Each object should have at least a 'name' field plus any entity-specific fields.",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Entity name (required)" },
          },
          required: ["name"],
        },
        minItems: 1,
        maxItems: 50,
      },
    },
    required: ["entity_type", "entities"],
  },
};
