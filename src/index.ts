#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import { z } from "zod";
type ZodTypeAny = z.ZodTypeAny;

// RPG Maker utilities
import { RPGMakerReader } from "./rpgmaker/reader.js";
import { RPGMakerWriter } from "./rpgmaker/writer.js";
import { RPGMakerDebugBridge } from "./rpgmaker/debug-bridge.js";
import type { BattleState, GameState } from "./rpgmaker/debug-bridge.js";
import { ChangeLog } from "./rpgmaker/change-log.js";

// Tool definitions
import { EditActorTool } from "./tools/edit-actor.js";
import { EditItemTool } from "./tools/edit-item.js";
import { EditEnemyTool } from "./tools/edit-enemy.js";
import { CreatePluginTool } from "./tools/create-plugin.js";
import { AddDialogueTool } from "./tools/add-dialogue.js";
import { CreatePluginAdvancedTool } from "./tools/create-plugin-advanced.js";
import { CreateDialogueTool } from "./tools/create-dialogue-advanced.js";
import { CreateMapEventTool } from "./tools/create-map-event.js";
import { StoryGeneratorTool } from "./tools/story-generator.js";
import { SetupDebugPluginTool, LaunchGameTool, StartEncounterTool } from "./tools/battle-debug.js";
import { GetGameStateTool } from "./tools/get-game-state.js";
import { SetSwitchTool } from "./tools/set-switch.js";
import { SetVariableTool } from "./tools/set-variable.js";
import { TeleportPlayerTool } from "./tools/teleport-player.js";
import { SaveGameTool } from "./tools/save-game.js";
import { LoadGameTool } from "./tools/load-game.js";
import { SetPartyStateTool } from "./tools/set-party-state.js";
import { RunBattleSuiteTool } from "./tools/run-battle-suite.js";
import { EditWeaponTool } from "./tools/edit-weapon.js";
import { EditArmorTool } from "./tools/edit-armor.js";
import { EditSkillTool } from "./tools/edit-skill.js";
import { EditClassTool } from "./tools/edit-class.js";
import { EditStateTool } from "./tools/edit-state.js";
import { ReadMapTool } from "./tools/read-map.js";
import { CreateMapTool } from "./tools/create-map.js";
import { CreateTroopTool, EditTroopTool } from "./tools/troop.js";
import { CreateCommonEventTool, EditCommonEventTool } from "./tools/common-event.js";
import { EditMapTool } from "./tools/edit-map.js";
import { EditSystemTool } from "./tools/edit-system.js";
import { ManageBackupsTool } from "./tools/manage-backups.js";
import { BatchEditTool } from "./tools/batch-edit.js";
import { ListMapsTool } from "./tools/list-maps.js";
import { DeleteMapTool } from "./tools/delete-map.js";
import { EditMapEventTool, DeleteMapEventTool } from "./tools/edit-map-event.js";
import { ManagePluginsTool } from "./tools/manage-plugins.js";
import { ReadEntityTool } from "./tools/read-entity.js";
import { ExecuteScriptTool } from "./tools/execute-script.js";
import { ShowMessageTool } from "./tools/show-message.js";
import { EditTilesetTool } from "./tools/edit-tileset.js";
import { EditDropItemsTool } from "./tools/edit-drop-items.js";
import { EditClassLearningsTool } from "./tools/edit-class-learnings.js";
import { EditVehicleTool } from "./tools/edit-vehicle.js";
import { GetInventoryTool } from "./tools/get-inventory.js";
import { ModifyInventoryTool } from "./tools/modify-inventory.js";
import { GetSwitchTool, GetVariableTool } from "./tools/get-runtime-value.js";
import { CallCommonEventTool } from "./tools/call-common-event.js";
import { ModifyActorRuntimeTool } from "./tools/modify-actor-runtime.js";
import { ReadSystemExtendedTool } from "./tools/read-system-extended.js";
import { ReadMapTilesTool } from "./tools/read-map-tiles.js";
import { PaintMapTilesTool } from "./tools/paint-map-tiles.js";
import { FillMapRegionTool } from "./tools/fill-map-region.js";
import { ReadTilesetTool } from "./tools/read-tileset.js";
import { CreateTilesetTool } from "./tools/create-tileset.js";
import { EditTilesetPropertiesTool } from "./tools/edit-tileset-properties.js";
import { GenerateCharacterTool } from "./tools/generate-character.js";
import { EditTraitsTool } from "./tools/edit-traits.js";
import { PaintMapRegionTool } from "./tools/paint-map-region.js";
import { EditTroopEventsTool } from "./tools/edit-troop-events.js";
import { ListResourcesTool } from "./tools/list-resources.js";
import { EditEffectsTool } from "./tools/edit-effects.js";
import { EditEventPageTool } from "./tools/edit-event-page.js";
import { EditPluginParametersTool } from "./tools/edit-plugin-parameters.js";
import { EditEnemyActionsTool } from "./tools/edit-enemy-actions.js";
import { DeleteEntityTool } from "./tools/delete-entity.js";
import { ReadAnimationTool, EditAnimationTool } from "./tools/animation.js";

