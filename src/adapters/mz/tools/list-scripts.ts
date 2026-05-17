export const ListScriptsTool = {
  name: "list-scripts",
  description: "List all Ruby scripts in a VX Ace / VX / XP project (Scripts.rvdata2 / .rvdata / .rxdata). Returns id and name for each script without source code.",
  inputSchema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};
