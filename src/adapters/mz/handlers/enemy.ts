import * as fs from "fs";
import * as path from "path";
import { RPGMakerValidator } from "../validator.js";
import type { HandlerContext } from "./types.js";

export async function handleEditEnemy(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath } = ctx;
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
    const updates: Record<string, unknown> = { name };
    if (input.gold !== undefined) updates.gold = input.gold;
    if (input.exp !== undefined) updates.exp = input.exp;
    if (input.battler_name !== undefined) updates.battlerName = input.battler_name;
    if (input.battler_hue !== undefined) updates.battlerHue = input.battler_hue;
    if (input.note !== undefined) updates.note = input.note;

    // Map individual stat fields into params array [maxHP, maxMP, ATK, DEF, MAT, MDF, AGI, LUK]
    const STAT_FIELDS = ['max_hp', 'max_mp', 'attack', 'defense', 'magic_attack', 'magic_defense', 'speed', 'luck'];
    const hasStats = STAT_FIELDS.some(f => input[f] !== undefined);
    if (hasStats) {
      let params = [0, 0, 0, 0, 0, 0, 0, 0];
      if (enemyId) {
        const filePath = path.join(projectPath, 'data', 'Enemies.json');
        const enemies = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Array<Record<string, unknown> | null>;
        const existing = enemies.find(e => e !== null && (e as Record<string, unknown>).id === enemyId);
        if (existing && Array.isArray((existing as Record<string, unknown>).params)) {
          params = [...((existing as Record<string, unknown>).params as number[])];
        }
      }
      if (input.max_hp !== undefined) params[0] = input.max_hp as number;
      if (input.max_mp !== undefined) params[1] = input.max_mp as number;
      if (input.attack !== undefined) params[2] = input.attack as number;
      if (input.defense !== undefined) params[3] = input.defense as number;
      if (input.magic_attack !== undefined) params[4] = input.magic_attack as number;
      if (input.magic_defense !== undefined) params[5] = input.magic_defense as number;
      if (input.speed !== undefined) params[6] = input.speed as number;
      if (input.luck !== undefined) params[7] = input.luck as number;
      updates.params = params;
    }

    // Map drops to RPG Maker dropItems format [{kind,dataId,denominator}] (3 slots)
    if (input.drops !== undefined) {
      const drops = input.drops as Array<{ item_id?: number; probability?: number }>;
      const dropItems = drops.slice(0, 3).map(d => ({
        kind: 1, // 1=item
        dataId: d.item_id ?? 0,
        denominator: d.probability ? Math.round(1 / d.probability) : 1,
      }));
      while (dropItems.length < 3) dropItems.push({ kind: 0, dataId: 1, denominator: 1 });
      updates.dropItems = dropItems;
    }

    if (enemyId) {
      writer.updateEnemy(enemyId, updates);
      ctx.changeLog.append({ tool: "edit-enemy", entityType: "Enemy", entityId: enemyId, action: "update", summary: `Enemy ${enemyId} updated: name='${name}'` });
      return JSON.stringify({ success: true, message: `Enemy ${enemyId} updated`, enemy_id: enemyId });
    } else {
      const newId = writer.addEnemy(updates);
      ctx.changeLog.append({ tool: "edit-enemy", entityType: "Enemy", entityId: newId, action: "create", summary: `Enemy created: name='${name}'` });
      return JSON.stringify({ success: true, message: "Enemy created", enemy_id: newId });
    }
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
