import type { HandlerContext } from "./types.js";

export async function handleCreateArmor(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const name = (input.name as string | undefined)?.trim();
    if (!name) return JSON.stringify({ error: "name is required" });

    // params = [maxHp, maxMp, atk, def, mat, mdf, agi, luk]
    const params = [0, 0, 0, 0, 0, 0, 0, 0];
    if (input.defense !== undefined) params[3] = input.defense as number;
    if (input.magic_defense !== undefined) params[5] = input.magic_defense as number;

    const armorData: Record<string, unknown> = {
      name,
      description: (input.description as string | undefined) ?? "",
      atypeId: (input.atype_id as number | undefined) ?? 1,
      etypeId: (input.etype_id as number | undefined) ?? 1,
      price: (input.price as number | undefined) ?? 0,
      iconIndex: (input.icon_index as number | undefined) ?? 0,
      note: (input.note as string | undefined) ?? "",
      params,
      traits: [],
    };

    const newId = writer.addArmor(armorData);

    changeLog.append({
      tool: "create-armor",
      entityType: "Armor",
      entityId: newId,
      action: "create",
      summary: `Armor ${newId} created: name='${name}'`,
    });

    return JSON.stringify({ success: true, armor_id: newId, name });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
