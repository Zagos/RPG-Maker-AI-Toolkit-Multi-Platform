import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditTraitsTool: Tool = {
  name: "edit-traits",
  description:
    "Add, replace, or clear the traits array on any entity that carries one (Actor, Class, Enemy, Weapon, Armor, State). " +
    "Traits drive passive bonuses, resistances, equipment requirements, and skill unlocks. " +
    "mode=replace overwrites the full array; mode=append merges (by code+data_id); mode=clear empties it.",
  inputSchema: {
    type: "object",
    properties: {
      entity_type: {
        type: "string",
        enum: ["Actor", "Class", "Enemy", "Weapon", "Armor", "State"],
        description: "Type of entity to edit",
      },
      entity_id: {
        type: "integer",
        description: "ID of the entity to edit",
      },
      mode: {
        type: "string",
        enum: ["replace", "append", "clear"],
        description: "replace=overwrite all traits, append=merge by code+data_id, clear=remove all traits",
      },
      traits: {
        type: "array",
        description: "Array of trait objects. Required unless mode is 'clear'.",
        items: {
          type: "object",
          properties: {
            code: {
              type: "integer",
              description:
                "Trait code: 11=element rate, 12=debuff rate, 13=state rate, 14=state resist, " +
                "21=param rate, 22=ex-param, 23=sp-param, 31=attack element, 32=attack state, " +
                "33=attack speed, 41=add skill type, 42=seal skill type, 43=add skill, 44=seal skill, " +
                "51=equip weapon type, 52=equip armor type, 54=fix equip slot, 55=seal equip slot, " +
                "61=action plus, 62=special flag, 63=collapse type, 64=party ability",
            },
            data_id: {
              type: "integer",
              description: "Data ID (element ID, state ID, parameter index, etc.) — depends on code",
            },
            value: {
              type: "number",
              description: "Trait value (rate as decimal for codes 11-23, integer for others)",
            },
          },
          required: ["code", "data_id", "value"],
        },
      },
    },
    required: ["entity_type", "entity_id", "mode"],
  },
};
