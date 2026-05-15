import { RPGMakerValidator } from "../rpgmaker/validator.js";
import type { HandlerContext } from "./types.js";

export async function handleEditItem(ctx: HandlerContext): Promise<string> {
  const { input, writer } = ctx;
  const itemId = input.item_id as number | undefined;
  const name = input.name as string;

  const itemData: Record<string, unknown> = {
    name,
    description: (input.description as string | undefined) || "",
    price: (input.price as number | undefined) || 0,
  };

  if (input.icon_index !== undefined) itemData.iconIndex = input.icon_index;
  if (input.consumable !== undefined) itemData.consumable = input.consumable;
  if (input.scope !== undefined) itemData.scope = input.scope;
  if (input.occasion !== undefined) itemData.occasion = input.occasion;
  if (input.speed !== undefined) itemData.speed = input.speed;
  if (input.success_rate !== undefined) itemData.successRate = input.success_rate;
  if (input.repeats !== undefined) itemData.repeats = input.repeats;
  if (input.tp_gain !== undefined) itemData.tpGain = input.tp_gain;
  if (input.hit_type !== undefined) itemData.hitType = input.hit_type;
  if (input.animation_id !== undefined) itemData.animationId = input.animation_id;
  if (input.note !== undefined) itemData.note = input.note;

  const validation = RPGMakerValidator.validateItem(itemData);
  if (!validation.valid) {
    return JSON.stringify({ error: "Validation failed", errors: validation.errors });
  }

  try {
    if (itemId) {
      writer.updateItem(itemId, itemData);
      ctx.changeLog.append({ tool: "edit-item", entityType: "Item", entityId: itemId, action: "update", summary: `Item ${itemId} updated: name='${name}'` });
      return JSON.stringify({ success: true, message: `Item ${itemId} updated`, item_id: itemId });
    } else {
      const newId = writer.addItem(itemData);
      ctx.changeLog.append({ tool: "edit-item", entityType: "Item", entityId: newId, action: "create", summary: `Item created: name='${name}'` });
      return JSON.stringify({ success: true, message: "Item created", item_id: newId });
    }
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
