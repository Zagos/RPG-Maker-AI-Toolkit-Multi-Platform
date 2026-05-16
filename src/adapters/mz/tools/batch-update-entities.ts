import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const BatchUpdateEntitiesTool: Tool = {
  name: "batch-update-entities",
  description: "Update the same field(s) on multiple entities of the same type in one operation. Useful for bulk balancing (e.g. set HP on 10 enemies at once).",
  inputSchema: {
    type: "object",
    properties: {
      entity_type: {
        type: "string",
        enum: ["Actor", "Item", "Weapon", "Armor", "Skill", "Class", "State", "Enemy", "Troop", "CommonEvent", "Animation", "Tileset"],
        description: "Type of entity to update",
      },
      entity_ids: {
        type: "array",
        description: "IDs of entities to update (max 100)",
        items: { type: "integer" },
        minItems: 1,
        maxItems: 100,
      },
      updates: {
        type: "object",
        description: "Fields to update on the entity. Mirror the corresponding edit-* tool inputs. Examples: name, note, hp, mp, exp, gold (for enemies); price, itype_id (for items).",
      },
      confirm: {
        type: "boolean",
        description: "Must be true to write changes",
      },
    },
    required: ["entity_type", "entity_ids", "updates", "confirm"],
  },
};
