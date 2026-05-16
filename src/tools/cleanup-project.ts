import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CleanupProjectTool: Tool = {
  name: "cleanup-project",
  description: "Audit entity JSON files for null slots. Returns a report of how many null entries exist per entity type (read-only, does not modify files).",
  inputSchema: {
    type: "object",
    properties: {
      entity_types: {
        type: "array",
        description: "Entity types to audit (default: all)",
        items: { type: "string", enum: ["Actor", "Item", "Weapon", "Armor", "Skill", "Class", "State", "Enemy", "Troop", "CommonEvent", "Animation"] },
      },
    },
    required: [],
  },
};
