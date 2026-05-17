import type { HandlerContext } from "../../handlers/types.js";
import { resolveHandler } from "../../core/resolve-handler.js";

export async function handleManageBackups(ctx: HandlerContext): Promise<string> {
  const { action, filename, backup_name, max_count } = ctx.input as {
    action: string;
    filename?: string;
    backup_name?: string;
    max_count?: number;
  };

  const handler = resolveHandler("manage-backups", ctx.engine);
  if (!handler) {
    return JSON.stringify({ error: "Internal handler not found for: manage-backups" });
  }

  const childInput: Record<string, unknown> = { action };
  if (filename !== undefined) childInput.filename = filename;
  if (backup_name !== undefined) childInput.backup_name = backup_name;
  if (max_count !== undefined) childInput.max_count = max_count;

  return handler({ ...ctx, input: childInput });
}
