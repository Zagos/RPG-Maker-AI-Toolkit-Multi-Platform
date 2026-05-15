import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CreateSkillTool: Tool = {
  name: "create-skill",
  description:
    "Create a new skill in the RPG Maker MZ database. The name is required; all other fields use " +
    "sensible defaults (scope=1 one enemy, occasion=1 battle only, successRate=100, hitType=1 physical). " +
    "Returns the new skill_id.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Skill name (required)",
      },
      description: {
        type: "string",
        description: "Skill description displayed in menus",
      },
      stype_id: {
        type: "integer",
        description: "Skill type ID (1=magic, 2=special, etc.) — matches System skillTypes",
      },
      mp_cost: {
        type: "integer",
        description: "MP cost to use this skill (default 0)",
      },
      tp_cost: {
        type: "integer",
        description: "TP cost to use this skill (default 0)",
      },
      scope: {
        type: "integer",
        description:
          "Target scope: 0=none, 1=one enemy, 2=all enemies, 3=one random enemy, " +
          "4=2 random enemies, 5=3 random enemies, 6=4 random enemies, " +
          "7=one ally, 8=all allies, 9=one ally (dead), 10=all allies (dead), " +
          "11=user (default 1)",
      },
      occasion: {
        type: "integer",
        description: "Usable occasion: 0=always, 1=battle only, 2=menu only, 3=never (default 1)",
      },
      speed: {
        type: "integer",
        description: "Action speed modifier added to the actor's agility (-2000 to 2000, default 0)",
      },
      success_rate: {
        type: "integer",
        description: "Base success rate 0–100 (default 100)",
      },
      repeats: {
        type: "integer",
        description: "Number of hits (1–9, default 1)",
      },
      tp_gain: {
        type: "integer",
        description: "TP gained by the user when this skill is used (default 0)",
      },
      hit_type: {
        type: "integer",
        description: "0=certain hit, 1=physical attack, 2=magical attack (default 1)",
      },
      animation_id: {
        type: "integer",
        description: "Animation ID to play when the skill is used (0=none, default 0)",
      },
      damage_type: {
        type: "integer",
        description:
          "0=none, 1=HP damage, 2=MP damage, 3=HP recover, 4=MP recover, 5=HP drain, 6=MP drain (default 0)",
      },
      damage_formula: {
        type: "string",
        description: "Damage formula evaluated at runtime (e.g. 'a.atk * 4 - b.def * 2', default '0')",
      },
      damage_element_id: {
        type: "integer",
        description: "Element ID for the damage (0=none, default 0)",
      },
      damage_variance: {
        type: "integer",
        description: "Damage variance percentage 0–100 (default 20)",
      },
      damage_critical: {
        type: "boolean",
        description: "Whether this skill can land a critical hit (default false)",
      },
      message1: {
        type: "string",
        description: "Battle message line 1 shown after the actor name (e.g. ' uses Fire!')",
      },
      message2: {
        type: "string",
        description: "Battle message line 2 (continuation of message1)",
      },
      icon_index: {
        type: "integer",
        description: "Icon index in the icon sheet (default 0)",
      },
      required_wtype_id1: {
        type: "integer",
        description: "Required weapon type 1 (0=none, default 0)",
      },
      required_wtype_id2: {
        type: "integer",
        description: "Required weapon type 2 (0=none, default 0)",
      },
      note: {
        type: "string",
        description: "Note field for plugin tags (e.g. '<Custom>')",
      },
    },
    required: ["name"],
  },
};
