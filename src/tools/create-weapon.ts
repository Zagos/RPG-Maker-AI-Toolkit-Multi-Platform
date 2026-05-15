import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CreateWeaponTool: Tool = {
  name: "create-weapon",
  description:
    "Create a new weapon in the RPG Maker MZ database. The name is required. " +
    "Stat bonuses are stored in an 8-element params array " +
    "[maxHp, maxMp, atk, def, mat, mdf, agi, luk]; use attack and magic_attack to set the relevant slots. " +
    "Returns the new weapon_id.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Weapon name (required)",
      },
      description: {
        type: "string",
        description: "Weapon description displayed in menus",
      },
      wtype_id: {
        type: "integer",
        description: "Weapon type ID matching System weaponTypes (default 1=sword)",
      },
      price: {
        type: "integer",
        description: "Shop buy price in gold (default 0)",
      },
      icon_index: {
        type: "integer",
        description: "Icon index in the icon sheet (default 0)",
      },
      animation_id: {
        type: "integer",
        description: "Attack animation ID played when this weapon is used (default 0)",
      },
      attack: {
        type: "integer",
        description: "ATK stat bonus (params[2], default 0)",
      },
      magic_attack: {
        type: "integer",
        description: "MAT stat bonus (params[4], default 0)",
      },
      note: {
        type: "string",
        description: "Note field for plugin tags (e.g. '<Custom>')",
      },
    },
    required: ["name"],
  },
};
