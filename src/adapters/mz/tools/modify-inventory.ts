import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ModifyInventoryTool: Tool = {
  name: "modify-inventory",
  description: "Add or remove items, weapons, armors, or gold from the party inventory in the running game. Requires the debug plugin to be active.",
  inputSchema: {
    type: "object",
    properties: {
      operations: {
        type: "array",
        description: "List of inventory changes",
        items: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["add", "remove"], description: "add or remove" },
            type: { type: "string", enum: ["item", "weapon", "armor", "gold"], description: "Type of thing to add/remove" },
            id: { type: "integer", description: "Item/weapon/armor ID (not needed for gold)" },
            amount: { type: "integer", description: "Amount to add or remove" },
          },
          required: ["action", "type", "amount"],
        },
      },
    },
    required: ["operations"],
  },
};
