import type { HandlerContext } from "./types.js";

export async function handleGetChangeHistory(ctx: HandlerContext): Promise<string> {
  const { input, changeLog } = ctx;

  try {
    const entries = changeLog.read({
      limit: (input.limit as number | undefined) ?? 50,
      entityType: input.entity_type as string | undefined,
      tool: input.tool as string | undefined,
      action: input.action as "create" | "update" | "delete" | undefined,
      since: input.since as string | undefined,
    });

    return JSON.stringify({ success: true, count: entries.length, entries });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
