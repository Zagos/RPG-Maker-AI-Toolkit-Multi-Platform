import type { HandlerContext } from "./types.js";

export async function handleCreateClass(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const name = (input.name as string | undefined)?.trim();
    if (!name) return JSON.stringify({ error: "name is required" });

    const expParams = [
      (input.exp_basis as number | undefined) ?? 30,
      (input.exp_extra as number | undefined) ?? 20,
      (input.exp_acc_a as number | undefined) ?? 30,
      (input.exp_acc_b as number | undefined) ?? 30,
    ];

    // RPG Maker MZ stores params as 8 arrays (one per stat), each with 100 elements (one per level).
    // Default to all zeros — the editor fills growth curves from expParams.
    const params = Array.from({ length: 8 }, () => Array<number>(100).fill(0));

    const classData: Record<string, unknown> = {
      name,
      note: (input.note as string | undefined) ?? "",
      expParams,
      params,
      traits: [],
      learnings: [],
    };

    const newId = writer.addClass(classData);

    changeLog.append({
      tool: "create-class",
      entityType: "Class",
      entityId: newId,
      action: "create",
      summary: `Class ${newId} created: name='${name}'`,
    });

    return JSON.stringify({ success: true, class_id: newId, name });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
