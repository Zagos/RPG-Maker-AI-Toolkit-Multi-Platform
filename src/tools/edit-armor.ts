import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditArmorTool: Tool = {
  name: "edit-armor",
  description: "Create or update an armor in the RPG Maker MZ project. Omit armor_id to create a new armor.",
  inputSchema: {
    type: "object",
    properties: {
      armor_id: {
        type: "integer",
        description: "ID of the armor to update. Omit to create a new armor.",
      },
      name: {
        type: "string",
        description: "Armor name",
      },
      description: {
        type: "string",
        description: "Armor description shown in menus",
      },
      atype_id: {
        type: "integer",
        description: "Armor type ID (1=General Armor, 2=Magic Armor, 3=Light Armor, 4=Heavy Armor, 5=Small Shield, 6=Large Shield)",
      },
      etype_id: {
        type: "integer",
        description: "Equipment slot type ID (1=weapon, 2=shield, 3=head, 4=body, 5=accessory)",
      },
      price: {
        type: "integer",
        description: "Purchase price in gold",
      },
      defense: {
        type: "integer",
        description: "Defense parameter bonus (parameters[3])",
      },
      magic_defense: {
        type: "integer",
        description: "Magic Defense parameter bonus (parameters[5])",
      },
      max_hp: {
        type: "integer",
        description: "Max HP parameter bonus (parameters[0])",
      },
      max_mp: {
        type: "integer",
        description: "Max MP parameter bonus (parameters[1])",
      },
      agility: {
        type: "integer",
        description: "Agility parameter bonus (parameters[6])",
      },
      luck: {
        type: "integer",
        description: "Luck parameter bonus (parameters[7])",
      },
      icon_index: {
        type: "integer",
        description: "Icon index in the icon sheet",
      },
    },
    required: ["name"],
  },
};
