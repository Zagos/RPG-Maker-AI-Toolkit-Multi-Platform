export const ReadScriptTool = {
  name: "read-script",
  description: "Read the source code of a Ruby script in a VX Ace / VX / XP project by ID or name.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id:   { type: "number", description: "Script ID (integer)" },
      name: { type: "string", description: "Script name (case-sensitive)" },
    },
    required: [],
  },
};
