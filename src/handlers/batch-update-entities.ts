import type { HandlerContext } from "./types.js";
import type { RPGMakerWriter } from "../rpgmaker/writer.js";

type UpdaterFn = (writer: RPGMakerWriter, id: number, updates: Record<string, unknown>) => void;

const UPDATER_MAP: Record<string, UpdaterFn> = {
  Actor: (w, id, u) => w.updateActor(id, u),
  Item: (w, id, u) => w.updateItem(id, u),
  Weapon: (w, id, u) => w.updateWeapon(id, u),
  Armor: (w, id, u) => w.updateArmor(id, u),
  Skill: (w, id, u) => w.updateSkill(id, u),
  Class: (w, id, u) => w.updateClass(id, u),
  State: (w, id, u) => w.updateState(id, u),
  Enemy: (w, id, u) => w.updateEnemy(id, u),
};

export async function handleBatchUpdateEntities(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;
  const entityType = input.entity_type as string;
  const entityIds = input.entity_ids as number[] | undefined;
  const updates = input.updates as Record<string, unknown> | undefined;
  const confirm = input.confirm as boolean;

  const updater = UPDATER_MAP[entityType];
  if (!updater) {
    return JSON.stringify({ error: `entity_type must be one of: ${Object.keys(UPDATER_MAP).join(", ")}` });
  }
  if (!Array.isArray(entityIds) || entityIds.length === 0) {
    return JSON.stringify({ error: "entity_ids must be a non-empty array" });
  }
  if (entityIds.length > 100) {
    return JSON.stringify({ error: "entity_ids exceeds maximum of 100" });
  }
  if (!updates || typeof updates !== "object" || Object.keys(updates).length === 0) {
    return JSON.stringify({ error: "updates must be a non-empty object" });
  }
  if (confirm !== true) {
    return JSON.stringify({ error: "confirm must be true to write changes" });
  }

  const results: Array<{ id: number; success: boolean; error?: string }> = [];
  let successCount = 0;

  for (const id of entityIds) {
    try {
      updater(writer, id, updates);
      results.push({ id, success: true });
      successCount++;
    } catch (err) {
      results.push({ id, success: false, error: (err as Error).message });
    }
  }

  changeLog.append({
    tool: "batch-update-entities",
    entityType,
    action: "update",
    summary: `Batch updated ${successCount}/${entityIds.length} ${entityType} entities with fields: ${Object.keys(updates).join(", ")}`,
  });

  return JSON.stringify({
    success: successCount === entityIds.length,
    entity_type: entityType,
    total: entityIds.length,
    updated: successCount,
    results,
  });
}
