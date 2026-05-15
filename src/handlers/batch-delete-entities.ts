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
};

export async function handleBatchDeleteEntities(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath, changeLog } = ctx;
  const entityType = input.entity_type as string;
  const entityIds = input.entity_ids as number[] | undefined;
  const confirm = input.confirm as boolean | undefined;

  if (!FILE_MAP[entityType]) {
    return JSON.stringify({ error: `entity_type must be one of: ${Object.keys(FILE_MAP).join(", ")}` });
  }
  if (!Array.isArray(entityIds) || entityIds.length === 0) {
    return JSON.stringify({ error: "entity_ids must be a non-empty array" });
  }
  if (entityIds.length > 100) {
    return JSON.stringify({ error: "entity_ids array exceeds maximum of 100 items" });
  }
  if (confirm !== true) {
    return JSON.stringify({ error: "confirm must be true to proceed with deletion" });
  }

  const filename = FILE_MAP[entityType];
  const filePath = path.join(projectPath, "data", filename);

  if (!fs.existsSync(filePath)) {
    return JSON.stringify({ error: `Data file not found: ${filename}` });
  }

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<unknown>;
    const results: Array<{ id: number; success: boolean; error?: string }> = [];
    let deletedCount = 0;

    for (const entityId of entityIds) {
      const idx = data.findIndex((e) => e !== null && typeof e === "object" && (e as Record<string, unknown>).id === entityId);
      if (idx === -1) {
        results.push({ id: entityId, success: false, error: `${entityType} ${entityId} not found` });
      } else {
        data[idx] = null;
        results.push({ id: entityId, success: true });
        deletedCount++;
      }
    }

    writer.writeDataFile(filename, data);

    changeLog.append({
      tool: "batch-delete-entities",
      entityType,
      action: "delete",
      summary: `Batch deleted ${deletedCount}/${entityIds.length} ${entityType} entities`,
    });

    return JSON.stringify({
      success: deletedCount === entityIds.length,
      entity_type: entityType,
      total: entityIds.length,
      deleted: deletedCount,
      results,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
