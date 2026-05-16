import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

const FILE_MAP: Record<string, string> = {
  Actor: "Actors.json", Item: "Items.json", Weapon: "Weapons.json", Armor: "Armors.json",
  Skill: "Skills.json", Class: "Classes.json", State: "States.json", Enemy: "Enemies.json",
  Troop: "Troops.json", CommonEvent: "CommonEvents.json", Animation: "Animations.json",
};

export async function handleCleanupProject(ctx: HandlerContext): Promise<string> {
  const { input, projectPath } = ctx;
  const requestedTypes = input.entity_types as string[] | undefined;
  const typesToCheck = requestedTypes?.length
    ? requestedTypes.filter((t) => FILE_MAP[t])
    : Object.keys(FILE_MAP);

  try {
    const report: Array<{ entity_type: string; total_slots: number; null_slots: number; active_entities: number }> = [];
    let totalNulls = 0;

    for (const entityType of typesToCheck) {
      const filePath = path.join(projectPath, "data", FILE_MAP[entityType]);
      if (!fs.existsSync(filePath)) continue;
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<unknown>;
      const nullCount = data.filter((e) => e === null).length;
      const activeCount = data.filter((e) => e !== null).length;
      totalNulls += nullCount;
      report.push({ entity_type: entityType, total_slots: data.length, null_slots: nullCount, active_entities: activeCount });
    }

    return JSON.stringify({ success: true, total_null_slots: totalNulls, report });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
