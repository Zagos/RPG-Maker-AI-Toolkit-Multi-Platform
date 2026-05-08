/**
 * Herramienta: Agregar Diálogo
 */

export const AddDialogueTool = {
  name: "add-dialogue",
  description:
    "Add dialogue or narrative text to your RPG Maker MZ project (creates a common event)",
  inputSchema: {
    type: "object" as const,
    properties: {
      dialogue_lines: {
        type: "array",
        description: "Dialogue lines to add",
        items: {
          type: "object",
          properties: {
            speaker: {
              type: "string",
              description: "Character speaking (name or 'Narrator')",
            },
            text: {
              type: "string",
              description: "Dialogue text",
            },
          },
          required: ["text"],
        },
      },
      event_name: {
        type: "string",
        description: "Name for this dialogue event",
      },
      trigger_type: {
        type: "string",
        enum: ["manual", "auto", "parallel"],
        description: "How the dialogue is triggered",
      },
      variables: {
        type: "object",
        description: "Variable replacements (e.g., {actor_name}, {item_name})",
      },
    },
    required: ["dialogue_lines"],
  },
};
