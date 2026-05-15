import type { HandlerContext } from "./types.js";

export async function handleEditState(ctx: HandlerContext): Promise<string> {
  const { input, writer } = ctx;
  const stateId = input.state_id as number | undefined;

  const updates: Record<string, unknown> = { name: input.name };
  if (input.icon_index !== undefined) updates.iconIndex = input.icon_index;
  if (input.priority !== undefined) updates.priority = input.priority;
  if (input.remove_at_battle_end !== undefined) updates.removeAtBattleEnd = input.remove_at_battle_end;
  if (input.remove_by_recover !== undefined) updates.removeByRecover = input.remove_by_recover;
  if (input.remove_by_damage !== undefined) updates.removeByDamage = input.remove_by_damage;
  if (input.damage_rate !== undefined) updates.chanceByDamage = input.damage_rate;
  if (input.min_turns !== undefined) updates.minTurns = input.min_turns;
  if (input.max_turns !== undefined) updates.maxTurns = input.max_turns;
  if (input.restriction !== undefined) updates.restriction = input.restriction;
  if (input.description !== undefined) updates.description = input.description;
  if (input.overlay !== undefined) updates.overlay = input.overlay;
  if (input.motion !== undefined) updates.motion = input.motion;
  if (input.remove_by_walking !== undefined) updates.removeByWalking = input.remove_by_walking;
  if (input.steps_to_remove !== undefined) updates.stepsToRemove = input.steps_to_remove;
  if (input.note !== undefined) updates.note = input.note;

  try {
    if (stateId) {
      writer.updateState(stateId, updates);
      ctx.changeLog.append({ tool: "edit-state", entityType: "State", entityId: stateId, action: "update", summary: `State ${stateId} updated: name='${input.name}'` });
      return JSON.stringify({ success: true, message: `State ${stateId} updated`, state_id: stateId });
    } else {
      updates.restriction = updates.restriction ?? 0;
      updates.priority = updates.priority ?? 50;
      updates.removeAtBattleEnd = updates.removeAtBattleEnd ?? false;
      updates.removeByRecover = updates.removeByRecover ?? false;
      updates.removeByDamage = updates.removeByDamage ?? false;
      updates.chanceByDamage = updates.chanceByDamage ?? 100;
      updates.maxTurns = updates.maxTurns ?? 1;
      updates.minTurns = updates.minTurns ?? 1;
      updates.traits = [];
      updates.note = "";
      updates.iconIndex = updates.iconIndex ?? 0;
      updates.message1 = "";
      updates.message2 = "";
      updates.message3 = "";
      updates.message4 = "";
      updates.motion = 0;
      updates.overlay = 0;
      updates.releaseByDamage = false;
      updates.stepToRemove = 100;
      updates.autoRemovalTiming = 0;
      const newId = writer.addState(updates);
      ctx.changeLog.append({ tool: "edit-state", entityType: "State", entityId: newId, action: "create", summary: `State created: name='${input.name}'` });
      return JSON.stringify({ success: true, message: "State created", state_id: newId });
    }
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
