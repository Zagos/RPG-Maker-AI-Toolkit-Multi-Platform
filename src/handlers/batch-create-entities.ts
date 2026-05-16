import type { HandlerContext } from "./types.js";
import type { RPGMakerWriter } from "../rpgmaker/writer.js";

const WRITER_MAP: Record<string, (writer: RPGMakerWriter, data: Record<string, unknown>) => number> = {
  Actor: (w, d) => w.addActor(d),
  Item: (w, d) => w.addItem(d),
  Weapon: (w, d) => w.addWeapon(d),
  Armor: (w, d) => w.addArmor(d),
  Skill: (w, d) => w.addSkill(d),
  Class: (w, d) => w.addClass(d),
  State: (w, d) => w.addState(d),
  Enemy: (w, d) => w.addEnemy(d),
  Troop: (w, d) => w.addTroop(d),
  CommonEvent: (w, d) => w.addCommonEvent(d),
  Animation: (w, d) => w.addAnimation(d),
  Tileset: (w, d) => w.addTileset(d),
};

export async function handleBatchCreateEntities(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;
  const entityType = input.entity_type as string;
  const entities = input.entities as Array<Record<string, unknown>> | undefined;

  const adder = WRITER_MAP[entityType];
  if (!adder) {
    return JSON.stringify({ error: `entity_type must be one of: ${Object.keys(WRITER_MAP).join(", ")}` });
  }
  if (!Array.isArray(entities) || entities.length === 0) {
    return JSON.stringify({ error: "entities must be a non-empty array" });
  }
  if (entities.length > 50) {
    return JSON.stringify({ error: "entities array exceeds maximum of 50 items" });
  }

  const results: Array<{ index: number; success: boolean; id?: number; error?: string }> = [];
  let successCount = 0;

  for (let i = 0; i < entities.length; i++) {
    try {
      const newId = adder(writer, entities[i]);
      results.push({ index: i, success: true, id: newId });
      successCount++;
    } catch (err) {
      results.push({ index: i, success: false, error: (err as Error).message });
    }
  }

  changeLog.append({
    tool: "batch-create-entities",
    entityType,
    action: "create",
    summary: `Batch created ${successCount}/${entities.length} ${entityType} entities`,
  });

  return JSON.stringify({
    success: successCount === entities.length,
    entity_type: entityType,
    total: entities.length,
    created: successCount,
    results,
  });
}
