import { RPGMakerValidator } from "../adapters/mz/validator.js";
import type { HandlerContext } from "./types.js";

export async function handleEditActor(ctx: HandlerContext): Promise<string> {
  const { input, writer } = ctx;
  const actorId = input.actor_id as number | undefined;
  const name = input.name as string;

  const actorData: Record<string, unknown> = {
    name,
    nickname: (input.nickname as string | undefined) || "",
    classId: (input.class_id as number | undefined) || 1,
    initialLevel: (input.initial_level as number | undefined) || 1,
    maxLevel: (input.max_level as number | undefined) || 99,
  };

  if (input.face) {
    const face = input.face as { name?: string; index?: number };
    if (face.name !== undefined) actorData.faceName = face.name;
    if (face.index !== undefined) actorData.faceIndex = face.index;
  }
  if (input.character) {
    const char = input.character as { name?: string; index?: number };
    if (char.name !== undefined) actorData.characterName = char.name;
    if (char.index !== undefined) actorData.characterIndex = char.index;
  }
  if (input.battler_name !== undefined) actorData.battlerName = input.battler_name;
  if (input.equips !== undefined) actorData.equips = input.equips;
  if (input.profile !== undefined) actorData.profile = input.profile;
  if (input.note !== undefined) actorData.note = input.note;

  const validation = RPGMakerValidator.validateActor(actorData);
  if (!validation.valid) {
    return JSON.stringify({ error: "Validation failed", errors: validation.errors });
  }

  try {
    if (actorId) {
      writer.updateActor(actorId, actorData);
      ctx.changeLog.append({ tool: "edit-actor", entityType: "Actor", entityId: actorId, action: "update", summary: `Actor ${actorId} updated: name='${name}'` });
      return JSON.stringify({ success: true, message: `Actor ${actorId} updated`, actor_id: actorId });
    } else {
      const newId = writer.addActor(actorData);
      ctx.changeLog.append({ tool: "edit-actor", entityType: "Actor", entityId: newId, action: "create", summary: `Actor created: name='${name}'` });
      return JSON.stringify({ success: true, message: "Actor created", actor_id: newId });
    }
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
