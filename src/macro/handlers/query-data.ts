import type { HandlerContext } from "../../handlers/types.js";
import { resolveHandler } from "../../core/resolve-handler.js";

export async function handleQueryData(ctx: HandlerContext): Promise<string> {
  const input = ctx.input;
  const type = input.type as string;

  let toolName: string;
  let childInput: Record<string, unknown>;

  switch (type) {
    case "list":
      toolName = "list-game-data";
      childInput = { data_type: input.data_type };
      break;
    case "entity":
      toolName = "read-entity";
      childInput = { entity_type: input.entity_type, entity_id: input.id };
      break;
    case "map":
      toolName = "read-map";
      childInput = { map_id: input.id, include_events: input.include_events, include_encounters: input.include_encounters };
      break;
    case "maps":
      toolName = "list-maps";
      childInput = {};
      break;
    case "resources":
      toolName = "list-resources";
      childInput = { category: input.category };
      break;
    case "system":
      toolName = "read-system-extended";
      childInput = { section: input.section };
      break;
    case "animation":
      toolName = "read-animation";
      childInput = { animation_id: input.id };
      break;
    case "tileset":
      toolName = "read-tileset";
      childInput = { tileset_id: input.id, include_flags: input.include_flags };
      break;
    case "search":
      toolName = "search-entity";
      childInput = { entity_type: input.entity_type, query: input.query, field: input.field, limit: input.limit };
      break;
    case "summary":
      toolName = "export-project-summary";
      childInput = {};
      break;
    default:
      return JSON.stringify({ error: `Unknown query-data type: ${type}` });
  }

  const handler = resolveHandler(toolName, ctx.engine);
  if (!handler) {
    return JSON.stringify({ error: `Internal handler not found for: ${toolName}` });
  }

  return handler({ ...ctx, input: childInput });
}
