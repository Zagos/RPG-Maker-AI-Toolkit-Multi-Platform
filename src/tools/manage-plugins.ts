import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ManagePluginsTool: Tool = {
  name: "manage-plugins",
  description:
    "List, enable, disable, or delete plugins registered in plugins.js. Use 'list' to see all plugins and their status before enabling/disabling them.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["list", "enable", "disable", "delete"],
        description: "Action to perform",
      },
      plugin_name: {
        type: "string",
        description: "Plugin name without .js extension. Required for enable, disable, delete.",
      },
    },
    required: ["action"],
  },
};
