import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

export async function handleEditDropItems(ctx: HandlerContext): Promise<string> {
  const { input, projectPath, changeLog } = ctx;
  const enemyId = input.enemy_id as number;
  const mode = input.mode as string;
  try {
    const filePath = path.join(projectPath, "data", "Enemies.json");
    if (!fs.existsSync(filePath)) return JSON.stringify({ error: "Enemies.json not found" });
    const enemies = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<Record<string, unknown> | null>;
    const idx = enemies.findIndex(e => e !== null && (e as Record<string, unknown>).id === enemyId);
    if (idx === -1) return JSON.stringify({ error: `Enemy ${enemyId} not found` });
    const enemy = enemies[idx] as Record<string, unknown>;

    const emptySlot = { kind: 0, dataId: 1, denominator: 1 };
    let dropItems: Array<{ kind: number; dataId: number; denominator: number }> = Array.isArray(enemy.dropItems)
      ? (enemy.dropItems as Array<{ kind: number; dataId: number; denominator: number }>).slice()
      : [emptySlot, emptySlot, emptySlot];
    while (dropItems.length < 3) dropItems.push({ ...emptySlot });

    if (mode === "clear") {
      dropItems = [{ ...emptySlot }, { ...emptySlot }, { ...emptySlot }];
    } else {
      const newDrops = ((input.drops as Array<{ kind: number; data_id: number; denominator: number }> | undefined) ?? [])
        .map(d => ({ kind: d.kind, dataId: d.data_id, denominator: d.denominator }));
      if (mode === "replace") {
        dropItems = newDrops.slice(0, 3);
        while (dropItems.length < 3) dropItems.push({ ...emptySlot });
      } else if (mode === "append") {
        let slotIdx = dropItems.findIndex(d => d.kind === 0);
        for (const d of newDrops) {
          if (slotIdx === -1) break;
          dropItems[slotIdx] = d;
          slotIdx = dropItems.findIndex(d2 => d2.kind === 0);
        }
      }
    }

    enemies[idx] = { ...enemy, dropItems };
    fs.writeFileSync(filePath, JSON.stringify(enemies), "utf-8");
    changeLog.append({ tool: "edit-drop-items", entityType: "Enemy", entityId: enemyId, action: "update", summary: `Enemy ${enemyId} drop table updated (mode=${mode})` });
    return JSON.stringify({ success: true, enemy_id: enemyId, drop_items: dropItems });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
