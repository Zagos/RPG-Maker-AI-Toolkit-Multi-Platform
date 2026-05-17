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
import { RPGMakerReader } from "./adapters/mz/reader.js";
import { RPGMakerWriter } from "./adapters/mz/writer.js";
import { MVReader } from "./adapters/mv/reader.js";
import { MVWriter } from "./adapters/mv/writer.js";
import { VXAceReader } from "./adapters/vxace/reader.js";
import { VXAceWriter } from "./adapters/vxace/writer.js";
import { VXReader } from "./adapters/vx/reader.js";
import { VXWriter } from "./adapters/vx/writer.js";
import { XPReader } from "./adapters/xp/reader.js";
import { XPWriter } from "./adapters/xp/writer.js";
import { RPGMakerDebugBridge } from "./adapters/mz/debug-bridge.js";
import type { BattleState, GameState } from "./adapters/mz/debug-bridge.js";
import { ChangeLog } from "./core/change-log.js";

// Tool definitions (internal — batch-edit only)
import { BatchEditTool } from "./adapters/mz/tools/batch-edit.js";

// Macro tool schemas + handlers (Phase A)
import { RuntimeControlTool } from "./macro/schemas/runtime-control.js";
import { RuntimeInspectTool } from "./macro/schemas/runtime-inspect.js";
import { handleRuntimeControl } from "./macro/handlers/runtime-control.js";
import { handleRuntimeInspect } from "./macro/handlers/runtime-inspect.js";

// Macro tool schemas + handlers (Phase B)
import { QueryDataTool } from "./macro/schemas/query-data.js";
import { GameEntityTool } from "./macro/schemas/game-entity.js";
import { handleQueryData } from "./macro/handlers/query-data.js";
import { handleGameEntity } from "./macro/handlers/game-entity.js";

// Macro tool schemas + handlers (Phase C)
import { GameMapTool } from "./macro/schemas/game-map.js";
import { DialogueToolsTool } from "./macro/schemas/dialogue-tools.js";
import { handleGameMap } from "./macro/handlers/game-map.js";
import { handleDialogueTools } from "./macro/handlers/dialogue-tools.js";

// Macro tool schemas + handlers (Phase D)
import { BattleSimTool } from "./macro/schemas/battle-sim.js";
import { ProjectToolsTool } from "./macro/schemas/project-tools.js";
import { handleBattleSim } from "./macro/handlers/battle-sim.js";
import { handleProjectTools } from "./macro/handlers/project-tools.js";

// Macro tool schemas + handlers (Phase E)
import { PluginManageTool } from "./macro/schemas/plugin-manage.js";
import { GameSetupTool } from "./macro/schemas/game-setup.js";
import { ManageBackupsMacroTool } from "./macro/schemas/manage-backups.js";
import { handlePluginManage } from "./macro/handlers/plugin-manage.js";
import { handleGameSetup } from "./macro/handlers/game-setup.js";
import { handleManageBackups } from "./macro/handlers/manage-backups.js";

// Handlers
import type { HandlerContext } from "./handlers/types.js";
import { TOOL_HANDLERS as BASE_TOOL_HANDLERS } from "./handlers/registry.js";
import { RUBY_RUNTIME_HANDLERS } from "./handlers/registry-ruby.js";
import { handleBatchEdit } from "./handlers/batch-edit.js";
import { RPGMakerRubyBridge } from "./adapters/ruby-bridge/tcp-bridge.js";

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
const RPGMAKER_ENGINE = (process.env.RPGMAKER_ENGINE || "mz").toLowerCase();
const SUPPORTED_ENGINES = ["mz", "mv", "vxace", "vx", "xp"] as const;
type SupportedEngine = typeof SUPPORTED_ENGINES[number];
const DEBUG = process.env.MCP_DEBUG === "true";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const BRIDGE_PORT      = 9001;
const RUBY_BRIDGE_PORT = parseInt(process.env.RUBY_BRIDGE_PORT || "9002", 10);
const MAX_BACKUPS      = parseInt(process.env.BACKUP_MAX_COUNT || "10", 10);

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
  if (!SUPPORTED_ENGINES.includes(RPGMAKER_ENGINE as SupportedEngine)) {
    logger.error(`RPGMAKER_ENGINE="${RPGMAKER_ENGINE}" is not yet supported. Supported: ${SUPPORTED_ENGINES.join(", ")}`);
    return false;
  }
  const dataPath = path.join(RPGMAKER_PROJECT_PATH, "data");
  if (!fs.existsSync(dataPath)) {
    logger.error(`RPG Maker data directory not found at: ${dataPath}. Is this a valid RPG Maker ${RPGMAKER_ENGINE.toUpperCase()} project?`);
    return false;
  }
  logger.info(`✓ RPG Maker ${RPGMAKER_ENGINE.toUpperCase()} project found at: ${RPGMAKER_PROJECT_PATH}`);
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
  // Phase A macros
  RuntimeControlTool,
  RuntimeInspectTool,
  // Phase B macros
  QueryDataTool,
  GameEntityTool,
  // Phase C macros
  GameMapTool,
  DialogueToolsTool,
  // Phase D macros
  BattleSimTool,
  ProjectToolsTool,
  // Phase E macros
  PluginManageTool,
  GameSetupTool,
  ManageBackupsMacroTool,
  // escape hatch
  BatchEditTool,
];

