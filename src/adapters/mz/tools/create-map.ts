import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CreateMapTool: Tool = {
  name: "create-map",
  description:
    "Create a new empty map in the RPG Maker MZ project. Writes MapXXX.json and registers the entry in MapInfos.json. If map_id is omitted the next available ID is chosen automatically.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Display name of the new map (shown in the editor and optionally on screen)",
      },
      map_id: {
        type: "integer",
        description: "Explicit map ID to use (1–999). Omit to auto-assign the next available ID.",
      },
      width: {
        type: "integer",
        description: "Map width in tiles (default: 17)",
      },
      height: {
        type: "integer",
        description: "Map height in tiles (default: 13)",
      },
      tileset_id: {
        type: "integer",
        description: "Tileset ID to use for this map (default: 1)",
      },
      parent_id: {
        type: "integer",
        description: "Parent map ID in the editor hierarchy (default: 0 = root)",
      },
      scroll_type: {
        type: "integer",
        description: "Scroll type: 0=no loop, 1=loop horizontal, 2=loop vertical, 3=loop both (default: 0)",
      },
      encounter_step: {
        type: "integer",
        description: "Average steps between random encounters (default: 30)",
      },
      note: {
        type: "string",
        description: "Developer note attached to the map (default: empty)",
      },
      enable_name_display: {
        type: "boolean",
        description: "Show the map name on screen when entering (default: false)",
      },
      autoplay_bgm: {
        type: "boolean",
        description: "Auto-play background music when entering (default: false)",
      },
      bgm_name: {
        type: "string",
        description: "BGM filename to play (without extension, e.g. 'Town1')",
      },
      autoplay_bgs: {
        type: "boolean",
        description: "Auto-play background sound when entering (default: false)",
      },
      bgs_name: {
        type: "string",
        description: "BGS filename to play (without extension)",
      },
    },
    required: ["name"],
  },
};
