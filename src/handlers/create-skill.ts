import type { HandlerContext } from "./types.js";

export async function handleCreateSkill(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const name = (input.name as string | undefined)?.trim();
    if (!name) return JSON.stringify({ error: "name is required" });

    const skillData: Record<string, unknown> = {
      name,
      description: (input.description as string | undefined) ?? "",
      stypeId: (input.stype_id as number | undefined) ?? 1,
      mpCost: (input.mp_cost as number | undefined) ?? 0,
      tpCost: (input.tp_cost as number | undefined) ?? 0,
      scope: (input.scope as number | undefined) ?? 1,
      occasion: (input.occasion as number | undefined) ?? 1,
      speed: (input.speed as number | undefined) ?? 0,
      successRate: (input.success_rate as number | undefined) ?? 100,
      repeats: (input.repeats as number | undefined) ?? 1,
      tpGain: (input.tp_gain as number | undefined) ?? 0,
      hitType: (input.hit_type as number | undefined) ?? 1,
      animationId: (input.animation_id as number | undefined) ?? 0,
      message1: (input.message1 as string | undefined) ?? "",
      message2: (input.message2 as string | undefined) ?? "",
      iconIndex: (input.icon_index as number | undefined) ?? 0,
      requiredWtypeId1: (input.required_wtype_id1 as number | undefined) ?? 0,
      requiredWtypeId2: (input.required_wtype_id2 as number | undefined) ?? 0,
      note: (input.note as string | undefined) ?? "",
      effects: [],
      traits: [],
      damage: {
        type: (input.damage_type as number | undefined) ?? 0,
        elementId: (input.damage_element_id as number | undefined) ?? 0,
        formula: (input.damage_formula as string | undefined) ?? "0",
        variance: (input.damage_variance as number | undefined) ?? 20,
        critical: (input.damage_critical as boolean | undefined) ?? false,
      },
    };

    const newId = writer.addSkill(skillData);

    changeLog.append({
      tool: "create-skill",
      entityType: "Skill",
      entityId: newId,
      action: "create",
      summary: `Skill ${newId} created: name='${name}'`,
    });

    return JSON.stringify({ success: true, skill_id: newId, name });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
