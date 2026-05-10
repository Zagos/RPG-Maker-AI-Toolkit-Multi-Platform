import type { HandlerContext } from "./types.js";

export async function handleEditSkill(ctx: HandlerContext): Promise<string> {
  const { input, writer } = ctx;
  const skillId = input.skill_id as number | undefined;

  const updates: Record<string, unknown> = { name: input.name };
  if (input.description !== undefined) updates.description = input.description;
  if (input.mp_cost !== undefined) updates.mpCost = input.mp_cost;
  if (input.tp_cost !== undefined) updates.tpCost = input.tp_cost;
  if (input.scope !== undefined) updates.scope = input.scope;
  if (input.occasion !== undefined) updates.occasion = input.occasion;
  if (input.animation_id !== undefined) updates.animationId = input.animation_id;
  if (input.damage_type !== undefined) updates.damageType = input.damage_type;
  if (input.message1 !== undefined) updates.message1 = input.message1;
  if (input.message2 !== undefined) updates.message2 = input.message2;
  if (input.icon_index !== undefined) updates.iconIndex = input.icon_index;
  if (input.speed !== undefined) updates.speed = input.speed;
  if (input.success_rate !== undefined) updates.successRate = input.success_rate;

  try {
    if (skillId) {
      writer.updateSkill(skillId, updates);
      ctx.changeLog.append({ tool: "edit-skill", entityType: "Skill", entityId: skillId, action: "update", summary: `Skill ${skillId} updated: name='${input.name}'` });
      return JSON.stringify({ success: true, message: `Skill ${skillId} updated`, skill_id: skillId });
    } else {
      updates.stypeId = 1;
      updates.damage = { critical: false, elementId: 0, formula: "0", type: updates.damageType ?? 0, variance: 20 };
      updates.effects = [];
      updates.traits = [];
      updates.note = "";
      updates.mpCost = updates.mpCost ?? 0;
      updates.tpCost = updates.tpCost ?? 0;
      updates.scope = updates.scope ?? 1;
      updates.occasion = updates.occasion ?? 1;
      updates.speed = updates.speed ?? 0;
      updates.successRate = updates.successRate ?? 100;
      updates.repeats = 1;
      updates.tpGain = 0;
      updates.hitType = 1;
      updates.animationId = updates.animationId ?? 0;
      updates.message1 = updates.message1 ?? "";
      updates.message2 = updates.message2 ?? "";
      updates.iconIndex = updates.iconIndex ?? 0;
      updates.requiredWtypeId1 = 0;
      updates.requiredWtypeId2 = 0;
      const newId = writer.addSkill(updates);
      ctx.changeLog.append({ tool: "edit-skill", entityType: "Skill", entityId: newId, action: "create", summary: `Skill created: name='${input.name}'` });
      return JSON.stringify({ success: true, message: "Skill created", skill_id: newId });
    }
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
