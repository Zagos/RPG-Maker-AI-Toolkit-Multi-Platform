import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditClassTool: Tool = {
  name: "edit-class",
  description: "Create or update a class in the RPG Maker MZ project. Omit class_id to create a new class.",
  inputSchema: {
    type: "object",
    properties: {
      class_id: {
        type: "integer",
        description: "ID of the class to update. Omit to create a new class.",
      },
      name: {
        type: "string",
        description: "Class name (e.g. 'Warrior', 'Mage')",
      },
      exp_basis: {
        type: "integer",
        description: "Base EXP needed to level up (expParams[0], default 30)",
      },
      exp_extra: {
        type: "integer",
        description: "Extra EXP per level (expParams[1], default 20)",
      },
      exp_acc_a: {
        type: "integer",
        description: "EXP acceleration factor A (expParams[2], default 30)",
      },
      exp_acc_b: {
        type: "integer",
        description: "EXP acceleration factor B (expParams[3], default 30)",
      },
    },
    required: ["name"],
  },
};
