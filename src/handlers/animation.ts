import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

export async function handleReadAnimation(ctx: HandlerContext): Promise<string> {
  const { input, projectPath } = ctx;

  try {
    const filePath = path.join(projectPath, "data", "Animations.json");
    if (!fs.existsSync(filePath)) {
      return JSON.stringify({ error: "Animations.json not found in project" });
    }

    const animations = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<Record<string, unknown> | null>;
    const animationId = input.animation_id as number | undefined;

    if (animationId !== undefined) {
      if (typeof animationId !== "number" || animationId < 1) {
        return JSON.stringify({ error: "animation_id must be a positive integer" });
      }
      const anim = animations.find((a) => a !== null && (a as Record<string, unknown>).id === animationId);
      if (!anim) return JSON.stringify({ error: `Animation ${animationId} not found` });
      return JSON.stringify({ success: true, animation: anim });
    }

    // List all
    const list = animations
      .filter((a): a is Record<string, unknown> => a !== null)
      .map((a) => ({ id: a.id, name: a.name }));

    return JSON.stringify({ success: true, animations: list, count: list.length });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleEditAnimation(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath, changeLog } = ctx;

  try {
    const animationId = input.animation_id as number;
    if (typeof animationId !== "number" || animationId < 1) {
      return JSON.stringify({ error: "animation_id must be a positive integer" });
    }

    const filePath = path.join(projectPath, "data", "Animations.json");
    if (!fs.existsSync(filePath)) {
      return JSON.stringify({ error: "Animations.json not found in project" });
    }

    const animations = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<Record<string, unknown> | null>;
    const idx = animations.findIndex((a) => a !== null && (a as Record<string, unknown>).id === animationId);
    if (idx === -1) return JSON.stringify({ error: `Animation ${animationId} not found` });

    const existing = animations[idx] as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    const changes: string[] = [];

    if (input.name !== undefined) { updates.name = input.name; changes.push(`name='${input.name}'`); }
    if (input.effect_name !== undefined) { updates.effectName = input.effect_name; changes.push(`effectName='${input.effect_name}'`); }
    if (input.display_type !== undefined) { updates.displayType = input.display_type; changes.push(`displayType=${input.display_type}`); }
    if (input.offset_x !== undefined) { updates.offsetX = input.offset_x; changes.push(`offsetX=${input.offset_x}`); }
    if (input.offset_y !== undefined) { updates.offsetY = input.offset_y; changes.push(`offsetY=${input.offset_y}`); }
    if (input.speed !== undefined) { updates.speed = input.speed; changes.push(`speed=${input.speed}`); }

    if (changes.length === 0) {
      return JSON.stringify({ error: "No fields to update. Provide at least one of: name, effect_name, display_type, offset_x, offset_y, speed" });
    }

    animations[idx] = { ...existing, ...updates };
    writer.writeDataFile("Animations.json", animations);

    changeLog.append({
      tool: "edit-animation",
      entityType: "Animation",
      entityId: animationId,
      action: "update",
      summary: `Animation ${animationId} updated: ${changes.join(", ")}`,
    });

    return JSON.stringify({ success: true, animation_id: animationId, changes: changes.join(", ") });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
