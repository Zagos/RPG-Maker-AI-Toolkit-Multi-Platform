import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const ManageBackupsMacroTool: Tool = {
  name: "manage-backups",
  description:
    "List, restore, delete, or prune project backup files created automatically by write operations.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["list", "restore", "delete", "prune"],
        description: "Backup operation: list all backups, restore a specific backup, delete a backup, or prune old backups",
      },
      filename: {
        type: "string",
        description: "Original filename to filter backups (e.g. 'Actors.json'). Required for restore and delete.",
      },
      backup_name: {
        type: "string",
        description: "Exact backup filename to restore or delete",
      },
      max_count: {
        type: "integer",
        description: "Maximum backups to keep per file when pruning (default: from BACKUP_MAX_COUNT env var)",
      },
    },
    required: ["action"],
  },
};
