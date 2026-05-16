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

export async function handleDuplicateEntity(ctx: HandlerContext): Promise<string> {
  const { input, projectPath, writer, changeLog } = ctx;
  const entityType = input.entity_type as string;
  const entityId = input.entity_id as number;
  const newName = input.new_name as string;

  const filename = FILE_MAP[entityType];
  if (!filename) {
    return JSON.stringify({
      error: `Unknown entity_type: ${entityType}. Valid types: ${Object.keys(FILE_MAP).join(", ")}`,
    });
  }

  try {
    const filePath = path.join(projectPath, "data", filename);
    if (!fs.existsSync(filePath)) {
      return JSON.stringify({ error: `Data file not found: ${filename}` });
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<Record<string, unknown> | null>;

    const source = data.find((e) => e !== null && e.id === entityId);
    if (!source) {
      return JSON.stringify({ error: `${entityType} with id ${entityId} not found` });
    }

    // Find max id among non-null entries
    let maxId = 0;
    for (const entry of data) {
      if (entry !== null && typeof entry.id === "number" && entry.id > maxId) {
        maxId = entry.id;
      }
    }

    const newId = maxId + 1;
    const clone: Record<string, unknown> = { ...source, id: newId, name: newName };

    // Extend array if needed and push clone
    while (data.length <= newId) data.push(null);
    data[newId] = clone;

    writer.writeDataFile(filename, data);

    changeLog.append({
      tool: "duplicate-entity",
      entityType,
      entityId: newId,
      action: "create",
      summary: `${entityType} ${entityId} duplicated as '${newName}' with new id ${newId}`,
    });

    return JSON.stringify({
      success: true,
      entity_type: entityType,
      source_id: entityId,
      new_id: newId,
      new_name: newName,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
