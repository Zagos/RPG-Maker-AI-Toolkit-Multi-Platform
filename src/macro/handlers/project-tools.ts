import type { HandlerContext } from "../../handlers/types.js";
import { resolveHandler } from "../../core/resolve-handler.js";

const ACTION_TO_TOOL: Record<string, string> = {
  "validate": "validate-project",
  "cleanup": "cleanup-project",
  "find-replace": "find-and-replace",
  "batch-update": "batch-update-entities",
  "batch-create": "batch-create-entities",
  "batch-delete": "batch-delete-entities",
  "history": "get-change-history",
};

export async function handleProjectTools(ctx: HandlerContext): Promise<string> {
  const action = ctx.input.action as string;
  const data = (ctx.input.data ?? {}) as Record<string, unknown>;

  const toolName = ACTION_TO_TOOL[action];
  if (!toolName) {
    return JSON.stringify({ error: `Unknown project-tools action: ${action}` });
  }

  const handler = resolveHandler(toolName, ctx.engine);
  if (!handler) {
    return JSON.stringify({ error: `Internal handler not found for: ${toolName}` });
  }

  return handler({ ...ctx, input: data });
}
