export const BatchEditTool = {
  name: "batch-edit",
  description:
    "Execute multiple MCP tool operations in a single call. Each operation runs in order; results are returned per-operation. Failures are reported individually and do not stop subsequent operations by default.",
  inputSchema: {
    type: "object" as const,
    properties: {
      operations: {
        type: "array",
        description: "Ordered list of operations to execute (max 50)",
        items: {
          type: "object",
          properties: {
            tool: {
              type: "string",
              description: "Name of the tool to call (e.g. 'edit-actor', 'edit-item')",
            },
            input: {
              type: "object",
              description: "Input parameters for the tool (same as calling the tool directly)",
              properties: {},
            },
          },
          required: ["tool", "input"],
        },
      },
      stop_on_error: {
        type: "boolean",
        description: "If true, stop executing after the first failed operation (default: false)",
      },
    },
    required: ["operations"],
  },
};
