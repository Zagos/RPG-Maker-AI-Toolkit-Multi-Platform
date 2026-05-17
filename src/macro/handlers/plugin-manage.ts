import type { HandlerContext } from "../../handlers/types.js";
import { resolveHandler } from "../../core/resolve-handler.js";

const RUBY_ENGINES = new Set(["vxace", "vx", "xp"]);

const JS_PLUGIN_ACTIONS = new Set(["create", "create-advanced", "manage", "edit-parameters", "reorder"]);
const SCRIPT_ACTIONS = new Set(["list-scripts", "read-script", "create-script", "edit-script", "delete-script"]);

const ACTION_TO_TOOL: Record<string, string> = {
  "create": "create-plugin",
  "create-advanced": "create-plugin-advanced",
  "manage": "manage-plugins",
  "edit-parameters": "edit-plugin-parameters",
  "reorder": "reorder-plugin",
  "list-scripts": "list-scripts",
  "read-script": "read-script",
  "create-script": "create-script",
  "edit-script": "edit-script",
  "delete-script": "delete-script",
};

const RUBY_ENGINE_LABELS: Record<string, string> = { vxace: "VX Ace", vx: "VX", xp: "XP" };

export async function handlePluginManage(ctx: HandlerContext): Promise<string> {
  const action = ctx.input.action as string;
  const data = (ctx.input.data ?? {}) as Record<string, unknown>;
  const isRuby = RUBY_ENGINES.has(ctx.engine);

  if (JS_PLUGIN_ACTIONS.has(action) && isRuby) {
    const label = RUBY_ENGINE_LABELS[ctx.engine] ?? ctx.engine;
    return JSON.stringify({
      error: `Plugin action '${action}' is not available for RPG Maker ${label}. Use script actions (list-scripts, read-script, create-script, edit-script, delete-script) instead.`,
    });
  }

  if (SCRIPT_ACTIONS.has(action) && !isRuby) {
    return JSON.stringify({
      error: `Script action '${action}' is only available for Ruby engine projects (VX Ace, VX, XP). Use plugin actions for RPG Maker MZ/MV.`,
    });
  }

  const toolName = ACTION_TO_TOOL[action];
  if (!toolName) {
    return JSON.stringify({ error: `Unknown plugin-manage action: ${action}` });
  }

  const handler = resolveHandler(toolName, ctx.engine);
  if (!handler) {
    return JSON.stringify({ error: `Internal handler not found for: ${toolName}` });
  }

  return handler({ ...ctx, input: data });
}
