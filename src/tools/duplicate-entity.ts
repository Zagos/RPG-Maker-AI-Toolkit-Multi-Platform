export const DuplicateEntityTool = {
  name: "duplicate-entity",
  description: "Duplicate an existing RPG Maker MZ entity (actor, item, skill, etc.) with a new name and auto-assigned ID",
  inputSchema: {
    type: "object" as const,
    properties: {
      entity_type: {
        type: "string",
        enum: ["Actor", "Item", "Skill", "Weapon", "Armor", "Class", "State", "Enemy", "Troop", "CommonEvent", "Animation", "Tileset"],
        description: "The type of entity to duplicate",
      },
      entity_id: {
        type: "number",
        description: "ID of the entity to duplicate",
      },
      new_name: {
        type: "string",
        description: "Name for the new duplicated entity",
      },
    },
    required: ["entity_type", "entity_id", "new_name"],
  },
};
