import type { HandlerContext } from "../../handlers/types.js";
import { resolveHandler } from "../../core/resolve-handler.js";

export async function handleRuntimeInspect(ctx: HandlerContext): Promise<string> {
  const input = ctx.input;
  const type = input.type as string;

  let toolName: string;
  let childInput: Record<string, unknown>;

  switch (type) {
    case "game-state":
      toolName = "get-game-state";
      childInput = {};
      break;
    case "switch":
      toolName = "get-switch";
      childInput = { id: input.id };
      break;
    case "variable":
      toolName = "get-variable";
      childInput = { id: input.id };
      break;
    case "inventory":
      toolName = "get-inventory";
      childInput = { category: input.category };
      break;
    case "actor":
      toolName = "get-actor-runtime";
      childInput = { actor_id: input.actor_id };
      break;
    case "party":
      toolName = "manage-party-runtime";
      childInput = { action: "get" };
      break;
    case "map":
      toolName = "get-map-state-runtime";
      childInput = {};
      break;
    case "battle":
      toolName = "get-battle-state-runtime";
      childInput = {};
      break;
    case "timer":
      toolName = "control-timer-runtime";
      childInput = { action: "get" };
      break;
    default:
      return JSON.stringify({ error: `Unknown runtime-inspect type: ${type}` });
  }

  const handler = resolveHandler(toolName, ctx.engine);
  if (!handler) {
    return JSON.stringify({ error: `Internal handler not found for: ${toolName}` });
  }

  return handler({ ...ctx, input: childInput });
}
