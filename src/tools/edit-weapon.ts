import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditWeaponTool: Tool = {
  name: "edit-weapon",
  description: "Create or update a weapon in the RPG Maker MZ project. Omit weapon_id to create a new weapon.",
  inputSchema: {
    type: "object",
    properties: {
      weapon_id: {
        type: "integer",
        description: "ID of the weapon to update. Omit to create a new weapon.",
      },
      name: {
        type: "string",
        description: "Weapon name",
      },
      description: {
        type: "string",
        description: "Weapon description shown in menus",
      },
      wtype_id: {
        type: "integer",
        description: "Weapon type ID (1=Sword, 2=Axe, etc. — depends on System.json weaponTypes)",
      },
      price: {
        type: "integer",
        description: "Purchase price in gold",
      },
      attack: {
        type: "integer",
        description: "Attack parameter bonus (parameters[2])",
      },
      defense: {
        type: "integer",
        description: "Defense parameter bonus (parameters[3])",
      },
      magic_attack: {
        type: "integer",
        description: "Magic Attack parameter bonus (parameters[4])",
      },
      magic_defense: {
        type: "integer",
        description: "Magic Defense parameter bonus (parameters[5])",
      },
      agility: {
        type: "integer",
        description: "Agility parameter bonus (parameters[6])",
      },
      luck: {
        type: "integer",
        description: "Luck parameter bonus (parameters[7])",
      },
      animation_id: {
        type: "integer",
        description: "Attack animation ID",
      },
      icon_index: {
        type: "integer",
        description: "Icon index in the icon sheet",
      },
    },
    required: ["name"],
  },
};
