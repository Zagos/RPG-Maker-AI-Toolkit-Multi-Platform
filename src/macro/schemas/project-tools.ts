import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ProjectToolsTool: Tool = {
  name: "project-tools",
  description:
    "Project-wide maintenance and batch operations.\n\n" +
    "Actions:\n" +
    "  validate — validate all entities and return an error/warning report (data: entity_types[]?, include_warnings?)\n" +
    "  cleanup — remove orphaned files and stale backups (data: {})\n" +
    "  find-replace — find and replace text across all entity fields (data: search required, replace required, entity_types[]?, fields[]?, dry_run?)\n" +
    "  batch-update — update multiple entities in one call (data: entity_type required, updates array required)\n" +
    "  batch-create — create multiple entities in one call (data: entity_type required, entities array required)\n" +
    "  batch-delete — delete multiple entities in one call (data: entity_type required, ids array required, confirm: true required)\n" +
    "  history — read the MCP change log (data: limit?, entity_type?, tool?, action?, since?)",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["validate", "cleanup", "find-replace", "batch-update", "batch-create", "batch-delete", "history"],
        description: "Project operation to perform",
      },
      data: {
        type: "object",
        description: "Operation-specific fields — passed directly to the internal handler",
        properties: {},
      },
    },
    required: ["action", "data"],
  },
};
