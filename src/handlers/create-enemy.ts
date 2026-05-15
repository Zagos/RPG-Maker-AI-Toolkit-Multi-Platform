import { RPGMakerValidator } from "../rpgmaker/validator.js";
import type { HandlerContext } from "./types.js";

export async function handleCreateEnemy(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const name = (input.name as string | undefined)?.trim();
    if (!name) return JSON.stringify({ error: "name is required" });

    // params = [maxHp, maxMp, atk, def, mat, mdf, agi, luk]
    const params = [
      (input.max_hp as number | undefined) ?? 100,
      (input.max_mp as number | undefined) ?? 0,
      (input.attack as number | undefined) ?? 10,
      (input.defense as number | undefined) ?? 10,
      (input.magic_attack as number | undefined) ?? 10,
      (input.magic_defense as number | undefined) ?? 10,
      (input.speed as number | undefined) ?? 10,
      (input.luck as number | undefined) ?? 10,
    ];

    const defaultDropItems = [
      { kind: 0, dataId: 1, denominator: 1 },
      { kind: 0, dataId: 1, denominator: 1 },
      { kind: 0, dataId: 1, denominator: 1 },
    ];

    const enemyData: Record<string, unknown> = {
      name,
      exp: (input.exp as number | undefined) ?? 0,
      gold: (input.gold as number | undefined) ?? 0,
      battlerName: (input.battler_name as string | undefined) ?? "",
      battlerHue: (input.battler_hue as number | undefined) ?? 0,
      note: (input.note as string | undefined) ?? "",
      params,
      dropItems: defaultDropItems,
      actions: [],
      traits: [],
    };

    const validation = RPGMakerValidator.validateEnemy({ name, gold: enemyData.gold, exp: enemyData.exp, actions: [] });
    if (!validation.valid) {
      return JSON.stringify({ error: "Validation failed", errors: validation.errors });
    }

    const newId = writer.addEnemy(enemyData);

    changeLog.append({
      tool: "create-enemy",
      entityType: "Enemy",
      entityId: newId,
      action: "create",
      summary: `Enemy ${newId} created: name='${name}'`,
    });

    return JSON.stringify({ success: true, enemy_id: newId, name });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
