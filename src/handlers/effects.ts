import type { HandlerContext } from "./types.js";

interface RPGEffect {
  code: number;
  dataId: number;
  value1: number;
  value2: number;
}

interface EffectInput {
  code: number;
  data_id: number;
  value1: number;
  value2: number;
}

type WriterFn = (id: number, updates: Record<string, unknown>) => void;

export async function handleEditEffects(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer, changeLog } = ctx;

  try {
    const entityType = input.entity_type as string;
    const entityId = input.entity_id as number;
    const mode = input.mode as string;

    if (!["Skill", "Item"].includes(entityType)) {
      return JSON.stringify({ error: "entity_type must be Skill or Item" });
    }
    if (typeof entityId !== "number" || entityId < 1) {
      return JSON.stringify({ error: "entity_id must be a positive integer" });
    }
    if (!["replace", "append", "clear"].includes(mode)) {
      return JSON.stringify({ error: "mode must be replace, append, or clear" });
    }

    const readFn = entityType === "Skill"
      ? () => reader.readSkill(entityId) as Record<string, unknown> | null
      : () => reader.readItem(entityId) as Record<string, unknown> | null;

    const writeFn: WriterFn = entityType === "Skill"
      ? (id, upd) => writer.updateSkill(id, upd)
      : (id, upd) => writer.updateItem(id, upd);

    const entity = readFn();
    if (!entity) return JSON.stringify({ error: `${entityType} ${entityId} not found` });

    if (mode === "clear") {
      writeFn(entityId, { effects: [] });
      changeLog.append({ tool: "edit-effects", entityType, entityId, action: "update", summary: `${entityType} ${entityId} effects cleared` });
      return JSON.stringify({ success: true, entity_type: entityType, entity_id: entityId, effects_count: 0 });
    }

    const inputEffects = (input.effects as EffectInput[] | undefined) ?? [];
    if (inputEffects.length === 0) {
      return JSON.stringify({ error: "effects array is required for replace and append modes" });
    }

    const newEffects: RPGEffect[] = inputEffects.map((e) => ({
      code: e.code,
      dataId: e.data_id,
      value1: e.value1,
      value2: e.value2,
    }));

    let finalEffects: RPGEffect[];

    if (mode === "replace") {
      finalEffects = newEffects;
    } else {
      const existing = (entity.effects as RPGEffect[] | undefined) ?? [];
      finalEffects = [...existing, ...newEffects];
    }

    writeFn(entityId, { effects: finalEffects });

    changeLog.append({
      tool: "edit-effects",
      entityType,
      entityId,
      action: "update",
      summary: `${entityType} ${entityId} effects ${mode}d: ${finalEffects.length} total`,
    });

    return JSON.stringify({ success: true, entity_type: entityType, entity_id: entityId, mode, effects_count: finalEffects.length });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
