import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

export async function handleCreateAnimation(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog, projectPath } = ctx;

  try {
    const name = (input.name as string | undefined)?.trim();
    if (!name) return JSON.stringify({ error: "name is required" });

    const filePath = path.join(projectPath, "data", "Animations.json");
    if (!fs.existsSync(filePath)) {
      return JSON.stringify({ error: "Animations.json not found in project data directory" });
    }

    const animations = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<Record<string, unknown> | null>;

    const existingIds = animations.filter(Boolean).map((a) => (a as Record<string, unknown>).id as number);
    const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

    const newAnimation: Record<string, unknown> = {
      id: newId,
      name,
      effectName: (input.effect_name as string | undefined) ?? "",
      displayType: (input.display_type as number | undefined) ?? 0,
      offsetX: (input.offset_x as number | undefined) ?? 0,
      offsetY: (input.offset_y as number | undefined) ?? 0,
      speed: (input.speed as number | undefined) ?? 100,
      flashTimings: [],
      soundTimings: [],
    };

    animations.push(newAnimation);

    writer.writeDataFile("Animations.json", animations);

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
