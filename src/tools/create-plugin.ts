/**
 * Herramienta: Crear Plugin
 */

export const CreatePluginTool = {
  name: "create-plugin",
  description:
    "Generate a new JavaScript plugin for RPG Maker MZ",
  inputSchema: {
    type: "object" as const,
    properties: {
      plugin_name: {
        type: "string",
        description:
          "Plugin name (no spaces, e.g., 'CustomSkills', 'BetterMenuUI')",
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
      parameters: {
        type: "array",
        description: "Plugin parameters (optional)",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Parameter name",
            },
            type: {
              type: "string",
              enum: ["string", "number", "boolean", "select"],
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
        },
      },
      code_type: {
        type: "string",
        enum: ["empty", "simple-hook", "command", "skill-modifier"],
        description:
          "Type of plugin template (empty, simple hook, command handler, or skill modifier)",
      },
    },
    required: ["plugin_name", "description"],
  },
};
