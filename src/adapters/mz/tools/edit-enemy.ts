/**
 * Herramienta: Crear/Editar Enemigo
 */

export const EditEnemyTool = {
  name: "edit-enemy",
  description: "Create or edit an enemy in your RPG Maker MZ project",
  inputSchema: {
    type: "object" as const,
    properties: {
      enemy_id: {
        type: "number",
        description: "Enemy ID to edit (omit to create new)",
      },
      name: {
        type: "string",
        description: "Enemy name",
      },
      battler_name: {
        type: "string",
        description: "Battler image filename (e.g., 'Enemy1')",
      },
      exp: {
        type: "number",
        description: "Experience reward",
      },
      gold: {
        type: "number",
        description: "Gold reward",
      },
      max_hp: {
        type: "number",
        description: "Maximum HP",
      },
      max_mp: {
        type: "number",
        description: "Maximum MP",
      },
      attack: {
        type: "number",
        description: "Attack stat",
      },
      defense: {
        type: "number",
        description: "Defense stat",
      },
      magic_attack: {
        type: "number",
        description: "Magic Attack (M.Atk) stat",
      },
      magic_defense: {
        type: "number",
        description: "Magic Defense (M.Def) stat",
      },
      speed: {
        type: "number",
        description: "Speed stat",
      },
      luck: {
        type: "number",
        description: "Luck stat",
      },
      skills: {
        type: "array",
        description: "Skill IDs the enemy can use",
        items: {
          type: "number",
        },
      },
      drops: {
        type: "array",
        description: "Items the enemy can drop",
        items: {
          type: "object",
          properties: {
            item_id: {
              type: "number",
            },
            probability: {
              type: "number",
              description: "Drop probability (1/denominator, e.g., 1/4)",
            },
          },
        },
      },
      battler_hue: {
        type: "integer",
        description: "Battler image hue (0-360)",
      },
      note: {
        type: "string",
        description: "Note/tag metadata",
      },
    },
    required: ["name"],
  },
};
