import type { HandlerContext } from "./types.js";

interface RPGEnemyAction {
  conditionParam1: number;
  conditionParam2: number;
  conditionType: number;
  rating: number;
  skillId: number;
}

interface ActionInput {
  skill_id: number;
  rating: number;
  condition_type: number;
  condition_param1: number;
  condition_param2: number;
}

export async function handleEditEnemyActions(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer, changeLog } = ctx;

  try {
    const enemyId = input.enemy_id as number;
    const mode = input.mode as string;

    if (typeof enemyId !== "number" || enemyId < 1) {
      return JSON.stringify({ error: "enemy_id must be a positive integer" });
    }
    if (!["replace", "append", "clear"].includes(mode)) {
      return JSON.stringify({ error: "mode must be replace, append, or clear" });
    }

    const enemy = reader.readEnemy(enemyId);
    if (!enemy) return JSON.stringify({ error: `Enemy ${enemyId} not found` });

    if (mode === "clear") {
      writer.updateEnemy(enemyId, { actions: [] });
      changeLog.append({ tool: "edit-enemy-actions", entityType: "Enemy", entityId: enemyId, action: "update", summary: `Enemy ${enemyId} actions cleared` });
      return JSON.stringify({ success: true, enemy_id: enemyId, actions_count: 0 });
    }

    const inputActions = (input.actions as ActionInput[] | undefined) ?? [];
    if (inputActions.length === 0) {
      return JSON.stringify({ error: "actions array is required for replace and append modes" });
    }

    for (const a of inputActions) {
      if (typeof a.skill_id !== "number" || a.skill_id < 1) {
        return JSON.stringify({ error: `skill_id must be a positive integer` });
      }
      if (typeof a.rating !== "number" || a.rating < 1 || a.rating > 9) {
        return JSON.stringify({ error: `rating must be 1–9` });
      }
      if (typeof a.condition_type !== "number" || a.condition_type < 0 || a.condition_type > 6) {
        return JSON.stringify({ error: `condition_type must be 0–6` });
      }
    }

    const newActions: RPGEnemyAction[] = inputActions.map((a) => ({
      conditionParam1: a.condition_param1,
      conditionParam2: a.condition_param2,
      conditionType: a.condition_type,
      rating: a.rating,
      skillId: a.skill_id,
    }));

    const existing = mode === "append"
      ? ((enemy as unknown as Record<string, unknown>).actions as RPGEnemyAction[] | undefined) ?? []
      : [];
    const finalActions = [...existing, ...newActions];

    writer.updateEnemy(enemyId, { actions: finalActions });

    changeLog.append({
      tool: "edit-enemy-actions",
      entityType: "Enemy",
      entityId: enemyId,
      action: "update",
      summary: `Enemy ${enemyId} actions ${mode}d: ${finalActions.length} total`,
    });

    return JSON.stringify({ success: true, enemy_id: enemyId, mode, actions_count: finalActions.length });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
