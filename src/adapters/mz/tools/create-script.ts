export const CreateScriptTool = {
  name: "create-script",
  description: "Create a new Ruby script in a VX Ace / VX / XP project. By default inserts before the 'Main' script.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name:               { type: "string",  description: "Script name" },
      source:             { type: "string",  description: "Ruby source code" },
      insert_before_main: { type: "boolean", description: "Insert before the Main script (default: true)" },
    },
    required: ["name", "source"],
  },
};
