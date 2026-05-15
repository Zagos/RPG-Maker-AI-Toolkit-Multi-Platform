import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const CreateClassTool: Tool = {
  name: "create-class",
  description:
    "Create a new class in the RPG Maker MZ database. The name is required. " +
    "Experience curve is controlled by exp_basis, exp_extra, exp_acc_a, and exp_acc_b (all default 30/20/30/30). " +
    "The stat growth params matrix defaults to all zeros; use edit-class-learnings to add skill learnings. " +
    "Returns the new class_id.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Class name (required)",
      },
      exp_basis: {
        type: "integer",
        description: "Base experience value for the growth curve (default 30)",
      },
      exp_extra: {
        type: "integer",
        description: "Extra experience modifier for the growth curve (default 20)",
      },
      exp_acc_a: {
        type: "integer",
        description: "Experience acceleration factor A (default 30)",
      },
      exp_acc_b: {
        type: "integer",
        description: "Experience acceleration factor B (default 30)",
      },
      note: {
        type: "string",
        description: "Note field for plugin tags (e.g. '<Custom>')",
      },
    },
    required: ["name"],
  },
};
