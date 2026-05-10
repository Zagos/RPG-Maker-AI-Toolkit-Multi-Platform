import type { HandlerContext } from "./types.js";

export async function handleManageBackups(ctx: HandlerContext): Promise<string> {
  const { input, writer } = ctx;
  const action = input.action as string;
  const filename = input.filename as string | undefined;
  const backupName = input.backup_name as string | undefined;
  const maxCount = (input.max_count as number | undefined) ?? 10;

  try {
    switch (action) {
      case "list": {
        const backups = writer.getBackups(filename);
        return JSON.stringify({
          success: true,
          filter: filename || "all",
          count: backups.length,
          backups,
        });
      }

      case "restore": {
        if (!backupName) {
          return JSON.stringify({ error: "backup_name is required for restore action" });
        }
        writer.restoreFromBackup(backupName);
        return JSON.stringify({
          success: true,
          message: `Restored from backup: ${backupName}`,
        });
      }

      case "delete": {
        if (!backupName) {
          return JSON.stringify({ error: "backup_name is required for delete action" });
        }
        writer.deleteBackup(backupName);
        return JSON.stringify({
          success: true,
          message: `Deleted backup: ${backupName}`,
        });
      }

      case "prune": {
        const deleted = writer.pruneBackups(filename, maxCount);
        return JSON.stringify({
          success: true,
          message: `Pruned ${deleted} backup(s), kept ${maxCount} most recent per file`,
          deleted_count: deleted,
        });
      }

      default:
        return JSON.stringify({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
