/**
 * Herramienta: Crear Sistema de Diálogos Ramificados
 */

export const CreateDialogueTool = {
  name: "create-dialogue-advanced",
  description:
    "Create complex, branching dialogue systems with variables, conditions, and choices",
  inputSchema: {
    type: "object" as const,
    properties: {
      dialogue_name: {
        type: "string",
        description: "Name of the dialogue chain/story",
      },
      dialogue_nodes: {
        type: "array",
        description: "Dialogue nodes/branches",
        items: {
          type: "object",
          properties: {
            node_id: {
              type: "string",
              description: "Unique ID for this dialogue node",
            },
            speaker: {
              type: "string",
              description: "Character speaking (or 'Narrator')",
            },
            text: {
              type: "string",
              description: "Dialogue text (supports {variables})",
            },
            choices: {
              type: "array",
              description: "Dialogue choices the player can make",
              items: {
                type: "object",
                properties: {
                  text: {
                    type: "string",
                    description: "Choice text",
                  },
                  next_node: {
                    type: "string",
                    description: "Next dialogue node ID",
                  },
                  condition: {
                    type: "string",
                    description:
                      "Condition to show choice (e.g., 'hasItem:5', 'actorLevel>=10')",
                  },
                  action: {
                    type: "string",
                    description:
                      "Action to perform when selected (e.g., 'addItem:1:3', 'setSwitch:5:true')",
                  },
                },
                required: ["text", "next_node"],
              },
            },
            actions: {
              type: "array",
              description: "Actions to perform after dialogue",
              items: {
                type: "string",
                description:
                  "Action string (e.g., 'addItem:5:1', 'setSwitch:1:true', 'playBGM:Town')",
              },
            },
            end_dialogue: {
              type: "boolean",
              description: "Does this end the dialogue chain?",
            },
          },
          required: ["node_id", "speaker", "text"],
        },
      },
      script_name: {
        type: "string",
        description: "Filename for the dialogue script (default auto-generated)",
      },
      include_journal: {
        type: "boolean",
        description: "Include dialogue in journal/log? (default true)",
      },
    },
    required: ["dialogue_name", "dialogue_nodes"],
  },
};
