#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as fs from "fs";
import * as path from "path";
import { z, type ZodTypeAny } from "zod";

// Import utilities
import { RPGMakerReader } from "./rpgmaker/reader.js";
import { RPGMakerWriter } from "./rpgmaker/writer.js";
import { RPGMakerValidator } from "./rpgmaker/validator.js";
import type {
  RPGDataType,
  RPGEventCommand,
  RPGEventPage,
  RPGMapEvent,
} from "./types/rpgmaker.js";

// Import tool definitions
import { EditActorTool } from "./tools/edit-actor.js";
import { EditItemTool } from "./tools/edit-item.js";
import { EditEnemyTool } from "./tools/edit-enemy.js";
import { CreatePluginTool } from "./tools/create-plugin.js";
import { AddDialogueTool } from "./tools/add-dialogue.js";
import { CreatePluginAdvancedTool } from "./tools/create-plugin-advanced.js";
import { CreateDialogueTool } from "./tools/create-dialogue-advanced.js";
import { CreateMapEventTool } from "./tools/create-map-event.js";
import { StoryGeneratorTool } from "./tools/story-generator.js";

// Import templates
import { PluginTemplates } from "./templates/plugin-template.js";

function loadEnvFile(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

// Environment variables
const RPGMAKER_PROJECT_PATH = process.env.RPGMAKER_PROJECT_PATH;
const DEBUG = process.env.MCP_DEBUG === "true";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// Logger utility
const logger = {
  debug: (msg: string, data?: unknown) => {
    if (LOG_LEVEL === "debug" || DEBUG) {
      console.error(`[DEBUG] ${msg}`, data ? JSON.stringify(data, null, 2) : "");
    }
  },
  info: (msg: string, data?: unknown) => {
    console.error(
      `[INFO] ${msg}`,
      data ? JSON.stringify(data, null, 2) : ""
    );
  },
  warn: (msg: string, data?: unknown) => {
    console.error(
      `[WARN] ${msg}`,
      data ? JSON.stringify(data, null, 2) : ""
    );
  },
  error: (msg: string, data?: unknown) => {
    console.error(
      `[ERROR] ${msg}`,
      data ? JSON.stringify(data, null, 2) : ""
    );
  },
};

// Validate setup
function validateSetup(): boolean {
  if (!RPGMAKER_PROJECT_PATH) {
    logger.error(
      "RPGMAKER_PROJECT_PATH is not set. Please configure .env file."
    );
    return false;
  }

  if (!fs.existsSync(RPGMAKER_PROJECT_PATH)) {
    logger.error(
      `RPG Maker project path does not exist: ${RPGMAKER_PROJECT_PATH}`
    );
    return false;
  }

  const dataPath = path.join(RPGMAKER_PROJECT_PATH, "data");
  if (!fs.existsSync(dataPath)) {
    logger.error(
      `RPG Maker data directory not found at: ${dataPath}. Is this a valid RPG Maker MZ project?`
    );
    return false;
  }

  logger.info(`✓ RPG Maker project found at: ${RPGMAKER_PROJECT_PATH}`);
  return true;
}

type DialogueChoiceInput = {
  text: string;
  next_node?: string;
  nextNode?: string;
  condition?: string;
  action?: string;
};

type DialogueNodeInput = {
  node_id?: string;
  nodeId?: string;
  speaker: string;
  text: string;
  choices?: DialogueChoiceInput[];
  actions?: string[];
  end_dialogue?: boolean;
  endDialogue?: boolean;
};

type MapEventCommandInput = {
  type: "message" | "choice" | "wait" | "transfer" | "script" | "switch" | "variable" | "common-event" | "battle" | "animation";
  data?: string;
};

type JsonSchemaProperty = {
  type?: string;
  enum?: unknown[];
  description?: string;
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  required?: string[];
};

type JsonObjectSchema = JsonSchemaProperty & {
  type: "object";
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
};

const RPG_DATA_TYPES = [
  "Actors",
  "Classes",
  "Skills",
  "Items",
  "Weapons",
  "Armors",
  "Enemies",
  "Troops",
  "States",
  "Animations",
  "Tilesets",
  "Maps",
  "CommonEvents",
] as const satisfies readonly RPGDataType[];

function isRpgDataType(value: unknown): value is RPGDataType {
  return typeof value === "string" && RPG_DATA_TYPES.includes(value as RPGDataType);
}

function describeSchema<T extends ZodTypeAny>(
  schema: T,
  description?: string
): T {
  return description ? schema.describe(description) : schema;
}

function jsonSchemaPropertyToZod(schema: JsonSchemaProperty): ZodTypeAny {
  let zodSchema: ZodTypeAny;

  if (schema.enum && schema.enum.length > 0) {
    zodSchema = z.enum(schema.enum.map(String) as [string, ...string[]]);
  } else {
    switch (schema.type) {
      case "number":
      case "integer":
        zodSchema = z.number();
        break;
      case "boolean":
        zodSchema = z.boolean();
        break;
      case "array":
        zodSchema = z.array(
          schema.items ? jsonSchemaPropertyToZod(schema.items) : z.unknown()
        );
        break;
      case "object":
        zodSchema = jsonSchemaToZod(schema as JsonObjectSchema);
        break;
      case "string":
        zodSchema = z.string();
        break;
      default:
        zodSchema = z.unknown();
    }
  }

  return describeSchema(zodSchema, schema.description);
}

function jsonSchemaToZod(schema: JsonObjectSchema): z.ZodObject<z.ZodRawShape> {
  const required = new Set(schema.required || []);
  const shape: Record<string, ZodTypeAny> = {};

  for (const [name, property] of Object.entries(schema.properties || {})) {
    const propertySchema = jsonSchemaPropertyToZod(property);
    shape[name] = required.has(name) ? propertySchema : propertySchema.optional();
  }

  return z.object(shape);
}

function toolInputSchemaToZod(tool: Tool): z.ZodObject<z.ZodRawShape> {
  return jsonSchemaToZod(tool.inputSchema);
}

function safeDataName(value: string): string {
  return value
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "Generated";
}

function textCommands(text: string, speaker = ""): RPGEventCommand[] {
  const lines = text.split(/\r?\n/).flatMap((line) => {
    if (line.length <= 60) return [line];
    const chunks: string[] = [];
    for (let index = 0; index < line.length; index += 60) {
      chunks.push(line.slice(index, index + 60));
    }
    return chunks;
  });

  return [
    { code: 101, indent: 0, parameters: ["", 0, 0, 2, speaker] },
    ...lines.map((line) => ({ code: 401, indent: 0, parameters: [line] })),
  ];
}

function actionCommands(action?: string): RPGEventCommand[] {
  if (!action) return [];

  const [command, ...args] = action.split(":");

  switch (command) {
    case "setSwitch":
      return [
        {
          code: 121,
          indent: 0,
          parameters: [Number(args[0]), Number(args[0]), args[1] === "false" ? 1 : 0],
        },
      ];
    case "setVariable":
      return [
        {
          code: 122,
          indent: 0,
          parameters: [Number(args[0]), Number(args[0]), 0, 0, Number(args[1]) || 0],
        },
      ];
    case "addItem":
      return [
        {
          code: 126,
          indent: 0,
          parameters: [Number(args[0]), 0, 0, Number(args[1]) || 1],
        },
      ];
    case "addGold":
      return [{ code: 125, indent: 0, parameters: [0, 0, Number(args[0]) || 0] }];
    case "commonEvent":
      return [{ code: 117, indent: 0, parameters: [Number(args[0])] }];
    case "script":
      return scriptCommands(args.join(":"));
    default:
      return [{ code: 108, indent: 0, parameters: [`Unsupported action: ${action}`] }];
  }
}

function scriptCommands(script: string): RPGEventCommand[] {
  const lines = script.split(/\r?\n/);
  return lines.map((line, index) => ({
    code: index === 0 ? 355 : 655,
    indent: 0,
    parameters: [line],
  }));
}

function commandInputToEventCommands(command: MapEventCommandInput): RPGEventCommand[] {
  const data = command.data || "";

  switch (command.type) {
    case "message":
      return textCommands(data);
    case "choice": {
      const choices = data.split("|").map((choice) => choice.trim()).filter(Boolean);
      return [
        { code: 102, indent: 0, parameters: [choices, 0, -1, 2, 0] },
        ...choices.flatMap((choice, index) => [
          { code: 402, indent: 0, parameters: [index, choice] },
        ]),
        { code: 404, indent: 0, parameters: [] },
      ];
    }
    case "wait":
      return [{ code: 230, indent: 0, parameters: [Number(data) || 60] }];
    case "transfer": {
      const [mapId, x, y, direction = "2", fade = "0"] = data.split(":");
      return [
        {
          code: 201,
          indent: 0,
          parameters: [0, Number(mapId), Number(x), Number(y), Number(direction), Number(fade)],
        },
      ];
    }
    case "script":
      return scriptCommands(data);
    case "switch":
    case "variable":
    case "common-event":
      return actionCommands(`${command.type === "switch" ? "setSwitch" : command.type === "variable" ? "setVariable" : "commonEvent"}:${data}`);
    case "battle":
      return [{ code: 301, indent: 0, parameters: [0, Number(data), true, false] }];
    case "animation":
      return [{ code: 212, indent: 0, parameters: [0, Number(data), true] }];
    default:
      return [];
  }
}

function defaultEventPage(overrides: Partial<RPGEventPage> = {}): RPGEventPage {
  return {
    conditions: {
      actorId: 1,
      actorValid: false,
      itemId: 1,
      itemValid: false,
      selfSwitchCh: "A",
      selfSwitchValid: false,
      switch1Id: 1,
      switch1Valid: false,
      switch2Id: 1,
      switch2Valid: false,
      variableId: 1,
      variableValid: false,
      variableValue: 0,
    },
    directionFix: false,
    image: {
      characterIndex: 0,
      characterName: "",
      direction: 2,
      pattern: 0,
      tileId: 0,
    },
    moveFrequency: 3,
    moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
    moveSpeed: 3,
    moveType: 0,
    priorityType: 1,
    stepAnime: false,
    through: false,
    trigger: 0,
    walkAnime: true,
    list: [{ code: 0, indent: 0, parameters: [] }],
    ...overrides,
  };
}

function createDialogueEventCommands(nodes: DialogueNodeInput[]): RPGEventCommand[] {
  const commands: RPGEventCommand[] = [];

  for (const node of nodes) {
    const nodeId = node.node_id || node.nodeId || "node";
    commands.push({ code: 118, indent: 0, parameters: [nodeId] });
    commands.push(...textCommands(node.text, node.speaker));

    for (const action of node.actions || []) {
      commands.push(...actionCommands(action));
    }

    const choices = node.choices || [];
    if (choices.length > 0) {
      commands.push({
        code: 102,
        indent: 0,
        parameters: [choices.map((choice) => choice.text), 0, -1, 2, 0],
      });

      choices.forEach((choice, index) => {
        const nextNode = choice.next_node || choice.nextNode;
        commands.push({ code: 402, indent: 0, parameters: [index, choice.text] });
        if (choice.condition) {
          commands.push({ code: 108, indent: 1, parameters: [`Choice condition: ${choice.condition}`] });
        }
        commands.push(...actionCommands(choice.action).map((cmd) => ({ ...cmd, indent: 1 })));
        if (nextNode) {
          commands.push({ code: 119, indent: 1, parameters: [nextNode] });
        }
      });
      commands.push({ code: 404, indent: 0, parameters: [] });
    } else if (!(node.end_dialogue || node.endDialogue)) {
      commands.push({ code: 115, indent: 0, parameters: [] });
    }
  }

  commands.push({ code: 0, indent: 0, parameters: [] });
  return commands;
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: "health-check",
    description: "Check if the MCP server is running and connected properly",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "list-game-data",
    description:
      "List all available game data types in the RPG Maker project (enemies, items, actors, etc.)",
    inputSchema: {
      type: "object" as const,
      properties: {
        data_type: {
          type: "string",
          enum: [
            "Actors",
            "Classes",
            "Skills",
            "Items",
            "Weapons",
            "Armors",
            "Enemies",
            "Troops",
            "States",
            "Animations",
            "Tilesets",
            "Maps",
            "CommonEvents",
          ],
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
];

// Handle tool calls
function handleToolCall(
  toolName: string,
  toolInput: Record<string, unknown>
): string {
  logger.debug(`Tool called: ${toolName}`, toolInput);

  try {
    // Initialize reader/writer
    const reader = new RPGMakerReader({
      projectPath: RPGMAKER_PROJECT_PATH!,
      debug: DEBUG,
    });

    const writer = new RPGMakerWriter({
      projectPath: RPGMAKER_PROJECT_PATH!,
      createBackup: true,
      debug: DEBUG,
    });

    switch (toolName) {
      case "health-check":
        return JSON.stringify({
          status: "ok",
          rpgmaker_path: RPGMAKER_PROJECT_PATH,
          debug_mode: DEBUG,
          timestamp: new Date().toISOString(),
        });

      case "list-game-data": {
        const dataType = toolInput.data_type;
        if (!isRpgDataType(dataType)) {
          return JSON.stringify({
            error: "Invalid data_type",
            allowed_values: RPG_DATA_TYPES,
          });
        }

        const info = reader.getDataInfo(dataType);

        return JSON.stringify({
          success: true,
          data_type: dataType,
          count: info.count,
          preview: info.preview,
        });
      }

      case "edit-actor": {
        const actorId = toolInput.actor_id as number | undefined;
        const name = toolInput.name as string;
        const nickname = toolInput.nickname as string | undefined;
        const classId = toolInput.class_id as number | undefined;
        const initialLevel = toolInput.initial_level as number | undefined;
        const maxLevel = toolInput.max_level as number | undefined;

        const actorData = {
          name,
          nickname: nickname || "",
          classId: classId || 1,
          initialLevel: initialLevel || 1,
          maxLevel: maxLevel || 99,
        };

        const validation = RPGMakerValidator.validateActor(actorData);
        if (!validation.valid) {
          return JSON.stringify({
            error: "Validation failed",
            errors: validation.errors,
          });
        }

        try {
          if (actorId) {
            writer.updateActor(actorId, actorData);
            return JSON.stringify({
              success: true,
              message: `Actor ${actorId} updated`,
              actor_id: actorId,
            });
          } else {
            const newId = writer.addActor(actorData);
            return JSON.stringify({
              success: true,
              message: `Actor created`,
              actor_id: newId,
            });
          }
        } catch (error) {
          return JSON.stringify({
            error: (error as Error).message,
          });
        }
      }

      case "edit-item": {
        const itemId = toolInput.item_id as number | undefined;
        const name = toolInput.name as string;
        const description = toolInput.description as string | undefined;
        const price = toolInput.price as number | undefined;

        const itemData = {
          name,
          description: description || "",
          price: price || 0,
        };

        const validation = RPGMakerValidator.validateItem(itemData);
        if (!validation.valid) {
          return JSON.stringify({
            error: "Validation failed",
            errors: validation.errors,
          });
        }

        try {
          if (itemId) {
            writer.updateItem(itemId, itemData);
            return JSON.stringify({
              success: true,
              message: `Item ${itemId} updated`,
              item_id: itemId,
            });
          } else {
            const newId = writer.addItem(itemData);
            return JSON.stringify({
              success: true,
              message: `Item created`,
              item_id: newId,
            });
          }
        } catch (error) {
          return JSON.stringify({
            error: (error as Error).message,
          });
        }
      }

      case "edit-enemy": {
        const enemyId = toolInput.enemy_id as number | undefined;
        const name = toolInput.name as string;
        const gold = toolInput.gold as number | undefined;
        const exp = toolInput.exp as number | undefined;

        const enemyData = {
          name,
          gold: gold || 0,
          exp: exp || 0,
        };

        const validation = RPGMakerValidator.validateEnemy(enemyData);
        if (!validation.valid) {
          return JSON.stringify({
            error: "Validation failed",
            errors: validation.errors,
          });
        }

        try {
          if (enemyId) {
            writer.updateEnemy(enemyId, enemyData);
            return JSON.stringify({
              success: true,
              message: `Enemy ${enemyId} updated`,
              enemy_id: enemyId,
            });
          } else {
            const newId = writer.addEnemy(enemyData);
            return JSON.stringify({
              success: true,
              message: `Enemy created`,
              enemy_id: newId,
            });
          }
        } catch (error) {
          return JSON.stringify({
            error: (error as Error).message,
          });
        }
      }

      case "create-plugin": {
        const pluginName = toolInput.plugin_name as string;
        const description = toolInput.description as string;
        const author = toolInput.author as string | undefined;
        const version = toolInput.version as string | undefined;
        const codeType = toolInput.code_type as string;

        // Generate plugin code template
        const pluginCode = generatePluginCode(
          pluginName,
          description,
          author || "Unknown",
          version || "1.0.0",
          codeType || "empty"
        );

        const validation = RPGMakerValidator.validateJavaScript(pluginCode);
        if (!validation.valid) {
          return JSON.stringify({
            error: "Plugin code validation failed",
            errors: validation.errors,
          });
        }

        try {
          const rawFilename = `${pluginName}.js`;
          const filename = rawFilename.replace(/\.js+$/i, ".js");
          writer.writePlugin(filename, pluginCode);

          // Ensure plugins.js registry entry updated with metadata
          try {
            writer.updatePluginsRegistry({
              name: filename.replace(/\.js$/i, ""),
              status: true,
              description: description || "",
              parameters: {},
            });
          } catch (err) {
            logger.warn("Failed to update plugins registry metadata", err);
          }

          return JSON.stringify({
            success: true,
            message: `Plugin created`,
            filename: filename,
            path: path.join(RPGMAKER_PROJECT_PATH!, "js", "plugins", filename),
          });
        } catch (error) {
          return JSON.stringify({
            error: (error as Error).message,
          });
        }
      }

      case "add-dialogue": {
        const dialogueLines = toolInput.dialogue_lines as Array<{
          speaker?: string;
          text: string;
        }>;
        const eventName = toolInput.event_name as string | undefined;

        if (!Array.isArray(dialogueLines) || dialogueLines.length === 0) {
          return JSON.stringify({
            error: "dialogue_lines must be a non-empty array",
          });
        }

        try {
          const eventData = {
            name: eventName || "Dialogue",
            pages: [
              {
                conditions: {
                  actorId: 1,
                  actorValid: false,
                  itemId: 1,
                  itemValid: false,
                  selfSwitchCh: "A",
                  selfSwitchValid: false,
                  switch1Id: 1,
                  switch1Valid: false,
                  switch2Id: 1,
                  switch2Valid: false,
                  variableId: 1,
                  variableValid: false,
                  variableValue: 0,
                },
                directionFix: false,
                image: {
                  characterIndex: 0,
                  characterName: "",
                  direction: 2,
                  pattern: 0,
                  tileId: 0,
                },
                moveFrequency: 0,
                moveRoute: { list: [], repeat: true, skippable: true, wait: false },
                moveSpeed: 0,
                moveType: 0,
                priorityType: 1,
                stepAnime: false,
                through: false,
                trigger: 0,
                walkAnime: false,
                list: dialogueLines.map(() => ({
                  code: 101,
                  indent: 0,
                  parameters: [0, 0, 0, 1],
                })),
              },
            ],
          };

          const newId = writer.addCommonEvent(eventData);

          return JSON.stringify({
            success: true,
            message: `Dialogue event created`,
            event_id: newId,
            lines_count: dialogueLines.length,
          });
        } catch (error) {
          return JSON.stringify({
            error: (error as Error).message,
          });
        }
      }

      case "create-plugin-advanced": {
        const pluginName = toolInput.plugin_name as string;
        const description = toolInput.description as string;
        const author = toolInput.author as string | undefined;
        const version = toolInput.version as string | undefined;
        const templateType = toolInput.template_type as string;
        const parameters = toolInput.parameters as Array<{
          name: string;
          type: string;
          default: string;
          description: string;
        }> | undefined;

        let pluginCode: string;

        try {
          switch (templateType) {
            case "with-parameters":
              pluginCode = PluginTemplates.withParameters(
                pluginName,
                description,
                author || "Unknown",
                version || "1.0.0",
                parameters || []
              );
              break;
            case "game-actor":
              pluginCode = PluginTemplates.gameActorExtension(
                pluginName,
                description,
                author || "Unknown",
                version || "1.0.0"
              );
              break;
            case "game-enemy":
              pluginCode = PluginTemplates.gameEnemyExtension(
                pluginName,
                description,
                author || "Unknown",
                version || "1.0.0"
              );
              break;
            case "event-handler":
              pluginCode = PluginTemplates.eventHandler(
                pluginName,
                description,
                author || "Unknown",
                version || "1.0.0"
              );
              break;
            case "custom-ui":
              pluginCode = PluginTemplates.customUI(
                pluginName,
                description,
                author || "Unknown",
                version || "1.0.0"
              );
              break;
            default:
              return JSON.stringify({
                error: `Unknown template type: ${templateType}`,
              });
          }

          const validation = RPGMakerValidator.validateJavaScript(pluginCode);
          if (!validation.valid) {
            return JSON.stringify({
              error: "Plugin validation failed",
              errors: validation.errors,
            });
          }

          const filename = `${pluginName}.js`;
          writer.writePlugin(filename, pluginCode);

          // Ensure plugins.js registry entry updated with metadata
          try {
            writer.updatePluginsRegistry({
              name: filename.replace(/\.js$/i, ""),
              status: true,
              description: description || "",
              parameters: {},
            });
          } catch (err) {
            logger.warn("Failed to update plugins registry metadata", err);
          }

          return JSON.stringify({
            success: true,
            message: `Advanced plugin created with template: ${templateType}`,
            filename: filename,
            lines: pluginCode.split("\n").length,
          });
        } catch (error) {
          return JSON.stringify({
            error: (error as Error).message,
          });
        }
      }

      case "create-dialogue-advanced": {
        const dialogueName = toolInput.dialogue_name as string;
        const dialogueNodes = toolInput.dialogue_nodes as DialogueNodeInput[];

        if (!Array.isArray(dialogueNodes) || dialogueNodes.length === 0) {
          return JSON.stringify({
            error: "dialogue_nodes must be a non-empty array",
          });
        }

        try {
          const normalizedNodes = dialogueNodes.map((node) => ({
            nodeId: node.node_id || node.nodeId,
            speaker: node.speaker,
            text: node.text,
            choices: (node.choices || []).map((choice) => ({
              text: choice.text,
              nextNode: choice.next_node || choice.nextNode,
              condition: choice.condition,
              action: choice.action,
            })),
            actions: node.actions || [],
            endDialogue: node.end_dialogue || node.endDialogue || false,
          }));

          const dialogueData = {
            name: dialogueName,
            nodes: normalizedNodes,
            startNodeId: normalizedNodes[0].nodeId,
            includeJournal: toolInput.include_journal !== false,
            createdAt: new Date().toISOString(),
          };

          const commonEventId = writer.addCommonEvent({
            name: dialogueName,
            trigger: 0,
            switchId: 1,
            list: createDialogueEventCommands(dialogueNodes),
          });

          const dialogueFilename = `Dialogue_${safeDataName(
            (toolInput.script_name as string | undefined) || dialogueName
          )}.json`;
          writer.writeDataFile(dialogueFilename, dialogueData, false);

          return JSON.stringify({
            success: true,
            message: `Branching dialogue system created`,
            dialogue_name: dialogueName,
            nodes_count: dialogueNodes.length,
            common_event_id: commonEventId,
            file: path.join(RPGMAKER_PROJECT_PATH!, "data", dialogueFilename),
          });
        } catch (error) {
          return JSON.stringify({
            error: (error as Error).message,
          });
        }
      }

      case "create-map-event": {
        const mapId = toolInput.map_id as number;
        const eventName = toolInput.event_name as string;
        const x = toolInput.x as number;
        const y = toolInput.y as number;
        const eventType = toolInput.event_type as string;
        const character = toolInput.character as
          | { name?: string; index?: number }
          | undefined;
        const pages = toolInput.pages as
          | Array<{
              move_type?: "fixed" | "random" | "approach" | "custom";
              move_speed?: number;
              commands?: MapEventCommandInput[];
            }>
          | undefined;
        const treasure = toolInput.treasure as
          | { item_type?: "item" | "weapon" | "armor"; item_id?: number; quantity?: number }
          | undefined;
        const dialogue = toolInput.dialogue as string | undefined;

        try {
          const mapData = reader.readMap(mapId);
          if (!mapData) {
            return JSON.stringify({
              error: `Map ${mapId} not found`,
            });
          }

          const existingEvents = (mapData.events || []).filter(
            (event): event is RPGMapEvent => Boolean(event)
          );
          const newEventId =
            existingEvents.length > 0
              ? Math.max(...existingEvents.map((event) => event.id)) + 1
              : 1;

          const generatedPages = (pages && pages.length > 0 ? pages : [{}]).map((page) => {
            const commands: RPGEventCommand[] = [];

            if (dialogue) {
              commands.push(...textCommands(dialogue, eventName));
            }

            if (eventType === "chest" && treasure?.item_id) {
              const kind = treasure.item_type === "weapon" ? 127 : treasure.item_type === "armor" ? 128 : 126;
              commands.push({ code: kind, indent: 0, parameters: [treasure.item_id, 0, 0, treasure.quantity || 1] });
              commands.push(...textCommands(`Obtained x${treasure.quantity || 1}.`));
              commands.push({ code: 123, indent: 0, parameters: ["A", 0] });
            }

            for (const command of page.commands || []) {
              commands.push(...commandInputToEventCommands(command));
            }

            commands.push({ code: 0, indent: 0, parameters: [] });

            const moveTypeMap = { fixed: 0, random: 1, approach: 2, custom: 3 };
            return defaultEventPage({
              image: {
                characterIndex: character?.index || 0,
                characterName: character?.name || "",
                direction: 2,
                pattern: 0,
                tileId: 0,
              },
              moveSpeed: page.move_speed || 3,
              moveType: moveTypeMap[page.move_type || "fixed"],
              priorityType: eventType === "trigger" ? 0 : 1,
              trigger: eventType === "trigger" ? 1 : 0,
              list: commands,
            });
          });

          const newEvent: RPGMapEvent = {
            id: newEventId,
            name: eventName,
            note: `Type: ${eventType}`,
            pages: generatedPages,
            x,
            y,
          };

          if (!mapData.events) {
            mapData.events = [];
          }
          mapData.events.push(newEvent);
          writer.writeMap(mapId, mapData);

          return JSON.stringify({
            success: true,
            message: `Map event created`,
            event_id: newEventId,
            map_id: mapId,
            event_name: eventName,
            pages_count: generatedPages.length,
          });
        } catch (error) {
          return JSON.stringify({
            error: (error as Error).message,
          });
        }
      }

      case "story-generator": {
        const storyTitle = toolInput.story_title as string;
        const storyDescription = toolInput.story_description as string;
        const scenes = toolInput.scenes as Array<{
          scene_id: string;
          scene_name: string;
          map_id?: number;
          events: Array<{
            event_id: string;
            type: "dialogue" | "battle" | "choice" | "animation" | "transfer";
            content: string;
            prerequisites?: string[];
          }>;
          branches?: Array<{ condition: string; next_scene: string }>;
        }>;

        if (!Array.isArray(scenes) || scenes.length === 0) {
          return JSON.stringify({
            error: "scenes must be a non-empty array",
          });
        }

        try {
          const generatedCommonEvents: Array<{
            scene_id: string;
            scene_name: string;
            common_event_id: number;
          }> = [];

          for (const scene of scenes) {
            const commands: RPGEventCommand[] = [];
            commands.push(...textCommands(scene.scene_name, storyTitle));

            for (const event of scene.events) {
              if (event.prerequisites && event.prerequisites.length > 0) {
                commands.push({
                  code: 108,
                  indent: 0,
                  parameters: [`Prerequisites: ${event.prerequisites.join(", ")}`],
                });
              }

              switch (event.type) {
                case "dialogue":
                  commands.push(...textCommands(event.content));
                  break;
                case "battle":
                  commands.push({ code: 301, indent: 0, parameters: [0, Number(event.content), true, false] });
                  break;
                case "choice":
                  commands.push(...commandInputToEventCommands({ type: "choice", data: event.content }));
                  break;
                case "animation":
                  commands.push({ code: 212, indent: 0, parameters: [0, Number(event.content), true] });
                  break;
                case "transfer": {
                  const [mapId, x, y] = event.content.split(":");
                  commands.push({ code: 201, indent: 0, parameters: [0, Number(mapId), Number(x), Number(y), 2, 0] });
                  break;
                }
              }
            }

            for (const branch of scene.branches || []) {
              commands.push({
                code: 108,
                indent: 0,
                parameters: [`Branch if ${branch.condition}: ${branch.next_scene}`],
              });
            }

            commands.push({ code: 0, indent: 0, parameters: [] });

            const commonEventId = writer.addCommonEvent({
              name: `${storyTitle} - ${scene.scene_name}`,
              trigger: 0,
              switchId: 1,
              list: commands,
            });

            generatedCommonEvents.push({
              scene_id: scene.scene_id,
              scene_name: scene.scene_name,
              common_event_id: commonEventId,
            });
          }

          const storyData = {
            title: storyTitle,
            description: storyDescription,
            scenes: scenes,
            theme: toolInput.theme || "adventure",
            difficulty: toolInput.difficulty || "normal",
            targetLength: toolInput.target_length || null,
            generatedCommonEvents,
            currentSceneId: scenes[0].scene_id,
            completedEvents: [],
            createdAt: new Date().toISOString(),
          };

          const storyFilename = `Story_${safeDataName(storyTitle)}.json`;
          writer.writeDataFile(storyFilename, storyData, false);

          return JSON.stringify({
            success: true,
            message: `Story generated with common events`,
            story_title: storyTitle,
            scenes_count: scenes.length,
            total_events: scenes.reduce(
              (sum, scene) => sum + scene.events.length,
              0
            ),
            common_event_ids: generatedCommonEvents.map((event) => event.common_event_id),
            file: path.join(RPGMAKER_PROJECT_PATH!, "data", storyFilename),
          });
        } catch (error) {
          return JSON.stringify({
            error: (error as Error).message,
          });
        }
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error) {
    logger.error("Tool execution error", error);
    return JSON.stringify({
      error: (error as Error).message,
    });
  }
}

// Generate plugin code template
function generatePluginCode(
  pluginName: string,
  description: string,
  author: string,
  version: string,
  codeType: string
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

  const footer = `
})();
`;

  let body = "";

  switch (codeType) {
    case "simple-hook":
      body = `
  // Hook example: modify the Scene_Map.prototype.update
  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    // Add your code here
  };
`;
      break;

    case "command":
      body = `
  // Plugin command example
  PluginManager.registerCommand(pluginName, "exampleCommand", args => {
    console.log("Example command executed with args:", args);
    // Add your command logic here
  });
`;
      break;

    case "skill-modifier":
      body = `
  // Skill modifier example
  const _Game_Battler_useItem = Game_Battler.prototype.useItem;
  Game_Battler.prototype.useItem = function(item) {
    _Game_Battler_useItem.call(this, item);
    if (DataManager.isSkill(item)) {
      // Modify skill behavior here
    }
  };
`;
      break;

    default: // empty
      body = `
  // Add your plugin code here
  console.log(\`\${pluginName} v\${PLUGIN_VERSION} loaded\`);
`;
  }

  return header + body + footer;
}

// Initialize and start server
async function main() {
  logger.info("=== RPG Maker MCP Server Starting ===");

  if (!validateSetup()) {
    process.exit(1);
  }

  const server = new McpServer({
    name: "rpgmaker-mcp",
    version: "0.2.0",
  });

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: toolInputSchemaToZod(tool),
      },
      (toolArgs) => {
        logger.debug("CallTool request", { name: tool.name, arguments: toolArgs });

        const result = handleToolCall(
          tool.name,
          toolArgs || {}
        );

        return {
          content: [
            {
              type: "text" as const,
              text: result,
            },
          ],
        };
      }
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("✓ MCP Server connected and ready");
  logger.info("Waiting for requests...");
}

main().catch((error) => {
  logger.error("Fatal error", error);
  process.exit(1);
});
