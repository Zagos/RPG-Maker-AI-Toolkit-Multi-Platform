import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EditClassLearningsTool: Tool = {
  name: "edit-class-learnings",
  description: "Edit the skill learning curve of a class. Each learning defines at which level the class learns a skill.",
  inputSchema: {
    type: "object",
    properties: {
      class_id: { type: "integer", description: "Class ID to edit" },
      mode: { type: "string", enum: ["replace", "append", "remove_at_level"], description: "replace: overwrite all. append: add/update entries by level. remove_at_level: remove entries at a specific level." },
      learnings: {
        type: "array",
        description: "Skill learning entries",
        items: {
          type: "object",
          properties: {
            level: { type: "integer", description: "Level at which skill is learned" },
            skill_id: { type: "integer", description: "Skill ID to learn" },
            note: { type: "string" },
          },
          required: ["level", "skill_id"],
        },
      },
      level: { type: "integer", description: "Level to remove (used with mode=remove_at_level)" },
    },
    required: ["class_id", "mode"],
  },
};
