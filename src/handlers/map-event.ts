import {
  textCommands,
  commandInputToEventCommands,
  defaultEventPage,
} from "../rpgmaker/commands.js";
import type { MapEventCommandInput } from "../rpgmaker/commands.js";
import type { RPGMapEvent } from "../types/rpgmaker.js";
import { RPGMakerValidator } from "../rpgmaker/validator.js";
import type { HandlerContext } from "./types.js";

const MOVE_TYPE_MAP = { fixed: 0, random: 1, approach: 2, custom: 3 } as const;

export async function handleCreateMapEvent(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer } = ctx;
  const mapId = input.map_id as number;
  const eventName = input.event_name as string;
  const x = input.x as number;
  const y = input.y as number;
  const eventType = input.event_type as string;
  const character = input.character as { name?: string; index?: number } | undefined;
  const pages = input.pages as Array<{
    move_type?: "fixed" | "random" | "approach" | "custom";
    move_speed?: number;
    commands?: MapEventCommandInput[];
  }> | undefined;
  const treasure = input.treasure as { item_type?: "item" | "weapon" | "armor"; item_id?: number; quantity?: number } | undefined;
  const troopId = input.troop_id as number | undefined;
  const dialogue = input.dialogue as string | undefined;

  try {
    const mapData = reader.readMap(mapId);
    if (!mapData) {
      return JSON.stringify({ error: `Map ${mapId} not found` });
    }

    const coordValidation = RPGMakerValidator.validateMapEvent({ x, y, name: eventName }, { width: mapData.width, height: mapData.height });
    if (!coordValidation.valid) {
      return JSON.stringify({ error: "Validation failed", errors: coordValidation.errors });
    }

    const existingEvents = (mapData.events || []).filter((e): e is RPGMapEvent => Boolean(e));
    const newEventId = existingEvents.length > 0 ? Math.max(...existingEvents.map((e) => e.id)) + 1 : 1;

    const generatedPages = (pages && pages.length > 0 ? pages : [{}]).map((page) => {
      const commands = [];

      if (dialogue) commands.push(...textCommands(dialogue, eventName));

      if (eventType === "enemy") {
        commands.push({ code: 301, indent: 0, parameters: [0, troopId ?? 1, true, false] });
      }

      if (eventType === "chest" && treasure?.item_id) {
        const kind = treasure.item_type === "weapon" ? 127 : treasure.item_type === "armor" ? 128 : 126;
        commands.push({ code: kind, indent: 0, parameters: [treasure.item_id, 0, 0, treasure.quantity || 1] });
        commands.push(...textCommands(`Obtained x${treasure.quantity || 1}.`));
        commands.push({ code: 123, indent: 0, parameters: ["A", 0] });
      }

      for (const cmd of page.commands || []) {
        commands.push(...commandInputToEventCommands(cmd));
      }

      commands.push({ code: 0, indent: 0, parameters: [] });

      return defaultEventPage({
        image: {
          characterIndex: character?.index || 0,
          characterName: character?.name || "",
          direction: 2,
          pattern: 0,
          tileId: 0,
        },
        moveSpeed: page.move_speed || 3,
        moveType: MOVE_TYPE_MAP[page.move_type || "fixed"],
        priorityType: eventType === "trigger" ? 0 : 1,
        trigger: eventType === "trigger" ? 1 : 0,
        list: commands,
      });
    });

    if (!mapData.events) mapData.events = [];
    const newEvent: RPGMapEvent = {
      id: newEventId,
      name: eventName,
      note: `Type: ${eventType}`,
      pages: generatedPages,
      x,
      y,
    };
    mapData.events.push(newEvent);
    writer.writeMap(mapId, mapData);
    ctx.changeLog.append({ tool: "create-map-event", entityType: "MapEvent", entityId: newEventId, action: "create", summary: `Map event '${eventName}' (id=${newEventId}) created on map ${mapId}` });

    return JSON.stringify({
      success: true,
      message: "Map event created",
      event_id: newEventId,
      map_id: mapId,
      event_name: eventName,
      pages_count: generatedPages.length,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
