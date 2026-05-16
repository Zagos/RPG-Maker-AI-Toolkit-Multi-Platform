import { TOOL_HANDLERS } from "./registry.js";
import type { HandlerContext } from "./types.js";

interface BatchOperation {
  tool: string;
  input: Record<string, unknown>;
}

interface BatchResult {
  tool: string;
  index: number;
  [key: string]: unknown;
}

export async function handleBatchEdit(ctx: HandlerContext): Promise<string> {
  const { input } = ctx;
  const operations = input.operations as BatchOperation[] | undefined;
  const stopOnError = (input.stop_on_error as boolean | undefined) ?? false;

  if (!Array.isArray(operations) || operations.length === 0) {
    return JSON.stringify({ error: "operations must be a non-empty array" });
  }

  if (operations.length > 50) {
    return JSON.stringify({ error: "operations array exceeds maximum of 50 items" });
  }

  const results: BatchResult[] = [];
  let hasError = false;

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];

    if (!op.tool || typeof op.tool !== "string") {
      const result: BatchResult = { tool: op.tool ?? "(unknown)", index: i, success: false, error: "Operation missing 'tool' field" };
      results.push(result);
      hasError = true;
      if (stopOnError) break;
      continue;
    }

    if (op.tool === "batch-edit") {
      const result: BatchResult = { tool: op.tool, index: i, success: false, error: "Nested batch-edit is not allowed" };
      results.push(result);
      hasError = true;
      if (stopOnError) break;
      continue;
    }

    const handler = TOOL_HANDLERS[op.tool];
    if (!handler) {
      const result: BatchResult = { tool: op.tool, index: i, success: false, error: `Unknown tool: ${op.tool}` };
      results.push(result);
      hasError = true;
      if (stopOnError) break;
      continue;
    }

    try {
      const opCtx: HandlerContext = { ...ctx, input: op.input ?? {} };
      const raw = await handler(opCtx);
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      results.push({ tool: op.tool, index: i, ...parsed });
      if (parsed.error) hasError = true;
      if (stopOnError && parsed.error) break;
    } catch (error) {
      results.push({ tool: op.tool, index: i, success: false, error: (error as Error).message });
      hasError = true;
      if (stopOnError) break;
    }
  }

  ctx.changeLog.append({
    tool: "batch-edit",
    entityType: "Batch",
    action: "update",
    summary: `Batch executed ${results.length}/${operations.length} operations (${hasError ? "some errors" : "all succeeded"})`,
  });

  return JSON.stringify({
    success: !hasError,
    total: operations.length,
    executed: results.length,
    results,
  });
}
