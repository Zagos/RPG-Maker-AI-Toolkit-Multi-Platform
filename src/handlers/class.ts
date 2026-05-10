import type { HandlerContext } from "./types.js";

export async function handleEditClass(ctx: HandlerContext): Promise<string> {
  const { input, writer, reader } = ctx;
  const classId = input.class_id as number | undefined;

  const updates: Record<string, unknown> = { name: input.name };

  try {
    if (classId) {
      const existing = reader.readClass(classId);
      if (!existing) return JSON.stringify({ error: `Class ${classId} not found` });

      if (
        input.exp_basis !== undefined || input.exp_extra !== undefined ||
        input.exp_acc_a !== undefined || input.exp_acc_b !== undefined
      ) {
        const ep = [...((existing.expParams as number[] | undefined) || [30, 20, 30, 30])];
        if (input.exp_basis !== undefined) ep[0] = input.exp_basis as number;
        if (input.exp_extra !== undefined) ep[1] = input.exp_extra as number;
        if (input.exp_acc_a !== undefined) ep[2] = input.exp_acc_a as number;
        if (input.exp_acc_b !== undefined) ep[3] = input.exp_acc_b as number;
        updates.expParams = ep;
      }

      writer.updateClass(classId, updates);
      ctx.changeLog.append({ tool: "edit-class", entityType: "Class", entityId: classId, action: "update", summary: `Class ${classId} updated: name='${input.name}'` });
      return JSON.stringify({ success: true, message: `Class ${classId} updated`, class_id: classId });
    } else {
      updates.expParams = [
        (input.exp_basis as number | undefined) ?? 30,
        (input.exp_extra as number | undefined) ?? 20,
        (input.exp_acc_a as number | undefined) ?? 30,
        (input.exp_acc_b as number | undefined) ?? 30,
      ];
      // Default params curve: 21 levels × 8 parameters, all zeros (editor will fill later)
      updates.params = Array.from({ length: 8 }, () => Array(100).fill(0));
      updates.traits = [];
      updates.learnings = [];
      updates.note = "";
      const newId = writer.addClass(updates);
      ctx.changeLog.append({ tool: "edit-class", entityType: "Class", entityId: newId, action: "create", summary: `Class created: name='${input.name}'` });
      return JSON.stringify({ success: true, message: "Class created", class_id: newId });
    }
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