// Tool → handler routing (base from registry + macro handlers + batch-edit added here to avoid circular import)
const TOOL_HANDLERS: Record<string, (ctx: HandlerContext) => Promise<string>> = {
  ...BASE_TOOL_HANDLERS,
  "batch-edit": handleBatchEdit,
  "runtime-control": handleRuntimeControl,
  "runtime-inspect": handleRuntimeInspect,
  "query-data": handleQueryData,
  "game-entity": handleGameEntity,
  "game-map": handleGameMap,
  "dialogue-tools": handleDialogueTools,
  "battle-sim": handleBattleSim,
  "project-tools": handleProjectTools,
  "plugin-manage": handlePluginManage,
  "game-setup": handleGameSetup,
  "manage-backups": handleManageBackups,
};

// batch-edit still accepts internal tool names directly — guard those in case someone uses it
// with a Ruby-unsupported tool on a Ruby engine.
const RUBY_UNSUPPORTED_TOOLS = new Set<string>([
  "create-plugin", "create-plugin-advanced", "manage-plugins",
  "edit-plugin-parameters", "reorder-plugin",
  "run-battle-suite",
]);

const RUBY_ONLY_TOOLS = new Set<string>([
  "list-scripts", "read-script", "create-script", "edit-script", "delete-script",
]);

const RUBY_ENGINE_NAMES: Record<string, string> = {
  vxace: "VX Ace",
  vx: "VX",
  xp: "XP",
};

// Macros/tools that build event commands — append a Ruby compatibility note on success.
const RUBY_EVENT_CMD_TOOLS = new Set<string>([
  "dialogue-tools", "game-map",
  // internal names (still reachable via batch-edit)
  "create-map-event", "edit-map-event", "edit-event-page",
  "add-dialogue", "create-dialogue-advanced", "import-dialogue",
  "export-dialogue", "story-generator", "edit-troop-events",
]);

const debugBridge = new RPGMakerDebugBridge();
const rubyBridge  = new RPGMakerRubyBridge(RUBY_BRIDGE_PORT);
// changeLog is a singleton so all tool calls share the same log file
let changeLog: ChangeLog;

async function handleToolCall(toolName: string, toolInput: Record<string, unknown>): Promise<string> {
  logger.debug(`Tool called: ${toolName}`, toolInput);

  const isRubyEngine = RPGMAKER_ENGINE in RUBY_ENGINE_NAMES;

  // For Ruby engines, prefer the Ruby-specific handler if one exists
  const handler = (isRubyEngine && RUBY_RUNTIME_HANDLERS[toolName])
    ? RUBY_RUNTIME_HANDLERS[toolName]
    : TOOL_HANDLERS[toolName];

  if (!handler) {
    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }

  if (isRubyEngine && RUBY_UNSUPPORTED_TOOLS.has(toolName)) {
    const engineLabel = RUBY_ENGINE_NAMES[RPGMAKER_ENGINE];
    return JSON.stringify({
      error: `Tool '${toolName}' is not available for RPG Maker ${engineLabel}. This tool requires RPG Maker MZ or MV.`,
    });
  }

  if (!isRubyEngine && RUBY_ONLY_TOOLS.has(toolName)) {
    return JSON.stringify({
      error: `Tool '${toolName}' is only available for Ruby engine projects (VX Ace, VX, XP). Use plugin tools for RPG Maker MZ/MV.`,
    });
  }

  const readerOpts = { projectPath: RPGMAKER_PROJECT_PATH!, debug: DEBUG };
  const writerOpts = { projectPath: RPGMAKER_PROJECT_PATH!, createBackup: true, debug: DEBUG, maxBackups: MAX_BACKUPS };
  let reader;
  let writer;
  if (RPGMAKER_ENGINE === "vxace") {
    reader = new VXAceReader(readerOpts);
    writer = new VXAceWriter(writerOpts);
  } else if (RPGMAKER_ENGINE === "vx") {
    reader = new VXReader(readerOpts);
    writer = new VXWriter(writerOpts);
  } else if (RPGMAKER_ENGINE === "xp") {
    reader = new XPReader(readerOpts);
    writer = new XPWriter(writerOpts);
  } else if (RPGMAKER_ENGINE === "mv") {
    reader = new MVReader(readerOpts);
    writer = new MVWriter(writerOpts);
  } else {
    reader = new RPGMakerReader(readerOpts);
    writer = new RPGMakerWriter(writerOpts);
  }
  changeLog ??= new ChangeLog(RPGMAKER_PROJECT_PATH!);

  const ctx: HandlerContext = {
    reader,
    writer,
    input: toolInput,
    projectPath: RPGMAKER_PROJECT_PATH!,
    engine: RPGMAKER_ENGINE,
    debugBridge,
    rubyBridge,
    changeLog,
    debug: DEBUG,
  };

  try {
    let result = await handler(ctx);
    if (RPGMAKER_ENGINE in RUBY_ENGINE_NAMES && RUBY_EVENT_CMD_TOOLS.has(toolName)) {
      try {
        const parsed = JSON.parse(result) as Record<string, unknown>;
        if (!parsed.error) {
          const engineLabel = RUBY_ENGINE_NAMES[RPGMAKER_ENGINE];
          parsed._engine_note = `Event command codes are compatible with RPG Maker ${engineLabel}. Note: show-picture has fewer parameters than MZ; animation IDs reference the classic frame-based format, not Effekseer.`;
          result = JSON.stringify(parsed);
        }
      } catch { /* leave result unchanged if not valid JSON */ }
    }
    return result;
  } catch (error) {
    logger.error("Tool execution error", error);
    return JSON.stringify({ error: (error as Error).message });
  }
}

async function main() {
  logger.info("=== RPG Maker MCP Server Starting ===");

  if (!validateSetup()) process.exit(1);

  const server = new McpServer({ name: "rpgmaker-mcp", version: "1.0.0" });

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
