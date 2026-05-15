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
      scope: {
        type: "integer",
        description: "Target scope: 0=None,1=One Enemy,2=All Enemies,7=One Ally,8=All Allies,11=The User",
      },
      occasion: {
        type: "integer",
        description: "When usable: 0=Always,1=Battle,2=Menu,3=Never",
      },
      speed: {
        type: "integer",
        description: "Speed modifier for turn order",
      },
      success_rate: {
        type: "integer",
        description: "Base success rate (0-100)",
      },
      repeats: {
        type: "integer",
        description: "Number of times the effect is applied",
      },
      tp_gain: {
        type: "integer",
        description: "TP gained when used",
      },
      hit_type: {
        type: "integer",
        description: "Hit type: 0=Certain Hit,1=Physical,2=Magical",
      },
      animation_id: {
        type: "integer",
        description: "Animation ID to play",
      },
      note: {
        type: "string",
        description: "Note/tag metadata",
      },
    },
    required: ["name", "type"],
  },
};
