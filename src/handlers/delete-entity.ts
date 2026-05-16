import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

const FILE_MAP: Record<string, string> = {
  Actor: "Actors.json",
  Item: "Items.json",
  Enemy: "Enemies.json",
  Weapon: "Weapons.json",
  Armor: "Armors.json",
  Skill: "Skills.json",
  Class: "Classes.json",
  State: "States.json",
  Troop: "Troops.json",
  CommonEvent: "CommonEvents.json",
  Animation: "Animations.json",
  Tileset: "Tilesets.json",
};

export async function handleDeleteEntity(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath, changeLog } = ctx;

  try {
    const entityType = input.entity_type as string;
    const entityId = input.entity_id as number;
    const confirm = input.confirm as boolean | undefined;

    if (!FILE_MAP[entityType]) {
      return JSON.stringify({ error: `entity_type must be one of: ${Object.keys(FILE_MAP).join(", ")}` });
    }
    if (typeof entityId !== "number" || entityId < 1) {
      return JSON.stringify({ error: "entity_id must be a positive integer" });
    }
    if (confirm !== true) {
      return JSON.stringify({ error: "confirm must be true to proceed with deletion" });
    }

    const filename = FILE_MAP[entityType];
    const filePath = path.join(projectPath, "data", filename);

    if (!fs.existsSync(filePath)) {
      return JSON.stringify({ error: `Data file not found: ${filename}` });
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<unknown>;
    const idx = data.findIndex((e) => e !== null && typeof e === "object" && (e as Record<string, unknown>).id === entityId);

    if (idx === -1) {
      return JSON.stringify({ error: `${entityType} with ID ${entityId} not found` });
    }

    data[idx] = null;
    writer.writeDataFile(filename, data);

    changeLog.append({
      tool: "delete-entity",
      entityType,
      entityId,
      action: "delete",
      summary: `${entityType} ${entityId} deleted (nulled at index ${idx})`,
    });

    return JSON.stringify({ success: true, entity_type: entityType, entity_id: entityId });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
