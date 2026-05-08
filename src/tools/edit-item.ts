/**
 * Herramienta: Crear/Editar Item
 */

export const EditItemTool = {
  name: "edit-item",
  description: "Create or edit an item, weapon, or armor in your RPG Maker MZ project",
  inputSchema: {
    type: "object" as const,
    properties: {
      item_id: {
        type: "number",
        description:
          "Item ID to edit (omit to create new)",
      },
      name: {
        type: "string",
        description: "Item name",
      },
      description: {
        type: "string",
        description: "Item description",
      },
      type: {
        type: "string",
        enum: ["item", "weapon", "armor"],
        description: "Type of item to create/edit",
      },
      price: {
        type: "number",
        description: "Price in gold",
      },
      icon_index: {
        type: "number",
        description: "Icon index (0-383)",
      },
      consumable: {
        type: "boolean",
        description: "Is this item consumable? (for items only)",
      },
      effect: {
        type: "string",
        description: "Item effect: heal-hp, heal-mp, recover-all, damage-enemy, etc.",
      },
      effect_value: {
        type: "number",
        description: "Effect value (healing amount, damage, etc.)",
      },
    },
    required: ["name", "type"],
  },
};
