import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditEffectsTool: Tool = {
  name: "edit-effects",
  description:
    "Add, replace, or clear the effects array on a Skill or Item. " +
    "Effects define what happens when the skill/item is used: recover HP/MP, gain TP, add/remove states, buff parameters, learn skills, etc. " +
    "mode=replace overwrites all effects; mode=append adds to existing; mode=clear removes all.",
  inputSchema: {
    type: "object",
    properties: {
      entity_type: {
        type: "string",
        enum: ["Skill", "Item"],
        description: "Whether to edit a Skill or an Item",
      },
      entity_id: {
        type: "integer",
        description: "ID of the skill or item to edit",
      },
      mode: {
        type: "string",
        enum: ["replace", "append", "clear"],
        description: "replace=overwrite all effects, append=add to existing, clear=remove all effects",
      },
      effects: {
        type: "array",
        description: "Array of effect objects. Required unless mode is 'clear'.",
        items: {
          type: "object",
          properties: {
            code: {
              type: "integer",
              description:
                "Effect code: 11=recover HP, 12=recover MP, 13=gain TP, " +
                "21=add state, 22=remove state, " +
                "31=add buff (param), 32=add debuff (param), 33=remove buff (param), 34=remove debuff (param), " +
                "41=learn skill, 42=call common event, 43=reduce param growth, 44=gain exp",
            },
            data_id: {
              type: "integer",
              description: "Data ID — 0 for HP/MP/TP effects; state ID for 21/22; param index (0-7) for buffs/debuffs; skill ID for 41; event ID for 42",
            },
            value1: {
              type: "number",
              description: "Primary value — for HP/MP recovery: rate (0.0-1.0); for buffs: turn count; for states: probability (0.0-1.0)",
            },
            value2: {
              type: "number",
              description: "Secondary value — for HP/MP recovery: flat amount; otherwise usually 0",
            },
          },
          required: ["code", "data_id", "value1", "value2"],
        },
      },
    },
    required: ["entity_type", "entity_id", "mode"],
  },
};
