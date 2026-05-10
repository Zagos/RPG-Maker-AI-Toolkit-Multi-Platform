import { RPGMakerValidator } from "../rpgmaker/validator.js";
import type { HandlerContext } from "./types.js";

export async function handleEditEnemy(ctx: HandlerContext): Promise<string> {
  const { input, writer } = ctx;
  const enemyId = input.enemy_id as number | undefined;
  const name = input.name as string;

  const enemyData = {
    name,
    gold: (input.gold as number | undefined) || 0,
    exp: (input.exp as number | undefined) || 0,
  };

  const validation = RPGMakerValidator.validateEnemy(enemyData);
  if (!validation.valid) {
    return JSON.stringify({ error: "Validation failed", errors: validation.errors });
  }

  try {
    if (enemyId) {
      writer.updateEnemy(enemyId, enemyData);
      ctx.changeLog.append({ tool: "edit-enemy", entityType: "Enemy", entityId: enemyId, action: "update", summary: `Enemy ${enemyId} updated: name='${name}'` });
      return JSON.stringify({ success: true, message: `Enemy ${enemyId} updated`, enemy_id: enemyId });
    } else {
      const newId = writer.addEnemy(enemyData);
      ctx.changeLog.append({ tool: "edit-enemy", entityType: "Enemy", entityId: newId, action: "create", summary: `Enemy created: name='${name}'` });
      return JSON.stringify({ success: true, message: "Enemy created", enemy_id: newId });
    }
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
