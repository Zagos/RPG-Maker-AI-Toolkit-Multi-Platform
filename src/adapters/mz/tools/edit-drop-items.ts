import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditDropItemsTool: Tool = {
  name: "edit-drop-items",
  description: "Edit the drop table of an enemy. RPG Maker MZ supports up to 3 drop slots. kind: 0=none, 1=item, 2=weapon, 3=armor. denominator=N means 1-in-N chance.",
  inputSchema: {
    type: "object",
    properties: {
      enemy_id: { type: "integer", description: "Enemy ID to edit" },
      mode: { type: "string", enum: ["replace", "append", "clear"], description: "replace: overwrite all slots. append: add/merge up to 3 slots. clear: remove all drops." },
      drops: {
        type: "array",
        description: "Drop entries (max 3)",
        items: {
          type: "object",
          properties: {
            kind: { type: "integer", description: "0=none,1=item,2=weapon,3=armor" },
            data_id: { type: "integer", description: "ID of the item/weapon/armor" },
            denominator: { type: "integer", description: "1-in-N drop rate (e.g. 4 = 25%)" },
          },
          required: ["kind", "data_id", "denominator"],
        },
      },
    },
    required: ["enemy_id", "mode"],
  },
};
