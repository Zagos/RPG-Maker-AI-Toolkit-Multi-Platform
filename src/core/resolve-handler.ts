import type { HandlerContext } from "../handlers/types.js";
import { TOOL_HANDLERS } from "../handlers/registry.js";
import { RUBY_RUNTIME_HANDLERS } from "../handlers/registry-ruby.js";

const RUBY_ENGINES = new Set(["vxace", "vx", "xp"]);

export function resolveHandler(
  toolName: string,
  engine: string,
): ((ctx: HandlerContext) => Promise<string>) | undefined {
  const isRuby = RUBY_ENGINES.has(engine);
  return (isRuby && RUBY_RUNTIME_HANDLERS[toolName])
    ? RUBY_RUNTIME_HANDLERS[toolName]
    : TOOL_HANDLERS[toolName];
}
