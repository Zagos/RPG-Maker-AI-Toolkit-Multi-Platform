import type { HandlerContext } from "./types.js";

export async function handleCreateAnimation(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const name = (input.name as string | undefined)?.trim();
    if (!name) return JSON.stringify({ error: "name is required" });

    const newAnimation: Record<string, unknown> = {
      name,
      effectName: (input.effect_name as string | undefined) ?? "",
      displayType: (input.display_type as number | undefined) ?? 0,
      offsetX: (input.offset_x as number | undefined) ?? 0,
      offsetY: (input.offset_y as number | undefined) ?? 0,
      speed: (input.speed as number | undefined) ?? 100,
      flashTimings: [],
      soundTimings: [],
    };

    const newId = writer.addAnimation(newAnimation);

    changeLog.append({
      tool: "create-animation",
      entityType: "Animation",
      entityId: newId,
      action: "create",
      summary: `Animation ${newId} created: name='${name}'`,
    });

    return JSON.stringify({ success: true, animation_id: newId, name });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
