export const SetupDebugPluginTool = {
  name: "setup-debug-plugin",
  description: "Creates and enables the debug bridge plugin (RPGMakerDebugger.js) in the RPG Maker project. Required for AI battle control. Uses XHR to communicate with the MCP server's HTTP bridge.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

export const LaunchGameTool = {
  name: "launch-game",
  description: "Launches the RPG Maker MZ game (not the editor). Requires RPGMAKER_EXECUTABLE_PATH configured. The user will need to press Play in the editor, or you can point to the NW.js executable for the game.",
  inputSchema: {
    type: "object" as const,
    properties: {
      game_path: {
        type: "string",
        description: "Path to the game executable or NW.js executable. Overrides RPGMAKER_EXECUTABLE_PATH from .env",
      },
    },
  },
};

export const StartEncounterTool = {
  name: "start-encounter",
  description: "Connects to the running game via the debug plugin, starts a battle with the specified enemy/troop, waits for it to complete using the real game engine, and returns a detailed battle log with damage formulas. Use set-party-state first to configure HP/MP/states.",
  inputSchema: {
    type: "object" as const,
    properties: {
      troop_id: {
        type: "number",
        description: "Troop ID from the RPG Maker database containing the enemies",
      },
      enemy_id: {
        type: "number",
        description: "Enemy ID (creates a single-enemy troop on the fly if no troop_id given)",
      },
      count: {
        type: "number",
        description: "Number of enemies (default: 1, only used with enemy_id)",
      },
      actions: {
        type: "array",
        description: "Per-turn action plan. Each element is an array of actor instructions for that turn. If a turn is missing or a specific actor has no instruction, falls back to auto-attack.",
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              actor_id: { type: "number", description: "Actor ID (1-based). Omit to apply to all actors in that turn." },
              type: { type: "string", enum: ["attack", "guard", "skill", "item"], description: "Action type" },
              skill_id: { type: "number", description: "Skill ID (required when type is 'skill')" },
              item_id: { type: "number", description: "Item ID (required when type is 'item')" },
            },
            required: ["type"],
          },
        },
      },
    },
  },
};
