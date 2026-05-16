import { RPGMakerValidator } from "../validator.js";
import type { HandlerContext } from "./types.js";

export async function handleCreateItem(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const name = (input.name as string | undefined)?.trim();
    if (!name) return JSON.stringify({ error: "name is required" });

    const itemData: Record<string, unknown> = {
      name,
      description: (input.description as string | undefined) ?? "",
      price: (input.price as number | undefined) ?? 0,
      itypeId: (input.itype_id as number | undefined) ?? 1,
      iconIndex: (input.icon_index as number | undefined) ?? 0,
      consumable: (input.consumable as boolean | undefined) ?? true,
      scope: (input.scope as number | undefined) ?? 7,
      occasion: (input.occasion as number | undefined) ?? 0,
      speed: (input.speed as number | undefined) ?? 0,
      successRate: (input.success_rate as number | undefined) ?? 100,
      repeats: (input.repeats as number | undefined) ?? 1,
      tpGain: (input.tp_gain as number | undefined) ?? 0,
      hitType: (input.hit_type as number | undefined) ?? 0,
      animationId: (input.animation_id as number | undefined) ?? 0,
      note: (input.note as string | undefined) ?? "",
      effects: [],
      traits: [],
      damage: { type: 0, elementId: 0, formula: "0", variance: 20, critical: false },
    };

    const validation = RPGMakerValidator.validateItem(itemData);
    if (!validation.valid) {
      return JSON.stringify({ error: "Validation failed", errors: validation.errors });
    }

    const newId = writer.addItem(itemData);

    changeLog.append({
      tool: "create-item",
      entityType: "Item",
      entityId: newId,
      action: "create",
      summary: `Item ${newId} created: name='${name}'`,
    });

    return JSON.stringify({ success: true, item_id: newId, name });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
