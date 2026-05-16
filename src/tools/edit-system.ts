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
    "Edit global game settings in System.json: title, currency, initial party, player start position, switch/variable names, audio tracks, and UI terms (basic, params, commands, messages).",
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
      terms_basic: {
        type: "object",
        description: "Map of index→value for basic UI terms (0=Level, 1=Lv, 2=HP, 3=HP short, 4=MP, 5=MP short, 6=TP, 7=TP short, 8=EXP, 9=EXP short)",
        additionalProperties: { type: "string" },
      },
      terms_params: {
        type: "object",
        description: "Map of index→value for parameter names (0=Max HP, 1=Max MP, 2=ATK, 3=DEF, 4=MAT, 5=MDF, 6=AGI, 7=LUK)",
        additionalProperties: { type: "string" },
      },
      terms_commands: {
        type: "object",
        description: "Map of index→value for menu command labels (0=Fight, 1=Escape, 2=Attack, 3=Guard, 4=Item, 5=Skill, ...)",
        additionalProperties: { type: "string" },
      },
      terms_messages: {
        type: "object",
        description: "Map of message key→value for battle/system messages (e.g. { \"actionFailure\": \"Miss!\", \"actorDamage\": \"%1 took %2 damage!\" })",
        additionalProperties: { type: "string" },
      },
      opt_autosave: {
        type: "boolean",
        description: "Enable autosave feature (optAutosave in System.json)",
      },
      opt_display_tp: {
        type: "boolean",
        description: "Show TP gauge in battle (optDisplayTp in System.json)",
      },
      opt_slip_death: {
        type: "boolean",
        description: "Allow death from slip damage outside battle (optSlipDeath in System.json)",
      },
      opt_floor_death: {
        type: "boolean",
        description: "Allow death from floor damage (optFloorDeath in System.json)",
      },
      opt_follower_distance: {
        type: "boolean",
        description: "Keep followers at a distance on the map (optFollowerDistance in System.json)",
      },
      opt_transparent: {
        type: "boolean",
        description: "Start with transparent player character (optTransparent in System.json)",
      },
    },
    required: [],
  },
};
