import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

const FILE_MAP: Record<string, string> = {
  Actor: "Actors.json",
  Item: "Items.json",
  Skill: "Skills.json",
  Weapon: "Weapons.json",
  Armor: "Armors.json",
  Class: "Classes.json",
  State: "States.json",
  Enemy: "Enemies.json",
  Troop: "Troops.json",
  CommonEvent: "CommonEvents.json",
  Animation: "Animations.json",
  Tileset: "Tilesets.json",
};

export async function handleSearchEntity(ctx: HandlerContext): Promise<string> {
  const { input, projectPath } = ctx;
  const entityType = input.entity_type as string;
  const query = input.query as string;
  const field = (input.field as string | undefined) ?? "name";
  const limit = (input.limit as number | undefined) ?? 20;

  const filename = FILE_MAP[entityType];
  if (!filename) {
    return JSON.stringify({
      error: `Unknown entity_type: ${entityType}. Valid types: ${Object.keys(FILE_MAP).join(", ")}`,
    });
  }

  const filePath = path.join(projectPath, "data", filename);
  try {
    if (!fs.existsSync(filePath)) {
      return JSON.stringify({ error: `Data file not found: ${filename}` });
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<Record<string, unknown> | null>;
    const lowerQuery = query.toLowerCase();

    const results: Array<Record<string, unknown>> = [];
    for (const entry of data) {
      if (entry === null) continue;
      const fieldValue = entry[field];
      if (typeof fieldValue === "string" && fieldValue.toLowerCase().includes(lowerQuery)) {
        results.push({ id: entry.id, name: entry.name, ...Object.fromEntries(Object.entries(entry).filter(([k]) => k !== "id" && k !== "name")) });
        if (results.length >= limit) break;
      }
    }

    return JSON.stringify({
      success: true,
      entity_type: entityType,
      query,
      field,
      total_found: results.length,
      results,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
