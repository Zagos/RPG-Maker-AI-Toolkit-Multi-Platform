import { commandInputToEventCommands } from "../adapters/mz/commands.js";
import type { MapEventCommandInput } from "../adapters/mz/commands.js";
import type { RPGMapEvent } from "../adapters/mz/types/rpgmaker.js";
import { RPGMakerValidator } from "../adapters/mz/validator.js";
import type { HandlerContext } from "./types.js";

export async function handleEditMapEvent(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer, changeLog } = ctx;

  try {
    const mapId = input.map_id as number | undefined;
    const eventId = input.event_id as number | undefined;
    if (typeof mapId !== "number" || mapId < 1) return JSON.stringify({ error: "map_id is required" });
    if (typeof eventId !== "number" || eventId < 1) return JSON.stringify({ error: "event_id is required" });

    const mapData = reader.readMap(mapId);
    if (!mapData) return JSON.stringify({ error: `Map ${mapId} not found` });

    const map = mapData as unknown as Record<string, unknown>;
    const events = (map.events as Array<RPGMapEvent | null>) ?? [];
    const eventIdx = events.findIndex((e) => e !== null && e.id === eventId);
    if (eventIdx === -1) return JSON.stringify({ error: `Event ${eventId} not found on map ${mapId}` });

    const event = { ...events[eventIdx] } as RPGMapEvent;
    const updated: string[] = [];

    if (input.name !== undefined) {
      const name = (input.name as string).trim();
      if (!name) return JSON.stringify({ error: "name must not be empty" });
      event.name = name;
      updated.push("name");
    }
    if (input.x !== undefined) {
      const x = input.x as number;
      const valid = RPGMakerValidator.validateMapEvent({ x, y: input.y as number ?? event.y, name: event.name }, { width: mapData.width, height: mapData.height });
      if (!valid.valid) return JSON.stringify({ error: "Coordinate validation failed", errors: valid.errors });
      event.x = x;
      updated.push("x");
    }
    if (input.y !== undefined) {
      const y = input.y as number;
      const valid = RPGMakerValidator.validateMapEvent({ x: event.x, y, name: event.name }, { width: mapData.width, height: mapData.height });
      if (!valid.valid) return JSON.stringify({ error: "Coordinate validation failed", errors: valid.errors });
      event.y = y;
      updated.push("y");
    }
    if (input.note !== undefined) { event.note = input.note as string; updated.push("note"); }

    if (input.append_commands !== undefined) {
      const rawCmds = input.append_commands as MapEventCommandInput[];
      if (event.pages && event.pages.length > 0) {
        const page = event.pages[0];
        const list = [...(page.list ?? [])];
        // Insert before the terminator (code 0)
        let termIdx = -1;
        for (let i = list.length - 1; i >= 0; i--) {
          if ((list[i] as { code: number }).code === 0) { termIdx = i; break; }
        }
        const newCmds = rawCmds.flatMap((c) => commandInputToEventCommands(c));
        if (termIdx >= 0) {
          list.splice(termIdx, 0, ...newCmds);
        } else {
          list.push(...newCmds, { code: 0, indent: 0, parameters: [] });
        }
        event.pages[0] = { ...page, list };
        updated.push("append_commands");
      }
    }

    if (updated.length === 0) {
      return JSON.stringify({ error: "No fields to update. Provide at least one of: name, x, y, note, append_commands." });
    }

    events[eventIdx] = event;
    map.events = events;
    writer.writeMap(mapId, map);

    changeLog.append({
      tool: "edit-map-event",
      entityType: "MapEvent",
      entityId: eventId,
      action: "update",
      summary: `Map ${mapId} event ${eventId} updated: ${updated.join(", ")}`,
    });

    return JSON.stringify({ success: true, map_id: mapId, event_id: eventId, updated });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleDeleteMapEvent(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer, changeLog } = ctx;

  try {
    const mapId = input.map_id as number | undefined;
    const eventId = input.event_id as number | undefined;
    if (typeof mapId !== "number" || mapId < 1) return JSON.stringify({ error: "map_id is required" });
    if (typeof eventId !== "number" || eventId < 1) return JSON.stringify({ error: "event_id is required" });

    const mapData = reader.readMap(mapId);
    if (!mapData) return JSON.stringify({ error: `Map ${mapId} not found` });

    const map = mapData as unknown as Record<string, unknown>;
    const events = (map.events as Array<RPGMapEvent | null>) ?? [];
    const eventIdx = events.findIndex((e) => e !== null && e.id === eventId);
    if (eventIdx === -1) return JSON.stringify({ error: `Event ${eventId} not found on map ${mapId}` });

    events[eventIdx] = null;
    map.events = events;
    writer.writeMap(mapId, map);

    changeLog.append({
      tool: "delete-map-event",
      entityType: "MapEvent",
      entityId: eventId,
      action: "delete",
      summary: `Map ${mapId} event ${eventId} deleted`,
    });

    return JSON.stringify({ success: true, map_id: mapId, event_id: eventId });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
