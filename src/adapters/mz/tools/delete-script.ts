export const DeleteScriptTool = {
  name: "delete-script",
  description: "Delete a Ruby script from a VX Ace / VX / XP project by ID. Use with care — this cannot be undone without restoring a backup.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "number", description: "Script ID to delete" },
    },
    required: ["id"],
  },
};
