import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ReadEntityTool: Tool = {
  name: "read-entity",
  description:
    "Read all fields of a specific game database entity by type and ID. Returns the full JSON object stored in the RPG Maker data file.",
  inputSchema: {
    type: "object",
    properties: {
      entity_type: {
        type: "string",
        enum: ["Actor", "Item", "Enemy", "Weapon", "Armor", "Skill", "Class", "State", "Troop", "CommonEvent", "Animation", "Tileset"],
        description: "Type of entity to read. Supported: Actor, Item, Enemy, Weapon, Armor, Skill, Class, State, Troop, CommonEvent, Animation, Tileset",
      },
      entity_id: {
        type: "integer",
        description: "ID of the entity to read",
      },
    },
    required: ["entity_type", "entity_id"],
  },
};
