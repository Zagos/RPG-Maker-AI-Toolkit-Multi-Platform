import type { HandlerContext } from "../../handlers/types.js";
import { resolveHandler } from "../../core/resolve-handler.js";

// Maps macro entity type → the field name the internal edit-* handler expects for the ID
const ID_FIELD: Record<string, string> = {
  actor: "actor_id",
  item: "item_id",
  weapon: "weapon_id",
  armor: "armor_id",
  skill: "skill_id",
  class: "class_id",
  state: "state_id",
  enemy: "enemy_id",
  troop: "troop_id",
  "common-event": "event_id",
  animation: "animation_id",
  tileset: "tileset_id",
};

// Maps macro entity type → PascalCase used by delete-entity / duplicate-entity
const PASCAL: Record<string, string> = {
  actor: "Actor",
  item: "Item",
  weapon: "Weapon",
  armor: "Armor",
  skill: "Skill",
  class: "Class",
  state: "State",
  enemy: "Enemy",
  troop: "Troop",
  "common-event": "CommonEvent",
  animation: "Animation",
  tileset: "Tileset",
};

// Entity types that have dedicated create-* handlers
const CREATABLE = new Set(["actor","item","weapon","armor","skill","class","state","enemy","troop","common-event","animation"]);

// Special edit-only types that map directly to their own internal tool (no id_field remapping)
const SPECIAL_EDIT: Record<string, string> = {
  system: "edit-system",
  vehicle: "edit-vehicle",
  traits: "edit-traits",
  effects: "edit-effects",
  "class-learnings": "edit-class-learnings",
  "enemy-actions": "edit-enemy-actions",
  "drop-items": "edit-drop-items",
};

export async function handleGameEntity(ctx: HandlerContext): Promise<string> {
  const input = ctx.input;
  const action = input.action as string;
  const type = input.type as string;
  const id = input.id as number | undefined;
  const data = (input.data as Record<string, unknown>) || {};

  let toolName: string;
  let childInput: Record<string, unknown>;

  switch (action) {
    case "create": {
      if (!CREATABLE.has(type)) {
        return JSON.stringify({ error: `action=create is not supported for type: ${type}` });
      }
      toolName = `create-${type}`;
      childInput = { ...data };
      break;
    }

    case "edit": {
      const idField = ID_FIELD[type];
      if (idField) {
        toolName = `edit-${type}`;
        childInput = id !== undefined ? { [idField]: id, ...data } : { ...data };
      } else if (SPECIAL_EDIT[type]) {
        toolName = SPECIAL_EDIT[type];
        childInput = { ...data };
      } else {
        return JSON.stringify({ error: `Unknown entity type for action=edit: ${type}` });
      }
      break;
    }

    case "delete": {
      const pascalType = PASCAL[type];
      if (!pascalType) {
        return JSON.stringify({ error: `action=delete is not supported for type: ${type}` });
      }
      toolName = "delete-entity";
      childInput = { entity_type: pascalType, entity_id: id, confirm: true, ...data };
      break;
    }

    case "duplicate": {
      const pascalType = PASCAL[type];
      if (!pascalType) {
        return JSON.stringify({ error: `action=duplicate is not supported for type: ${type}` });
      }
      toolName = "duplicate-entity";
      childInput = { entity_type: pascalType, entity_id: id, ...data };
      break;
    }

    case "generate": {
      if (type !== "character") {
        return JSON.stringify({ error: `action=generate only supports type=character, got: ${type}` });
      }
      toolName = "generate-character";
      childInput = { ...data };
      break;
    }

    default:
      return JSON.stringify({ error: `Unknown game-entity action: ${action}` });
  }

  const handler = resolveHandler(toolName, ctx.engine);
  if (!handler) {
    return JSON.stringify({ error: `Internal handler not found for: ${toolName}` });
  }

  return handler({ ...ctx, input: childInput });
}
