import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ValidateProjectTool: Tool = {
  name: "validate-project",
  description: "Run all entity validators across the entire RPG Maker project and return a structured report of errors and warnings.",
  inputSchema: {
    type: "object",
    properties: {
      entity_types: {
        type: "array",
        description: "Entity types to validate (default: all). Options: Actor, Item, Weapon, Armor, Skill, Class, State, Enemy, Troop, CommonEvent",
        items: { type: "string", enum: ["Actor", "Item", "Weapon", "Armor", "Skill", "Class", "State", "Enemy", "Troop", "CommonEvent"] },
      },
      include_warnings: {
        type: "boolean",
        description: "Include warnings in the report (default: true)",
      },
    },
    required: [],
  },
};
