import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CreateActorTool: Tool = {
  name: "create-actor",
  description:
    "Create a new actor (playable character) in the RPG Maker MZ database. The name is required. " +
    "Defaults: classId=1, initialLevel=1, maxLevel=99, equips=[0,0,0,0,0]. " +
    "Returns the new actor_id.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Actor name displayed in menus and dialogue (required)",
      },
      nickname: {
        type: "string",
        description: "Actor nickname (subtitle shown in the status screen, default empty)",
      },
      class_id: {
        type: "integer",
        description: "Starting class ID (default 1)",
      },
      initial_level: {
        type: "integer",
        description: "Starting level 1–99 (default 1)",
      },
      max_level: {
        type: "integer",
        description: "Maximum level cap 1–99 (default 99)",
      },
      face_name: {
        type: "string",
        description: "Face graphic filename from img/faces/ (without extension)",
      },
      face_index: {
        type: "integer",
        description: "Face graphic cell index 0–7 (default 0)",
      },
      character_name: {
        type: "string",
        description: "Character (walking) sprite filename from img/characters/ (without extension)",
      },
      character_index: {
        type: "integer",
        description: "Character sprite cell index 0–7 (default 0)",
      },
      battler_name: {
        type: "string",
        description: "Side-view battler filename from img/sv_actors/ (without extension)",
      },
      profile: {
        type: "string",
        description: "Multi-line profile text shown on the actor's status page",
      },
      note: {
        type: "string",
        description: "Note field for plugin tags (e.g. '<Custom>')",
      },
    },
    required: ["name"],
  },
};
