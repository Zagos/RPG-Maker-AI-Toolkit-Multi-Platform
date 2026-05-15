import type { HandlerContext } from "./types.js";

function buildParameters(input: Record<string, unknown>, current: number[] = []): number[] {
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

export async function handleEditArmor(ctx: HandlerContext): Promise<string> {
  const { input, writer, reader } = ctx;
  const armorId = input.armor_id as number | undefined;

  const updates: Record<string, unknown> = { name: input.name };
  if (input.description !== undefined) updates.description = input.description;
  if (input.atype_id !== undefined) updates.atypeId = input.atype_id;
  if (input.price !== undefined) updates.price = input.price;
  if (input.icon_index !== undefined) updates.iconIndex = input.icon_index;
  if (input.etype_id !== undefined) updates.etypeId = input.etype_id;

  try {
    if (armorId) {
      const existing = reader.readArmor(armorId);
      const currentParams = (existing?.parameters as number[] | undefined) || [];
      updates.parameters = buildParameters(input, currentParams);
      writer.updateArmor(armorId, updates);
      ctx.changeLog.append({ tool: "edit-armor", entityType: "Armor", entityId: armorId, action: "update", summary: `Armor ${armorId} updated: name='${input.name}'` });
      return JSON.stringify({ success: true, message: `Armor ${armorId} updated`, armor_id: armorId });
    } else {
      updates.parameters = buildParameters(input);
      updates.atypeId = updates.atypeId ?? 1;
      updates.etypeId = (updates.etypeId as number | undefined) ?? 1;
      updates.traits = [];
      updates.note = "";
      const newId = writer.addArmor(updates);
      ctx.changeLog.append({ tool: "edit-armor", entityType: "Armor", entityId: newId, action: "create", summary: `Armor created: name='${input.name}'` });
      return JSON.stringify({ success: true, message: "Armor created", armor_id: newId });
    }
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
