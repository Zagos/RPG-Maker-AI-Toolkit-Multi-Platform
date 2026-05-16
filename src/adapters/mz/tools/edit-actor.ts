/**
 * Herramienta: Crear/Editar Actor
 */

export const EditActorTool = {
  name: "edit-actor",
  description:
    "Create or edit an actor (playable character) in your RPG Maker MZ project",
  inputSchema: {
    type: "object" as const,
    properties: {
      actor_id: {
        type: "number",
        description:
          "Actor ID to edit (omit to create new). If creating new, leave empty",
      },
      name: {
        type: "string",
        description: "Actor name",
      },
      nickname: {
        type: "string",
        description: "Actor nickname/title",
      },
      class_id: {
        type: "number",
        description:
          "Class ID (1=Swordsman, 2=Monk, 3=Priest, 4=Wizard, etc.)",
      },
      initial_level: {
        type: "number",
        description: "Starting level (default 1)",
      },
      max_level: {
        type: "number",
        description: "Maximum level (default 99)",
      },
      face: {
        type: "object",
        description: "Face image settings",
        properties: {
          name: {
            type: "string",
            description: "Face image filename (e.g., 'Face1')",
          },
          index: {
            type: "number",
            description: "Face image index (0-7)",
          },
        },
      },
      character: {
        type: "object",
        description: "Character sprite settings",
        properties: {
          name: {
            type: "string",
            description: "Character sprite filename (e.g., 'Actor1')",
          },
          index: {
            type: "number",
            description: "Character sprite index (0-3)",
          },
        },
      },
      battler_name: {
        type: "string",
        description: "SV battler filename (e.g., 'Actor1_1')",
      },
      equips: {
        type: "array",
        description: "Starting equipment IDs: [weapon, shield, head, body, accessory]",
        items: { type: "integer" },
      },
      profile: {
        type: "string",
        description: "Actor biography text",
      },
      note: {
        type: "string",
        description: "Note/tag metadata (e.g., '<tag>')",
      },
    },
    required: ["name"],
  },
};
