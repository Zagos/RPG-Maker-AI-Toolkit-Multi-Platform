import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

export async function handleEditSystem(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath, changeLog } = ctx;

  try {
    const systemPath = path.join(projectPath, "data", "System.json");
    if (!fs.existsSync(systemPath)) {
      return JSON.stringify({ error: "System.json not found in project data directory" });
    }

    const system = JSON.parse(fs.readFileSync(systemPath, "utf-8")) as Record<string, unknown>;
    const updated: string[] = [];

    if (input.game_title !== undefined) {
      system.gameTitle = input.game_title;
      updated.push("game_title");
    }

    if (input.currency_unit !== undefined) {
      system.currencyUnit = input.currency_unit;
      updated.push("currency_unit");
    }

    if (input.initial_party !== undefined) {
      system.partyMembers = input.initial_party;
      updated.push("initial_party");
    }

    if (input.start_map_id !== undefined || input.start_x !== undefined || input.start_y !== undefined) {
      const startMapId = (input.start_map_id as number | undefined) ?? (system.startMapId as number ?? 1);
      const startX = (input.start_x as number | undefined) ?? (system.startX as number ?? 0);
      const startY = (input.start_y as number | undefined) ?? (system.startY as number ?? 0);
      system.startMapId = startMapId;
      system.startX = startX;
      system.startY = startY;
      updated.push("start_position");
    }

    if (input.switch_names !== undefined) {
      const names = input.switch_names as Record<string, string>;
      const current = (system.switches as string[] | undefined) ?? [""];
      for (const [idStr, name] of Object.entries(names)) {
        const id = parseInt(idStr, 10);
        if (isNaN(id) || id < 1) continue;
        while (current.length <= id) current.push("");
        current[id] = name;
      }
      system.switches = current;
      updated.push("switch_names");
    }

    if (input.variable_names !== undefined) {
      const names = input.variable_names as Record<string, string>;
      const current = (system.variables as string[] | undefined) ?? [""];
      for (const [idStr, name] of Object.entries(names)) {
        const id = parseInt(idStr, 10);
        if (isNaN(id) || id < 1) continue;
        while (current.length <= id) current.push("");
        current[id] = name;
      }
      system.variables = current;
      updated.push("variable_names");
    }

    if (input.title_bgm !== undefined) {
      system.titleBgm = mergeAudio(system.titleBgm as Record<string, unknown> | undefined, input.title_bgm as Record<string, unknown>);
      updated.push("title_bgm");
    }
    if (input.battle_bgm !== undefined) {
      system.battleBgm = mergeAudio(system.battleBgm as Record<string, unknown> | undefined, input.battle_bgm as Record<string, unknown>);
      updated.push("battle_bgm");
    }
    if (input.victory_me !== undefined) {
      system.victoryMe = mergeAudio(system.victoryMe as Record<string, unknown> | undefined, input.victory_me as Record<string, unknown>);
      updated.push("victory_me");
    }
    if (input.defeat_me !== undefined) {
      system.defeatMe = mergeAudio(system.defeatMe as Record<string, unknown> | undefined, input.defeat_me as Record<string, unknown>);
      updated.push("defeat_me");
    }

    if (updated.length === 0) {
      return JSON.stringify({ error: "No fields to update. Provide at least one property." });
    }

    writer.writeDataFile("System.json", system);

    changeLog.append({
      tool: "edit-system",
      entityType: "System",
      entityId: 0,
      action: "update",
      summary: `System updated: ${updated.join(", ")}`,
    });

    return JSON.stringify({ success: true, updated });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

function mergeAudio(
  existing: Record<string, unknown> | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base = existing ?? { name: "", pan: 0, pitch: 100, volume: 90 };
  return { ...base, ...patch };
}
