import type { HandlerContext } from "../../handlers/types.js";
import { resolveHandler } from "../../core/resolve-handler.js";

const ACTION_TO_TOOL: Record<string, string> = {
  "add": "add-dialogue",
  "create-advanced": "create-dialogue-advanced",
  "generate-story": "story-generator",
  "export": "export-dialogue",
  "import": "import-dialogue",
};

export async function handleDialogueTools(ctx: HandlerContext): Promise<string> {
  const action = ctx.input.action as string;
  const data = (ctx.input.data ?? {}) as Record<string, unknown>;

  const toolName = ACTION_TO_TOOL[action];
  if (!toolName) {
    return JSON.stringify({ error: `Unknown dialogue-tools action: ${action}` });
  }

  const handler = resolveHandler(toolName, ctx.engine);
  if (!handler) {
    return JSON.stringify({ error: `Internal handler not found for: ${toolName}` });
  }

  return handler({ ...ctx, input: data });
}
