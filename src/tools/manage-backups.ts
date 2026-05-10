import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ManageBackupsTool: Tool = {
  name: "manage-backups",
  description: "List, restore, delete, or auto-prune backup files created by the MCP server.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["list", "restore", "delete", "prune"],
        description: "Action to perform: list=show backups, restore=restore a backup, delete=delete one backup, prune=delete oldest backups keeping max_count",
      },
      filename: {
        type: "string",
        description: "Filter by original filename (e.g. 'Actors.json'). Used with list and prune.",
      },
      backup_name: {
        type: "string",
        description: "Exact backup filename to restore or delete (e.g. 'Actors_2026-05-10T12-00-00-000Z.json'). Required for restore and delete.",
      },
      max_count: {
        type: "integer",
        description: "Maximum number of backups to keep per file when pruning (default: 10)",
      },
    },
    required: ["action"],
  },
};
