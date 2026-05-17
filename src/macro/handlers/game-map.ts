import type { HandlerContext } from "../../handlers/types.js";
import { resolveHandler } from "../../core/resolve-handler.js";

const ACTION_TO_TOOL: Record<string, string> = {
  "create": "create-map",
  "edit": "edit-map",
  "delete": "delete-map",
  "copy": "copy-map",
  "edit-info": "edit-map-info",
  "read-tiles": "read-map-tiles",
  "paint-tiles": "paint-map-tiles",
  "fill": "fill-map-region",
  "paint-region": "paint-map-region",
  "create-event": "create-map-event",
  "edit-event": "edit-map-event",
  "delete-event": "delete-map-event",
  "edit-event-page": "edit-event-page",
  "edit-troop-events": "edit-troop-events",
  "create-tileset": "create-tileset",
  "edit-tileset": "edit-tileset",
  "edit-tileset-properties": "edit-tileset-properties",
};

export async function handleGameMap(ctx: HandlerContext): Promise<string> {
  const action = ctx.input.action as string;
  const data = (ctx.input.data ?? {}) as Record<string, unknown>;

  const toolName = ACTION_TO_TOOL[action];
  if (!toolName) {
    return JSON.stringify({ error: `Unknown game-map action: ${action}` });
  }

  const handler = resolveHandler(toolName, ctx.engine);
  if (!handler) {
    return JSON.stringify({ error: `Internal handler not found for: ${toolName}` });
  }

  return handler({ ...ctx, input: data });
}
