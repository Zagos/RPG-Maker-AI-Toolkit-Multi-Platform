import type { HandlerContext } from "./types.js";

export async function handleCreateWeapon(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const name = (input.name as string | undefined)?.trim();
    if (!name) return JSON.stringify({ error: "name is required" });

    // params = [maxHp, maxMp, atk, def, mat, mdf, agi, luk]
    const params = [0, 0, 0, 0, 0, 0, 0, 0];
    if (input.attack !== undefined) params[2] = input.attack as number;
    if (input.magic_attack !== undefined) params[4] = input.magic_attack as number;

    const weaponData: Record<string, unknown> = {
      name,
      description: (input.description as string | undefined) ?? "",
      wtypeId: (input.wtype_id as number | undefined) ?? 1,
      price: (input.price as number | undefined) ?? 0,
      iconIndex: (input.icon_index as number | undefined) ?? 0,
      animationId: (input.animation_id as number | undefined) ?? 0,
      note: (input.note as string | undefined) ?? "",
      params,
      traits: [],
    };

    const newId = writer.addWeapon(weaponData);

    changeLog.append({
      tool: "create-weapon",
      entityType: "Weapon",
      entityId: newId,
      action: "create",
      summary: `Weapon ${newId} created: name='${name}'`,
    });

    return JSON.stringify({ success: true, weapon_id: newId, name });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
