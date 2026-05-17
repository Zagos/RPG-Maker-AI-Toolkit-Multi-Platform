import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const PluginManageTool: Tool = {
  name: "plugin-manage",
  description:
    "Plugin management (MZ/MV) and script management (VX Ace, VX, XP).\n\n" +
    "MZ/MV plugin actions:\n" +
    "  create — create and register a new plugin (data: name required, code required, description?, parameters?)\n" +
    "  create-advanced — create a plugin with full parameter metadata (data: name, code, pluginParams required)\n" +
    "  manage — list, enable, disable, or delete a registered plugin (data: action required, plugin_name?)\n" +
    "  edit-parameters — update plugin parameter values (data: plugin_name required, parameters required)\n" +
    "  reorder — change plugin load order (data: plugin_name required, new_index required)\n\n" +
    "Ruby engine script actions (VX Ace / VX / XP):\n" +
    "  list-scripts — list all scripts in Scripts file (data: {})\n" +
    "  read-script — read a script by name or index (data: name? or index?)\n" +
    "  create-script — create a new script section (data: name required, code required, insert_after?)\n" +
    "  edit-script — edit an existing script section (data: name or index required, code required)\n" +
    "  delete-script — delete a script section (data: name or index required, confirm: true required)",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "create", "create-advanced", "manage", "edit-parameters", "reorder",
          "list-scripts", "read-script", "create-script", "edit-script", "delete-script",
        ],
        description: "Plugin or script operation to perform",
      },
      data: {
        type: "object",
        description: "Operation-specific fields — passed directly to the internal handler",
        properties: {},
      },
    },
    required: ["action", "data"],
  },
};
