import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditMapTool: Tool = {
  name: "edit-map",
  description:
    "Edit properties of an existing map (MapXXX.json + MapInfos.json entry). Does not touch tile data or events — only map metadata.",
  inputSchema: {
    type: "object",
    properties: {
      map_id: {
        type: "integer",
        description: "ID of the map to edit",
      },
      name: {
        type: "string",
        description: "Display name of the map",
      },
      tileset_id: {
        type: "integer",
        description: "Tileset ID to use",
      },
      scroll_type: {
        type: "integer",
        description: "Scroll type: 0=no loop, 1=loop horizontal, 2=loop vertical, 3=loop both",
      },
      encounter_step: {
        type: "integer",
        description: "Average steps between random encounters",
      },
      note: {
        type: "string",
        description: "Developer note attached to the map",
      },
      enable_name_display: {
        type: "boolean",
        description: "Show the map name on screen when entering",
      },
      autoplay_bgm: {
        type: "boolean",
        description: "Auto-play background music when entering",
      },
      bgm_name: {
        type: "string",
        description: "BGM filename (without extension)",
      },
      bgm_volume: {
        type: "integer",
        description: "BGM volume (0-100, default 90)",
      },
      bgm_pitch: {
        type: "integer",
        description: "BGM pitch (50-150, default 100)",
      },
      autoplay_bgs: {
        type: "boolean",
        description: "Auto-play background sound when entering",
      },
      bgs_name: {
        type: "string",
        description: "BGS filename (without extension)",
      },
      specify_battleback: {
        type: "boolean",
        description: "Use custom battle background",
      },
      battleback1: {
        type: "string",
        description: "Battleback ground layer filename",
      },
      battleback2: {
        type: "string",
        description: "Battleback wall layer filename",
      },
      parallax_name: {
        type: "string",
        description: "Parallax background image filename",
      },
      parallax_show: {
        type: "boolean",
        description: "Show parallax background",
      },
      parallax_loop_x: {
        type: "boolean",
        description: "Loop parallax horizontally",
      },
      parallax_loop_y: {
        type: "boolean",
        description: "Loop parallax vertically",
      },
      encounters: {
        type: "array",
        description: "Replace the random encounter list. Each entry: { enemy_id, weight }.",
        items: {
          type: "object",
          properties: {
            enemy_id: { type: "integer", description: "Enemy group (troop) ID" },
            weight: { type: "integer", description: "Relative spawn weight (default 5)" },
          },
          required: ["enemy_id"],
        },
      },
    },
    required: ["map_id"],
  },
};
