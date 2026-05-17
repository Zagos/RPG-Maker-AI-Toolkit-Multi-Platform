export const EditScriptTool = {
  name: "edit-script",
  description: "Edit the name and/or source code of an existing Ruby script in a VX Ace / VX / XP project.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id:     { type: "number", description: "Script ID to edit" },
      name:   { type: "string", description: "New script name (optional)" },
      source: { type: "string", description: "New Ruby source code (optional)" },
    },
    required: ["id"],
  },
};
