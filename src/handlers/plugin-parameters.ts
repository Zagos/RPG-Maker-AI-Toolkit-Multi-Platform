import type { HandlerContext } from "./types.js";

export async function handleEditPluginParameters(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const pluginName = (input.plugin_name as string | undefined)?.trim();
    if (!pluginName) return JSON.stringify({ error: "plugin_name is required" });

    const parameters = input.parameters as Record<string, string> | undefined;
    if (!parameters || typeof parameters !== "object" || Object.keys(parameters).length === 0) {
      return JSON.stringify({ error: "parameters must be a non-empty object with string values" });
    }

    const plugins = writer.listPlugins();
    const existing = plugins.find((p) => p.name === pluginName);
    if (!existing) {
      return JSON.stringify({ error: `Plugin '${pluginName}' not found in plugins.js` });
    }

    // Merge new parameters into existing ones
    const merged: Record<string, string> = {
      ...(existing.parameters as Record<string, string> ?? {}),
      ...parameters,
    };

    writer.updatePluginsRegistry({ name: pluginName, parameters: merged });

    changeLog.append({
      tool: "edit-plugin-parameters",
      entityType: "Plugin",
      action: "update",
      summary: `Plugin '${pluginName}' parameters updated: ${Object.keys(parameters).join(", ")}`,
    });

    return JSON.stringify({
      success: true,
      plugin_name: pluginName,
      keys_updated: Object.keys(parameters).length,
      parameters: merged,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
