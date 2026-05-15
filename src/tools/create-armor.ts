import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CreateArmorTool: Tool = {
  name: "create-armor",
  description:
    "Create a new armor in the RPG Maker MZ database. The name is required. " +
    "Stat bonuses are stored in an 8-element params array " +
    "[maxHp, maxMp, atk, def, mat, mdf, agi, luk]; use defense and magic_defense to set the relevant slots. " +
    "Returns the new armor_id.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Armor name (required)",
      },
      description: {
        type: "string",
        description: "Armor description displayed in menus",
      },
      atype_id: {
        type: "integer",
        description: "Armor type ID matching System armorTypes (default 1=shield)",
      },
      etype_id: {
        type: "integer",
        description:
          "Equipment slot type ID: 1=shield, 2=head, 3=body, 4=accessory (default 1=shield)",
      },
      price: {
        type: "integer",
        description: "Shop buy price in gold (default 0)",
      },
      icon_index: {
        type: "integer",
        description: "Icon index in the icon sheet (default 0)",
      },
      defense: {
        type: "integer",
        description: "DEF stat bonus (params[3], default 0)",
      },
      magic_defense: {
        type: "integer",
        description: "MDF stat bonus (params[5], default 0)",
      },
      note: {
        type: "string",
        description: "Note field for plugin tags (e.g. '<Custom>')",
      },
    },
    required: ["name"],
  },
};
