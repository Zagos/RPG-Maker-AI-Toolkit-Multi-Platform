import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const audioSchema = {
  type: "object",
  properties: {
    name: { type: "string", description: "Audio filename (without extension)" },
    volume: { type: "integer", description: "Volume 0-100" },
    pitch: { type: "integer", description: "Pitch 50-150" },
    pan: { type: "integer", description: "Pan -100 to 100" },
  },
};

export const EditSystemTool: Tool = {
  name: "edit-system",
  description:
    "Edit global game settings in System.json: title, currency, initial party, player start position, switch/variable names, and audio tracks.",
  inputSchema: {
    type: "object",
    properties: {
      game_title: {
        type: "string",
        description: "Game title shown on the title screen",
      },
      currency_unit: {
        type: "string",
        description: "Currency name shown in menus (e.g. 'Gold', 'Coins')",
      },
      initial_party: {
        type: "array",
        description: "Array of actor IDs that form the starting party",
        items: { type: "integer" },
      },
      start_map_id: {
        type: "integer",
        description: "Map ID where the player starts a new game",
      },
      start_x: {
        type: "integer",
        description: "X tile coordinate of the player start position",
      },
      start_y: {
        type: "integer",
        description: "Y tile coordinate of the player start position",
      },
      switch_names: {
        type: "object",
        description: "Map of switch ID (as string key) → name. E.g. { \"1\": \"Event Cleared\", \"2\": \"Door Open\" }",
        additionalProperties: { type: "string" },
      },
      variable_names: {
        type: "object",
        description: "Map of variable ID (as string key) → name. E.g. { \"1\": \"Gold Collected\" }",
        additionalProperties: { type: "string" },
      },
      title_bgm: {
        ...audioSchema,
        description: "Background music for the title screen",
      },
      battle_bgm: {
        ...audioSchema,
        description: "Default background music for battles",
      },
      victory_me: {
        ...audioSchema,
        description: "Music effect played after winning a battle",
      },
      defeat_me: {
        ...audioSchema,
        description: "Music effect played after losing a battle",
      },
    },
    required: [],
  },
};
