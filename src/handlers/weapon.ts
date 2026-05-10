import type { HandlerContext } from "./types.js";

function buildParameters(input: Record<string, unknown>, current: number[] = []): number[] {
  // parameters[0..7] = [maxHp, maxMp, atk, def, mat, mdf, agi, luk]
  const params = [...current];
  while (params.length < 8) params.push(0);
  if (input.max_hp !== undefined) params[0] = input.max_hp as number;
  if (input.max_mp !== undefined) params[1] = input.max_mp as number;
  if (input.attack !== undefined) params[2] = input.attack as number;
  if (input.defense !== undefined) params[3] = input.defense as number;
  if (input.magic_attack !== undefined) params[4] = input.magic_attack as number;
  if (input.magic_defense !== undefined) params[5] = input.magic_defense as number;
  if (input.agility !== undefined) params[6] = input.agility as number;
  if (input.luck !== undefined) params[7] = input.luck as number;
  return params;
}

export async function handleEditWeapon(ctx: HandlerContext): Promise<string> {
  const { input, writer, reader } = ctx;
  const weaponId = input.weapon_id as number | undefined;

  const updates: Record<string, unknown> = { name: input.name };
  if (input.description !== undefined) updates.description = input.description;
  if (input.wtype_id !== undefined) updates.wtypeId = input.wtype_id;
  if (input.price !== undefined) updates.price = input.price;
  if (input.icon_index !== undefined) updates.iconIndex = input.icon_index;
  if (input.animation_id !== undefined) updates.animationId = input.animation_id;

  try {
    if (weaponId) {
      const existing = reader.readWeapon(weaponId);
      const currentParams = (existing?.parameters as number[] | undefined) || [];
      updates.parameters = buildParameters(input, currentParams);
      writer.updateWeapon(weaponId, updates);
      ctx.changeLog.append({ tool: "edit-weapon", entityType: "Weapon", entityId: weaponId, action: "update", summary: `Weapon ${weaponId} updated: name='${input.name}'` });
      return JSON.stringify({ success: true, message: `Weapon ${weaponId} updated`, weapon_id: weaponId });
    } else {
      updates.parameters = buildParameters(input);
      updates.wtypeId = updates.wtypeId ?? 1;
      updates.traits = [];
      updates.note = "";
      const newId = writer.addWeapon(updates);
      ctx.changeLog.append({ tool: "edit-weapon", entityType: "Weapon", entityId: newId, action: "create", summary: `Weapon created: name='${input.name}'` });
      return JSON.stringify({ success: true, message: "Weapon created", weapon_id: newId });
    }
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
