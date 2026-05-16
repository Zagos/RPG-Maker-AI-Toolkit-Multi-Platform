import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditPluginParametersTool: Tool = {
  name: "edit-plugin-parameters",
  description:
    "Update the parameters object of a registered plugin in plugins.js. " +
    "RPG Maker MZ stores all plugin parameter values as strings, even numeric ones. " +
    "Partial updates are supported — only the keys you provide are changed; others are preserved.",
  inputSchema: {
    type: "object",
    properties: {
      plugin_name: {
        type: "string",
        description: "Exact plugin name as registered in plugins.js (without .js extension)",
      },
      parameters: {
        type: "object",
        description:
          "Key-value pairs to update in the plugin's parameters object. " +
          "All values must be strings (RPG Maker stores parameters as strings). " +
          "Only provided keys are updated; existing keys not listed here are preserved.",
        additionalProperties: { type: "string" },
      },
    },
    required: ["plugin_name", "parameters"],
  },
};
