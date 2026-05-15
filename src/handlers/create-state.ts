import type { HandlerContext } from "./types.js";

export async function handleCreateState(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const name = (input.name as string | undefined)?.trim();
    if (!name) return JSON.stringify({ error: "name is required" });

    const stateData: Record<string, unknown> = {
      name,
      iconIndex: (input.icon_index as number | undefined) ?? 0,
      priority: (input.priority as number | undefined) ?? 50,
      restriction: (input.restriction as number | undefined) ?? 0,
      overlay: (input.overlay as number | undefined) ?? 0,
      motion: (input.motion as number | undefined) ?? 0,
      minTurns: (input.min_turns as number | undefined) ?? 1,
      maxTurns: (input.max_turns as number | undefined) ?? 1,
      removeAtBattleEnd: (input.remove_at_battle_end as boolean | undefined) ?? false,
      removeByRecover: false,
      removeByRestriction: (input.remove_by_restriction as boolean | undefined) ?? false,
      autoRemovalTiming: (input.auto_removal_timing as number | undefined) ?? 0,
      removeByDamage: (input.remove_by_damage as boolean | undefined) ?? false,
      chanceByDamage: (input.chance_by_damage as number | undefined) ?? 100,
      removeByWalking: (input.remove_by_walking as boolean | undefined) ?? false,
      stepsToRemove: (input.steps_to_remove as number | undefined) ?? 100,
      note: (input.note as string | undefined) ?? "",
      message1: "",
      message2: "",
      message3: "",
      message4: "",
      traits: [],
    };

    const newId = writer.addState(stateData);

    changeLog.append({
      tool: "create-state",
      entityType: "State",
      entityId: newId,
      action: "create",
      summary: `State ${newId} created: name='${name}'`,
    });

    return JSON.stringify({ success: true, state_id: newId, name });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
