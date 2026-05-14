import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const DeleteEntityTool: Tool = {
  name: "delete-entity",
  description:
    "Null out an entity in its database array — equivalent to deleting it in the RPG Maker editor. " +
    "A backup is created before writing. The slot index is preserved (not compacted), " +
    "so existing references from other entities or events remain valid until the project is reorganized. " +
    "Requires confirm: true to prevent accidental deletion.",
  inputSchema: {
    type: "object",
    properties: {
      entity_type: {
        type: "string",
        enum: ["Actor", "Item", "Enemy", "Weapon", "Armor", "Skill", "Class", "State", "Troop", "CommonEvent"],
        description: "Type of entity to delete",
      },
      entity_id: {
        type: "integer",
        description: "ID of the entity to null out",
      },
      confirm: {
        type: "boolean",
        description: "Must be true to proceed — safety guard against accidental deletion",
      },
    },
    required: ["entity_type", "entity_id", "confirm"],
  },
};
