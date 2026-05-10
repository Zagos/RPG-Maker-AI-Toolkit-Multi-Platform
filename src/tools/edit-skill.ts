import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditSkillTool: Tool = {
  name: "edit-skill",
  description: "Create or update a skill in the RPG Maker MZ project. Omit skill_id to create a new skill.",
  inputSchema: {
    type: "object",
    properties: {
      skill_id: {
        type: "integer",
        description: "ID of the skill to update. Omit to create a new skill.",
      },
      name: {
        type: "string",
        description: "Skill name",
      },
      description: {
        type: "string",
        description: "Skill description shown in menus",
      },
      mp_cost: {
        type: "integer",
        description: "MP cost to use the skill",
      },
      tp_cost: {
        type: "integer",
        description: "TP cost to use the skill",
      },
      scope: {
        type: "integer",
        enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        description: "Target scope: 0=None, 1=One Enemy, 2=All Enemies, 3=One Random Enemy, 4=2 Random Enemies, 5=3 Random Enemies, 6=4 Random Enemies, 7=One Ally, 8=All Allies, 9=One Ally(Dead), 10=All Allies(Dead), 11=The User",
      },
      occasion: {
        type: "integer",
        enum: [0, 1, 2, 3],
        description: "When usable: 0=Always, 1=Battle Only, 2=Menu Only, 3=Never",
      },
      animation_id: {
        type: "integer",
        description: "Animation ID to play when skill is used",
      },
      damage_type: {
        type: "integer",
        enum: [0, 1, 2, 3, 4, 5, 6],
        description: "Damage type: 0=None, 1=HP Damage, 2=MP Damage, 3=HP Recover, 4=MP Recover, 5=HP Drain, 6=MP Drain",
      },
      message1: {
        type: "string",
        description: "Battle message line 1 (e.g. '%1 casts Fire!')",
      },
      message2: {
        type: "string",
        description: "Battle message line 2",
      },
      icon_index: {
        type: "integer",
        description: "Icon index in the icon sheet",
      },
      speed: {
        type: "integer",
        description: "Speed modifier for turn order (-2000 to 2000)",
      },
      success_rate: {
        type: "integer",
        description: "Base success rate (0-100)",
      },
    },
    required: ["name"],
  },
};
