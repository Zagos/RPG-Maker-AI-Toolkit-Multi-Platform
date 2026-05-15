import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CreateItemTool: Tool = {
  name: "create-item",
  description:
    "Create a new item in the RPG Maker MZ database. The name is required; all other fields use " +
    "sensible defaults (itype_id=1 regular item, consumable=true, scope=7 entire party, " +
    "occasion=0 always usable, successRate=100). Returns the new item_id.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Item name (required)",
      },
      description: {
        type: "string",
        description: "Item description displayed in menus",
      },
      price: {
        type: "integer",
        description: "Shop buy price in gold (default 0)",
      },
      itype_id: {
        type: "integer",
        description: "Item type: 1=regular item, 2=key item (default 1)",
      },
      icon_index: {
        type: "integer",
        description: "Icon index in the icon sheet (default 0)",
      },
      consumable: {
        type: "boolean",
        description: "Whether the item is consumed on use (default true)",
      },
      scope: {
        type: "integer",
        description:
          "Target scope: 0=none, 1=one enemy, 2=all enemies, 7=one ally, 8=all allies, " +
          "9=one ally (dead), 10=all allies (dead), 11=user (default 7)",
      },
      occasion: {
        type: "integer",
        description: "Usable occasion: 0=always, 1=battle only, 2=menu only, 3=never (default 0)",
      },
      speed: {
        type: "integer",
        description: "Action speed modifier (-2000 to 2000, default 0)",
      },
      success_rate: {
        type: "integer",
        description: "Base success rate 0–100 (default 100)",
      },
      repeats: {
        type: "integer",
        description: "Number of times the item effect is applied (1–9, default 1)",
      },
      tp_gain: {
        type: "integer",
        description: "TP gained by the user when this item is used (default 0)",
      },
      hit_type: {
        type: "integer",
        description: "0=certain hit, 1=physical attack, 2=magical attack (default 0)",
      },
      animation_id: {
        type: "integer",
        description: "Animation ID to play when the item is used (0=none, default 0)",
      },
      note: {
        type: "string",
        description: "Note field for plugin tags (e.g. '<Custom>')",
      },
    },
    required: ["name"],
  },
};
