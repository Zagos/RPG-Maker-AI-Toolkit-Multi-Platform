import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CreateEnemyTool: Tool = {
  name: "create-enemy",
  description:
    "Create a new enemy in the RPG Maker MZ database. The name is required. " +
    "Stats default to [maxHp=100, maxMp=0, atk=10, def=10, mat=10, mdf=10, agi=10, luk=10]. " +
    "Three empty drop slots are created automatically; use edit-drop-items to configure them. " +
    "Returns the new enemy_id.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Enemy name (required)",
      },
      max_hp: {
        type: "integer",
        description: "Maximum HP (params[0], default 100)",
      },
      max_mp: {
        type: "integer",
        description: "Maximum MP (params[1], default 0)",
      },
      attack: {
        type: "integer",
        description: "ATK stat (params[2], default 10)",
      },
      defense: {
        type: "integer",
        description: "DEF stat (params[3], default 10)",
      },
      magic_attack: {
        type: "integer",
        description: "MAT stat (params[4], default 10)",
      },
      magic_defense: {
        type: "integer",
        description: "MDF stat (params[5], default 10)",
      },
      speed: {
        type: "integer",
        description: "AGI stat (params[6], default 10)",
      },
      luck: {
        type: "integer",
        description: "LUK stat (params[7], default 10)",
      },
      exp: {
        type: "integer",
        description: "Experience points awarded on defeat (default 0)",
      },
      gold: {
        type: "integer",
        description: "Gold dropped on defeat (default 0)",
      },
      battler_name: {
        type: "string",
        description: "Battler graphic filename from img/enemies/ (without extension)",
      },
      battler_hue: {
        type: "integer",
        description: "Hue rotation for the battler graphic 0–360 (default 0)",
      },
      note: {
        type: "string",
        description: "Note field for plugin tags (e.g. '<Custom>')",
      },
    },
    required: ["name"],
  },
};
