import type { HandlerContext } from "./types.js";

interface RPGTrait {
  code: number;
  dataId: number;
  value: number;
}

interface TraitInput {
  code: number;
  data_id: number;
  value: number;
}

const ENTITY_WRITER: Record<string, (ctx: HandlerContext, id: number, traits: RPGTrait[]) => void> = {
  Actor: (ctx, id, traits) => ctx.writer.updateActor(id, { traits }),
  Class: (ctx, id, traits) => ctx.writer.updateClass(id, { traits }),
  Enemy: (ctx, id, traits) => ctx.writer.updateEnemy(id, { traits }),
  Weapon: (ctx, id, traits) => ctx.writer.updateWeapon(id, { traits }),
  Armor: (ctx, id, traits) => ctx.writer.updateArmor(id, { traits }),
  State: (ctx, id, traits) => ctx.writer.updateState(id, { traits }),
};

const ENTITY_READER: Record<string, (ctx: HandlerContext, id: number) => Record<string, unknown> | null> = {
  Actor: (ctx, id) => ctx.reader.readActor(id) as Record<string, unknown> | null,
  Class: (ctx, id) => ctx.reader.readClass(id) as Record<string, unknown> | null,
  Enemy: (ctx, id) => ctx.reader.readEnemy(id) as Record<string, unknown> | null,
  Weapon: (ctx, id) => ctx.reader.readWeapon(id) as Record<string, unknown> | null,
  Armor: (ctx, id) => ctx.reader.readArmor(id) as Record<string, unknown> | null,
  State: (ctx, id) => ctx.reader.readState(id) as Record<string, unknown> | null,
};

export async function handleEditTraits(ctx: HandlerContext): Promise<string> {
  const { input, changeLog } = ctx;

  try {
    const entityType = input.entity_type as string;
    const entityId = input.entity_id as number;
    const mode = input.mode as string;

    if (!ENTITY_WRITER[entityType]) {
      return JSON.stringify({ error: `entity_type must be one of: ${Object.keys(ENTITY_WRITER).join(", ")}` });
    }
    if (typeof entityId !== "number" || entityId < 1) {
      return JSON.stringify({ error: "entity_id must be a positive integer" });
    }
    if (!["replace", "append", "clear"].includes(mode)) {
      return JSON.stringify({ error: "mode must be replace, append, or clear" });
    }

    const entity = ENTITY_READER[entityType](ctx, entityId);
    if (!entity) return JSON.stringify({ error: `${entityType} ${entityId} not found` });

    if (mode === "clear") {
      ENTITY_WRITER[entityType](ctx, entityId, []);
      changeLog.append({ tool: "edit-traits", entityType, entityId, action: "update", summary: `${entityType} ${entityId} traits cleared` });
      return JSON.stringify({ success: true, entity_type: entityType, entity_id: entityId, traits_count: 0 });
    }

    const inputTraits = (input.traits as TraitInput[] | undefined) ?? [];
    if (inputTraits.length === 0) {
      return JSON.stringify({ error: "traits array is required for replace and append modes" });
    }

    const newTraits: RPGTrait[] = inputTraits.map((t) => ({ code: t.code, dataId: t.data_id, value: t.value }));

    let finalTraits: RPGTrait[];

    if (mode === "replace") {
      finalTraits = newTraits;
    } else {
      // append: merge by code+dataId
      const existing = (entity.traits as RPGTrait[] | undefined) ?? [];
      const merged = [...existing];
      for (const nt of newTraits) {
        const idx = merged.findIndex((e) => e.code === nt.code && e.dataId === nt.dataId);
        if (idx >= 0) merged[idx] = nt;
        else merged.push(nt);
      }
      finalTraits = merged;
    }

    ENTITY_WRITER[entityType](ctx, entityId, finalTraits);

    changeLog.append({
      tool: "edit-traits",
      entityType,
      entityId,
      action: "update",
      summary: `${entityType} ${entityId} traits ${mode}d: ${finalTraits.length} total`,
    });

    return JSON.stringify({ success: true, entity_type: entityType, entity_id: entityId, mode, traits_count: finalTraits.length });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
