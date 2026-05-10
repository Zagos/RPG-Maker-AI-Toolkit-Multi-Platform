import { RPGMakerValidator } from "../rpgmaker/validator.js";
import type { HandlerContext } from "./types.js";

export async function handleEditActor(ctx: HandlerContext): Promise<string> {
  const { input, writer } = ctx;
  const actorId = input.actor_id as number | undefined;
  const name = input.name as string;

  const actorData = {
    name,
    nickname: (input.nickname as string | undefined) || "",
    classId: (input.class_id as number | undefined) || 1,
    initialLevel: (input.initial_level as number | undefined) || 1,
    maxLevel: (input.max_level as number | undefined) || 99,
  };

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
