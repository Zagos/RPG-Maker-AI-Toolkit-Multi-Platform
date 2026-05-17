import { RPGMakerValidator } from "../adapters/mz/validator.js";
import type { HandlerContext } from "./types.js";

export async function handleCreateActor(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const name = (input.name as string | undefined)?.trim();
    if (!name) return JSON.stringify({ error: "name is required" });

    const actorData: Record<string, unknown> = {
      name,
      nickname: (input.nickname as string | undefined) ?? "",
      classId: (input.class_id as number | undefined) ?? 1,
      initialLevel: (input.initial_level as number | undefined) ?? 1,
      maxLevel: (input.max_level as number | undefined) ?? 99,
      faceName: (input.face_name as string | undefined) ?? "",
      faceIndex: (input.face_index as number | undefined) ?? 0,
      characterName: (input.character_name as string | undefined) ?? "",
      characterIndex: (input.character_index as number | undefined) ?? 0,
      battlerName: (input.battler_name as string | undefined) ?? "",
      profile: (input.profile as string | undefined) ?? "",
      note: (input.note as string | undefined) ?? "",
      equips: [0, 0, 0, 0, 0],
      traits: [],
    };

    const validation = RPGMakerValidator.validateActor(actorData);
    if (!validation.valid) {
      return JSON.stringify({ error: "Validation failed", errors: validation.errors });
    }

    const newId = writer.addActor(actorData);

    changeLog.append({
      tool: "create-actor",
      entityType: "Actor",
      entityId: newId,
      action: "create",
      summary: `Actor ${newId} created: name='${name}'`,
    });

    return JSON.stringify({ success: true, actor_id: newId, name });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