// Handlers
import type { HandlerContext } from "./handlers/types.js";
import { TOOL_HANDLERS as BASE_TOOL_HANDLERS } from "./handlers/registry.js";
import { handleBatchEdit } from "./handlers/batch-edit.js";

function loadEnvFile(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sep = trimmed.indexOf("=");
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    const value = trimmed.slice(sep + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile();

const RPGMAKER_PROJECT_PATH = process.env.RPGMAKER_PROJECT_PATH;
const DEBUG = process.env.MCP_DEBUG === "true";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const BRIDGE_PORT = 9001;
const MAX_BACKUPS = parseInt(process.env.BACKUP_MAX_COUNT || "10", 10);

const logger = {
  debug: (msg: string, data?: unknown) => {
    if (LOG_LEVEL === "debug" || DEBUG) {
      console.error(`[DEBUG] ${msg}`, data ? JSON.stringify(data, null, 2) : "");
    }
  },
  info: (msg: string) => console.error(`[INFO] ${msg}`),
  warn: (msg: string, data?: unknown) => console.error(`[WARN] ${msg}`, data ? JSON.stringify(data, null, 2) : ""),
  error: (msg: string, data?: unknown) => console.error(`[ERROR] ${msg}`, data ? JSON.stringify(data, null, 2) : ""),
};

function validateSetup(): boolean {
  if (!RPGMAKER_PROJECT_PATH) {
    logger.error("RPGMAKER_PROJECT_PATH is not set. Please configure .env file.");
    return false;
  }
  if (!fs.existsSync(RPGMAKER_PROJECT_PATH)) {
    logger.error(`RPG Maker project path does not exist: ${RPGMAKER_PROJECT_PATH}`);
    return false;
  }
  const dataPath = path.join(RPGMAKER_PROJECT_PATH, "data");
  if (!fs.existsSync(dataPath)) {
    logger.error(`RPG Maker data directory not found at: ${dataPath}. Is this a valid RPG Maker MZ project?`);
    return false;
  }
  logger.info(`✓ RPG Maker project found at: ${RPGMAKER_PROJECT_PATH}`);
  return true;
}

// JSON Schema → Zod conversion (for tool registration)
type JsonSchemaProperty = {
  type?: string;
  enum?: unknown[];
  description?: string;
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  required?: string[];
};
type JsonObjectSchema = JsonSchemaProperty & { type: "object"; properties?: Record<string, JsonSchemaProperty>; required?: string[] };

function jsonSchemaPropertyToZod(schema: JsonSchemaProperty): ZodTypeAny {
  let zodSchema: ZodTypeAny;
  if (schema.enum && schema.enum.length > 0) {
    zodSchema = z.enum(schema.enum.map(String) as [string, ...string[]]);
  } else {
    switch (schema.type) {
      case "number": case "integer": zodSchema = z.number(); break;
      case "boolean": zodSchema = z.boolean(); break;
      case "array": zodSchema = z.array(schema.items ? jsonSchemaPropertyToZod(schema.items) : z.unknown()); break;
      case "object": zodSchema = jsonSchemaToZod(schema as JsonObjectSchema); break;
      default: zodSchema = z.string();
    }
  }
  return schema.description ? zodSchema.describe(schema.description) : zodSchema;
}

function jsonSchemaToZod(schema: JsonObjectSchema): z.ZodObject<z.ZodRawShape> {
  const required = new Set(schema.required || []);
  const shape: Record<string, ZodTypeAny> = {};
  for (const [name, prop] of Object.entries(schema.properties || {})) {
    const s = jsonSchemaPropertyToZod(prop);
    shape[name] = required.has(name) ? s : s.optional();
  }
  return z.object(shape);
}

function toolInputSchemaToZod(tool: Tool): z.ZodObject<z.ZodRawShape> {
  return jsonSchemaToZod(tool.inputSchema);
}

// Tool registry
const tools: Tool[] = [
  {
    name: "health-check",
    description: "Check if the MCP server is running and connected properly",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "list-game-data",
    description: "List all available game data types in the RPG Maker project (enemies, items, actors, etc.)",
    inputSchema: {
      type: "object" as const,
      properties: {
        data_type: {
          type: "string",
          enum: ["Actors","Classes","Skills","Items","Weapons","Armors","Enemies","Troops","States","Animations","Tilesets","Maps","CommonEvents"],
          description: "Type of game data to list",
        },
      },
      required: ["data_type"],
    },
  },
  EditActorTool,
  EditItemTool,
  EditEnemyTool,
  CreatePluginTool,
  AddDialogueTool,
  CreatePluginAdvancedTool,
  CreateDialogueTool,
  CreateMapEventTool,
  StoryGeneratorTool,
  SetupDebugPluginTool,
  LaunchGameTool,
  StartEncounterTool,
  GetGameStateTool,
  SetSwitchTool,
  SetVariableTool,
  TeleportPlayerTool,
  SaveGameTool,
  LoadGameTool,
  SetPartyStateTool,
  RunBattleSuiteTool,
  EditWeaponTool,
  EditArmorTool,
  EditSkillTool,
  EditClassTool,
  EditStateTool,
  ReadMapTool,
  CreateMapTool,
  CreateTroopTool,
  EditTroopTool,
  CreateCommonEventTool,
  EditCommonEventTool,
  EditMapTool,
  EditSystemTool,
  ManageBackupsTool,
  BatchEditTool,
  ListMapsTool,
  DeleteMapTool,
  EditMapEventTool,
  DeleteMapEventTool,
  ManagePluginsTool,
  ReadEntityTool,
  ExecuteScriptTool,
  ShowMessageTool,
  EditTilesetTool,
  EditDropItemsTool,
  EditClassLearningsTool,
  EditVehicleTool,
  GetInventoryTool,
  ModifyInventoryTool,
  GetSwitchTool,
  GetVariableTool,
  CallCommonEventTool,
  ModifyActorRuntimeTool,
  ReadSystemExtendedTool,
  ReadMapTilesTool,
  PaintMapTilesTool,
  FillMapRegionTool,
  ReadTilesetTool,
  CreateTilesetTool,
  EditTilesetPropertiesTool,
  GenerateCharacterTool,
  EditTraitsTool,
  PaintMapRegionTool,
  EditTroopEventsTool,
  ListResourcesTool,
  EditEffectsTool,
  EditEventPageTool,
  EditPluginParametersTool,
  EditEnemyActionsTool,
  DeleteEntityTool,
  ReadAnimationTool,
  EditAnimationTool,
  {
    name: "get-change-history",
    description: "Read the MCP change log. Returns a newest-first list of all tool calls that modified RPG Maker project data.",
    inputSchema: { type: "object" as const, properties: {
      limit: { type: "integer", description: "Maximum number of entries to return (default 50)" },
      entity_type: { type: "string", description: "Filter by entity type" },
      tool: { type: "string", description: "Filter by tool name" },
      action: { type: "string", enum: ["create", "update", "delete"], description: "Filter by action" },
      since: { type: "string", description: "ISO 8601 datetime lower bound" },
    }},
  },
];

// Tool → handler routing (base from registry + batch-edit added here to avoid circular import)
const TOOL_HANDLERS: Record<string, (ctx: HandlerContext) => Promise<string>> = {
  ...BASE_TOOL_HANDLERS,
  "batch-edit": handleBatchEdit,
};

const debugBridge = new RPGMakerDebugBridge();
// changeLog is a singleton so all tool calls share the same log file
let changeLog: ChangeLog;

async function handleToolCall(toolName: string, toolInput: Record<string, unknown>): Promise<string> {
  logger.debug(`Tool called: ${toolName}`, toolInput);

  const handler = TOOL_HANDLERS[toolName];
  if (!handler) {
    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }

  const reader = new RPGMakerReader({ projectPath: RPGMAKER_PROJECT_PATH!, debug: DEBUG });
  const writer = new RPGMakerWriter({ projectPath: RPGMAKER_PROJECT_PATH!, createBackup: true, debug: DEBUG, maxBackups: MAX_BACKUPS });
  changeLog ??= new ChangeLog(RPGMAKER_PROJECT_PATH!);

  const ctx: HandlerContext = {
    reader,
    writer,
    input: toolInput,
    projectPath: RPGMAKER_PROJECT_PATH!,
    debugBridge,
    changeLog,
    debug: DEBUG,
  };

  try {
    return await handler(ctx);
  } catch (error) {
    logger.error("Tool execution error", error);
    return JSON.stringify({ error: (error as Error).message });
  }
}

async function main() {
  logger.info("=== RPG Maker MCP Server Starting ===");

  if (!validateSetup()) process.exit(1);

  const server = new McpServer({ name: "rpgmaker-mcp", version: "0.2.0" });

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: toolInputSchemaToZod(tool) },
      async (toolArgs) => {
        logger.debug("CallTool request", { name: tool.name, arguments: toolArgs });
        const result = await handleToolCall(tool.name, toolArgs || {});
        return { content: [{ type: "text" as const, text: result }] };
      },
    );
  }

  // HTTP bridge for game plugin communication
  const httpServer = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    const url = req.url || "/";

    if (req.method === "GET" && url === "/ping") {
      debugBridge.markConnected();
      const cmd = debugBridge.getCommand();
      if (cmd) { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(cmd)); }
      else { res.writeHead(204); res.end(); }
      return;
    }

    if (req.method === "POST" && (url === "/log" || url === "/state" || url === "/gamestate" || url === "/ack")) {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (url === "/log") {
            debugBridge.addEvent(data);
          } else if (url === "/state") {
            const state = data as BattleState;
            if (!state.inBattle || state.battleOver) debugBridge.setFinalState(state);
          } else if (url === "/gamestate") {
            debugBridge.setGameState(data as GameState);
          } else if (url === "/ack") {
            debugBridge.resolveAck();
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok" }));
        } catch {
          res.writeHead(400); res.end("{}");
        }
      });
      return;
    }

    res.writeHead(404); res.end();
  });

  httpServer.listen(BRIDGE_PORT, "127.0.0.1", () => {
    logger.info(`✓ Game bridge HTTP on port ${BRIDGE_PORT}`);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info("✓ MCP Server connected and ready");
  logger.info("Waiting for requests...");
}

main().catch((error) => {
  logger.error("Fatal error", error);
  process.exit(1);
});
