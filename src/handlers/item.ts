import { RPGMakerValidator } from "../rpgmaker/validator.js";
import type { HandlerContext } from "./types.js";

export async function handleEditItem(ctx: HandlerContext): Promise<string> {
  const { input, writer } = ctx;
  const itemId = input.item_id as number | undefined;
  const name = input.name as string;

  const itemData = {
    name,
    description: (input.description as string | undefined) || "",
    price: (input.price as number | undefined) || 0,
  };

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
