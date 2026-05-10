import * as path from "path";
import { RPGMakerValidator } from "../rpgmaker/validator.js";
import { PluginTemplates } from "../templates/plugin-template.js";
import type { HandlerContext } from "./types.js";

const BRIDGE_PORT = 9001;

function generatePluginCode(
  pluginName: string,
  description: string,
  author: string,
  version: string,
  codeType: string,
): string {
  const header = `/*:
 * @target MZ
 * @plugindesc ${description}
 * @author ${author}
 * @version ${version}
 *
 * @help
 * ${pluginName}
 * Version ${version}
 *
 * ${description}
 */

(() => {
  const pluginName = "${pluginName}";
  const PLUGIN_VERSION = "${version}";
`;

  let body = "";
  switch (codeType) {
    case "simple-hook":
      body = `
  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    // Add your code here
  };
`;
      break;
    case "command":
      body = `
  PluginManager.registerCommand(pluginName, "exampleCommand", args => {
    console.log("Example command executed with args:", args);
  });
`;
      break;
    case "skill-modifier":
      body = `
  const _Game_Battler_useItem = Game_Battler.prototype.useItem;
  Game_Battler.prototype.useItem = function(item) {
    _Game_Battler_useItem.call(this, item);
    if (DataManager.isSkill(item)) {
      // Modify skill behavior here
    }
  };
`;
      break;
    default:
      body = `
  console.log(\`\${pluginName} v\${PLUGIN_VERSION} loaded\`);
`;
  }

  return header + body + "\n})();\n";
}

function registerPlugin(
  writer: HandlerContext["writer"],
  filename: string,
  description: string,
): void {
  try {
    writer.updatePluginsRegistry({
      name: filename.replace(/\.js$/i, ""),
      status: true,
      description: description || "",
      parameters: {},
    });
  } catch {
    // registry update is best-effort
  }
}

export async function handleCreatePlugin(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath } = ctx;
  const pluginName = input.plugin_name as string;
  const description = input.description as string;
  const author = (input.author as string | undefined) || "Unknown";
  const version = (input.version as string | undefined) || "1.0.0";
  const codeType = (input.code_type as string) || "empty";

  const pluginCode = generatePluginCode(pluginName, description, author, version, codeType);

  const validation = RPGMakerValidator.validateJavaScript(pluginCode);
  if (!validation.valid) {
    return JSON.stringify({ error: "Plugin code validation failed", errors: validation.errors });
  }

  try {
    const filename = `${pluginName}.js`.replace(/\.js+$/i, ".js");
    writer.writePlugin(filename, pluginCode);
    registerPlugin(writer, filename, description);
    ctx.changeLog.append({ tool: "create-plugin", entityType: "Plugin", action: "create", summary: `Plugin '${filename}' created (type: ${codeType})` });

    return JSON.stringify({
      success: true,
      message: "Plugin created",
      filename,
      path: path.join(projectPath, "js", "plugins", filename),
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleCreatePluginAdvanced(ctx: HandlerContext): Promise<string> {
  const { input, writer } = ctx;
  const pluginName = input.plugin_name as string;
  const description = input.description as string;
  const author = (input.author as string | undefined) || "Unknown";
  const version = (input.version as string | undefined) || "1.0.0";
  const templateType = input.template_type as string;
  const parameters = input.parameters as Array<{ name: string; type: string; default: string; description: string }> | undefined;

  let pluginCode: string;

  try {
    switch (templateType) {
      case "with-parameters":
        pluginCode = PluginTemplates.withParameters(pluginName, description, author, version, parameters || []);
        break;
      case "game-actor":
        pluginCode = PluginTemplates.gameActorExtension(pluginName, description, author, version);
        break;
      case "game-enemy":
        pluginCode = PluginTemplates.gameEnemyExtension(pluginName, description, author, version);
        break;
      case "event-handler":
        pluginCode = PluginTemplates.eventHandler(pluginName, description, author, version);
        break;
      case "custom-ui":
        pluginCode = PluginTemplates.customUI(pluginName, description, author, version);
        break;
      default:
        return JSON.stringify({ error: `Unknown template type: ${templateType}` });
    }

    const validation = RPGMakerValidator.validateJavaScript(pluginCode);
    if (!validation.valid) {
      return JSON.stringify({ error: "Plugin validation failed", errors: validation.errors });
    }

    const filename = `${pluginName}.js`;
    writer.writePlugin(filename, pluginCode);
    registerPlugin(writer, filename, description);
    ctx.changeLog.append({ tool: "create-plugin-advanced", entityType: "Plugin", action: "create", summary: `Advanced plugin '${filename}' created (template: ${templateType})` });

    return JSON.stringify({
      success: true,
      message: `Advanced plugin created with template: ${templateType}`,
      filename,
      lines: pluginCode.split("\n").length,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleSetupDebugPlugin(ctx: HandlerContext): Promise<string> {
  const { writer } = ctx;

  try {
    const pluginCode = PluginTemplates.debugBridge(BRIDGE_PORT);

    const validation = RPGMakerValidator.validateJavaScript(pluginCode);
    if (!validation.valid) {
      return JSON.stringify({ error: "Plugin validation failed", errors: validation.errors });
    }

    const filename = "RPGMakerDebugger.js";
    writer.writePlugin(filename, pluginCode);
    registerPlugin(writer, filename, "AI Debug Bridge for battle control");
    ctx.changeLog.append({ tool: "setup-debug-plugin", entityType: "Plugin", action: "create", summary: `Debug bridge plugin '${filename}' created on port ${BRIDGE_PORT}` });

    return JSON.stringify({
      success: true,
      message: "Debug plugin created and enabled",
      filename,
      instructions:
        "1. The plugin is now in js/plugins/RPGMakerDebugger.js and registered in js/plugins.js\n" +
        "2. Launch the game (press Play in RPG Maker editor)\n" +
        "3. Use the \"start-encounter\" tool to trigger a battle",
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
