import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

function readJsonArray(filePath: string): Array<Record<string, unknown> | null> {
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<Record<string, unknown> | null>;
  } catch {
    return [];
  }
}

function readJson(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function handleExportProjectSummary(ctx: HandlerContext): Promise<string> {
  const { projectPath } = ctx;
  const dataDir = path.join(projectPath, "data");

  try {
    // Actors
    const actorsRaw = readJsonArray(path.join(dataDir, "Actors.json"));
    const actors = actorsRaw
      .filter((e): e is Record<string, unknown> => e !== null)
      .map((e) => ({ id: e.id, name: e.name, class_id: e.classId, initial_level: e.initialLevel }));

    // Classes
    const classesRaw = readJsonArray(path.join(dataDir, "Classes.json"));
    const classes = classesRaw
      .filter((e): e is Record<string, unknown> => e !== null)
      .map((e) => ({ id: e.id, name: e.name }));

    // Skills
    const skillsRaw = readJsonArray(path.join(dataDir, "Skills.json"));
    const skills = skillsRaw
      .filter((e): e is Record<string, unknown> => e !== null)
      .map((e) => ({ id: e.id, name: e.name, stype_id: e.stypeId }));

    // Items
    const itemsRaw = readJsonArray(path.join(dataDir, "Items.json"));
    const items = itemsRaw
      .filter((e): e is Record<string, unknown> => e !== null)
      .map((e) => ({ id: e.id, name: e.name, price: e.price }));

    // Weapons
    const weaponsRaw = readJsonArray(path.join(dataDir, "Weapons.json"));
    const weapons = weaponsRaw
      .filter((e): e is Record<string, unknown> => e !== null)
      .map((e) => ({ id: e.id, name: e.name }));

    // Armors
    const armorsRaw = readJsonArray(path.join(dataDir, "Armors.json"));
    const armors = armorsRaw
      .filter((e): e is Record<string, unknown> => e !== null)
      .map((e) => ({ id: e.id, name: e.name }));

    // Enemies
    const enemiesRaw = readJsonArray(path.join(dataDir, "Enemies.json"));
    const enemies = enemiesRaw
      .filter((e): e is Record<string, unknown> => e !== null)
      .map((e) => ({ id: e.id, name: e.name, exp: e.exp, gold: e.gold }));

    // Troops
    const troopsRaw = readJsonArray(path.join(dataDir, "Troops.json"));
    const troops = troopsRaw
      .filter((e): e is Record<string, unknown> => e !== null)
      .map((e) => ({
        id: e.id,
        name: e.name,
        member_count: Array.isArray(e.members) ? (e.members as unknown[]).length : 0,
      }));

    // States
    const statesRaw = readJsonArray(path.join(dataDir, "States.json"));
    const states = statesRaw
      .filter((e): e is Record<string, unknown> => e !== null)
      .map((e) => ({ id: e.id, name: e.name }));

    // Maps (from MapInfos.json — index-based array, index = mapId)
    const mapInfosRaw = readJsonArray(path.join(dataDir, "MapInfos.json"));
    const maps = mapInfosRaw
      .map((e, idx) => (e !== null ? { id: idx, name: e.name, parent_id: e.parentId } : null))
      .filter((e): e is { id: number; name: unknown; parent_id: unknown } => e !== null);

    // CommonEvents
    const commonEventsRaw = readJsonArray(path.join(dataDir, "CommonEvents.json"));
    const common_events = commonEventsRaw
      .filter((e): e is Record<string, unknown> => e !== null)
      .map((e) => ({ id: e.id, name: e.name, trigger: e.trigger }));

    // System.json for switches, variables, plugins
    const system = readJson(path.join(dataDir, "System.json"));
    const switchNames = (system.switches as string[] | undefined) ?? [];
    const variableNames = (system.variables as string[] | undefined) ?? [];
    const switches_named = switchNames.filter((s) => typeof s === "string" && s.trim() !== "").length;
    const variables_named = variableNames.filter((v) => typeof v === "string" && v.trim() !== "").length;

    // Plugins
    const pluginsPath = path.join(projectPath, "js", "plugins.js");
    let plugin_count = 0;
    if (fs.existsSync(pluginsPath)) {
      const pluginsContent = fs.readFileSync(pluginsPath, "utf-8");
      // RPG Maker plugins.js has format: var $plugins = [...];
      const match = pluginsContent.match(/\$plugins\s*=\s*(\[[\s\S]*?\]);/);
      if (match) {
        try {
          const plugins = JSON.parse(match[1]) as unknown[];
          plugin_count = plugins.length;
        } catch { /* ignore */ }
      }
    }

    return JSON.stringify({
      success: true,
      summary: {
        actors,
        classes,
        skills,
        items,
        weapons,
        armors,
        enemies,
        troops,
        states,
        maps,
        common_events,
        switches_named,
        variables_named,
        plugin_count,
        total_tools: 57,
      },
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
