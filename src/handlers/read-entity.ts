import type { HandlerContext } from "./types.js";

const ENTITY_TYPE_MAP: Record<string, (ctx: HandlerContext, id: number) => unknown> = {
  Actor: (ctx, id) => ctx.reader.readActor(id),
  Item: (ctx, id) => ctx.reader.readItem(id),
  Enemy: (ctx, id) => ctx.reader.readEnemy(id),
  Weapon: (ctx, id) => ctx.reader.readWeapon(id),
  Armor: (ctx, id) => ctx.reader.readArmor(id),
  Skill: (ctx, id) => ctx.reader.readSkill(id),
  Class: (ctx, id) => ctx.reader.readClass(id),
  State: (ctx, id) => ctx.reader.readState(id),
  Troop: (ctx, id) => ctx.reader.readTroop(id),
  CommonEvent: (ctx, id) => ctx.reader.readCommonEvent(id),
  Animation: (ctx, id) => ctx.reader.readAnimation(id),
  Tileset: (ctx, id) => ctx.reader.readTileset(id),
};

export async function handleReadEntity(ctx: HandlerContext): Promise<string> {
  const { input } = ctx;

  try {
    const entityType = input.entity_type as string | undefined;
    const entityId = input.entity_id as number | undefined;

    if (!entityType || !(entityType in ENTITY_TYPE_MAP)) {
      return JSON.stringify({ error: `Invalid entity_type. Valid values: ${Object.keys(ENTITY_TYPE_MAP).join(", ")}` });
    }
    if (typeof entityId !== "number" || entityId < 1) {
      return JSON.stringify({ error: "entity_id must be a positive integer" });
    }

    const entity = ENTITY_TYPE_MAP[entityType](ctx, entityId);
    if (entity === null || entity === undefined) {
      return JSON.stringify({ error: `${entityType} with ID ${entityId} not found` });
    }

    return JSON.stringify({ success: true, entity_type: entityType, entity_id: entityId, data: entity });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
