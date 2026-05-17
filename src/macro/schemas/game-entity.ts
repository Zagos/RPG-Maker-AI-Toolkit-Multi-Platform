export const GameEntityTool = {
  name: "game-entity",
  description:
    "Create, edit, delete, or duplicate any RPG Maker game database entity (actors, items, skills, enemies, etc.). " +
    "Also handles system settings, vehicle settings, and sub-entity data (traits, effects, class learnings, enemy actions, drop tables). " +
    "Pass all entity fields inside `data` — they are forwarded directly to the internal handler.",
  inputSchema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        enum: ["create", "edit", "delete", "duplicate", "generate"],
        description:
          "create: make a new entity. " +
          "edit: modify an existing entity (use id to target it). " +
          "delete: remove an entity (requires id; sets slot to null). " +
          "duplicate: clone an entity with a new name (requires id, data.new_name). " +
          "generate: generate a full character from a concept (type=character only).",
      },
      type: {
        type: "string",
        enum: [
          // standard create/edit/delete/duplicate entity types
          "actor", "item", "weapon", "armor", "skill", "class", "state", "enemy",
          "troop", "common-event", "animation", "tileset",
          // edit-only special types
          "system", "vehicle", "traits", "effects", "class-learnings", "enemy-actions", "drop-items",
          // generate
          "character",
        ],
        description: "Entity type to operate on",
      },
      id: {
        type: "integer",
        description: "Entity ID (required for edit, delete, duplicate)",
      },
      data: {
        type: "object",
        description:
          "Entity fields passed directly to the internal handler. " +
          "For create/edit use the same fields as the individual tool (e.g. name, class_id, traits for actor). " +
          "For duplicate include new_name. " +
          "For special edit types (traits, effects, etc.) include all fields that type normally expects. " +
          "For generate include name, archetype, and optional character fields.",
        additionalProperties: true,
      },
    },
    required: ["action", "type"],
  },
};
