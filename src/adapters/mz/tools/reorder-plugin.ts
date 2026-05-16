import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ReorderPluginTool: Tool = {
  name: "reorder-plugin",
  description: "Change the load order of a plugin in js/plugins.js. Plugin load order is critical in RPG Maker MZ — compatibility layers must load before the plugins they extend.",
  inputSchema: {
    type: "object",
    properties: {
      plugin_name: { type: "string", description: "Name of the plugin to move (without .js extension)" },
      position: { type: "string", enum: ["first", "last", "before", "after"], description: "Where to move the plugin" },
      relative_plugin: { type: "string", description: "Plugin name to position relative to (required for 'before' and 'after')" },
    },
    required: ["plugin_name", "position"],
  },
};
