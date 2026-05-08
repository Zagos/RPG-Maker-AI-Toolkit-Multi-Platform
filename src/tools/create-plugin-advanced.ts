/**
 * Herramienta: Crear Plugin Avanzado
 */

export const CreatePluginAdvancedTool = {
  name: "create-plugin-advanced",
  description:
    "Generate a sophisticated RPG Maker MZ plugin with parameters, documentation, and predefined structure",
  inputSchema: {
    type: "object" as const,
    properties: {
      plugin_name: {
        type: "string",
        description:
          "Plugin name (no spaces, e.g., 'BetterSkills', 'CustomUI')",
      },
      description: {
        type: "string",
        description: "What does this plugin do?",
      },
      author: {
        type: "string",
        description: "Plugin author name",
      },
      version: {
        type: "string",
        description: "Plugin version (default '1.0.0')",
      },
      template_type: {
        type: "string",
        enum: [
          "with-parameters",
          "game-actor",
          "game-enemy",
          "event-handler",
          "custom-ui",
        ],
        description: "Type of plugin template to use",
      },
      parameters: {
        type: "array",
        description:
          "Plugin parameters (for 'with-parameters' template)",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Parameter name (camelCase)",
            },
            type: {
              type: "string",
              enum: ["string", "number", "boolean", "select", "combo"],
              description: "Parameter type",
            },
            default: {
              type: "string",
              description: "Default value",
            },
            description: {
              type: "string",
              description: "Parameter description",
            },
          },
          required: ["name", "type", "description"],
        },
      },
      include_license: {
        type: "boolean",
        description: "Include license header (default true)",
      },
      include_help: {
        type: "boolean",
        description: "Include detailed help section (default true)",
      },
    },
    required: ["plugin_name", "description", "template_type"],
  },
};
