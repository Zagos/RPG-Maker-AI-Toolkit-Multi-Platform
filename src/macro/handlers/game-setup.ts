import type { HandlerContext } from "../../handlers/types.js";
import { resolveHandler } from "../../core/resolve-handler.js";

export async function handleGameSetup(ctx: HandlerContext): Promise<string> {
  const action = ctx.input.action as string;
  const data = (ctx.input.data ?? {}) as Record<string, unknown>;

  switch (action) {
    case "health-check": {
      const handler = resolveHandler("health-check", ctx.engine);
      if (!handler) {
        return JSON.stringify({ error: "Internal handler not found for: health-check" });
      }
      return handler({ ...ctx, input: {} });
    }

    case "setup-debug": {
      const handler = resolveHandler("setup-debug-plugin", ctx.engine);
      if (!handler) {
        return JSON.stringify({ error: "Internal handler not found for: setup-debug-plugin" });
      }
      return handler({ ...ctx, input: {} });
    }

    case "launch": {
      const handler = resolveHandler("launch-game", ctx.engine);
      if (!handler) {
        return JSON.stringify({ error: "Internal handler not found for: launch-game" });
      }
      return handler({ ...ctx, input: data });
    }

    default:
      return JSON.stringify({ error: `Unknown game-setup action: ${action}` });
  }
}
