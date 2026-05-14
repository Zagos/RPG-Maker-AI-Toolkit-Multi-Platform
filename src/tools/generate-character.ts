import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const GenerateCharacterTool: Tool = {
  name: "generate-character",
  description:
    "Generate a complete playable character (actor) from a high-level concept. " +
    "Reads existing project data (classes, skills, weapons, armors) and assigns the most suitable ones " +
    "based on the chosen archetype. Creates the actor in the database and returns a full configuration summary. " +
    "Archetypes: warrior, mage, rogue, healer, paladin, ranger.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Character name (displayed in-game)",
      },
      archetype: {
        type: "string",
        enum: ["warrior", "mage", "rogue", "healer", "paladin", "ranger"],
        description: "Character archetype that drives class, equipment, and skill selection",
      },
      nickname: {
        type: "string",
        description: "Short title shown under the name (e.g. 'The Bold'). Optional.",
      },
      initial_level: {
        type: "integer",
        description: "Starting level (1-99, default: 1)",
      },
      max_level: {
        type: "integer",
        description: "Maximum level cap (1-99, default: 99)",
      },
      character_name: {
        type: "string",
        description: "Sprite sheet filename from img/characters/ (e.g. 'Actor1'). Auto-selected if omitted.",
      },
      character_index: {
        type: "integer",
        description: "Sprite index within the sheet (0-7). Auto-selected if omitted.",
      },
      face_name: {
        type: "string",
        description: "Face sheet filename from img/faces/ (e.g. 'Actor1'). Auto-selected if omitted.",
      },
      face_index: {
        type: "integer",
        description: "Face index within the sheet (0-7). Auto-selected if omitted.",
      },
      profile: {
        type: "string",
        description: "Character background story shown in the status menu. Optional.",
      },
      note: {
        type: "string",
        description: "Developer note attached to this actor entry. Optional.",
      },
    },
    required: ["name", "archetype"],
  },
};
