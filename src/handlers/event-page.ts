import { defaultEventPage, commandInputToEventCommands } from "../adapters/mz/commands.js";
import type { MapEventCommandInput } from "../adapters/mz/commands.js";
import type { RPGMap, RPGMapEvent } from "../adapters/mz/types/rpgmaker.js";
import type { HandlerContext } from "./types.js";

interface PageInput {
  trigger?: number;
  priority_type?: number;
  move_type?: number;
  move_speed?: number;
  move_frequency?: number;
  direction_fix?: boolean;
  walk_anime?: boolean;
  step_anime?: boolean;
  through?: boolean;
  character_name?: string;
  character_index?: number;
  conditions?: {
    switch1Valid?: boolean; switch1Id?: number;
    switch2Valid?: boolean; switch2Id?: number;
    variableValid?: boolean; variableId?: number; variableValue?: number;
    selfSwitchValid?: boolean; selfSwitchCh?: string;
    actorValid?: boolean; actorId?: number;
    itemValid?: boolean; itemId?: number;
  };
  commands?: MapEventCommandInput[];
}

function buildPage(page: PageInput) {
  const base = defaultEventPage();

  if (page.trigger !== undefined) base.trigger = page.trigger;
  if (page.priority_type !== undefined) base.priorityType = page.priority_type;
  if (page.move_type !== undefined) base.moveType = page.move_type;
  if (page.move_speed !== undefined) base.moveSpeed = page.move_speed;
  if (page.move_frequency !== undefined) base.moveFrequency = page.move_frequency;
  if (page.direction_fix !== undefined) base.directionFix = page.direction_fix;
  if (page.walk_anime !== undefined) base.walkAnime = page.walk_anime;
  if (page.step_anime !== undefined) base.stepAnime = page.step_anime;
  if (page.through !== undefined) base.through = page.through;
  if (page.character_name !== undefined) base.image.characterName = page.character_name;
  if (page.character_index !== undefined) base.image.characterIndex = page.character_index;
  if (page.conditions) base.conditions = { ...base.conditions, ...page.conditions };

  if (page.commands && page.commands.length > 0) {
    const cmds = page.commands.flatMap((cmd) => commandInputToEventCommands(cmd));
    cmds.push({ code: 0, indent: 0, parameters: [] });
    base.list = cmds;
  }

  return base;
}

export async function handleEditEventPage(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer, changeLog } = ctx;

  try {
    const mapId = input.map_id as number;
    const eventId = input.event_id as number;
    const mode = input.mode as string;

    if (typeof mapId !== "number" || mapId < 1) return JSON.stringify({ error: "map_id must be a positive integer" });
    if (typeof eventId !== "number" || eventId < 1) return JSON.stringify({ error: "event_id must be a positive integer" });
    if (!["add", "replace", "remove"].includes(mode)) return JSON.stringify({ error: "mode must be add, replace, or remove" });

    const mapData = reader.readMap(mapId) as RPGMap | null;
    if (!mapData) return JSON.stringify({ error: `Map ${mapId} not found` });

    const events = mapData.events ?? [];
    const eventIdx = events.findIndex((e): e is RPGMapEvent => Boolean(e) && (e as RPGMapEvent).id === eventId);
    if (eventIdx === -1) return JSON.stringify({ error: `Event ${eventId} not found in map ${mapId}` });

    const event = events[eventIdx] as RPGMapEvent;
    const pages = [...(event.pages ?? [])];

    if (mode === "add") {
      const pageInput = input.page as PageInput | undefined;
      if (!pageInput) return JSON.stringify({ error: "page is required for add mode" });
      pages.push(buildPage(pageInput));
    } else if (mode === "replace") {
      const pageIndex = input.page_index as number | undefined;
      if (typeof pageIndex !== "number" || pageIndex < 0 || pageIndex >= pages.length) {
        return JSON.stringify({ error: `page_index must be 0–${pages.length - 1}` });
      }
      const pageInput = input.page as PageInput | undefined;
      if (!pageInput) return JSON.stringify({ error: "page is required for replace mode" });
      pages[pageIndex] = buildPage(pageInput);
    } else {
      // remove
      const pageIndex = input.page_index as number | undefined;
      if (typeof pageIndex !== "number" || pageIndex < 0 || pageIndex >= pages.length) {
        return JSON.stringify({ error: `page_index must be 0–${pages.length - 1}` });
      }
      if (pages.length === 1) return JSON.stringify({ error: "Cannot remove the last page of an event" });
      pages.splice(pageIndex, 1);
    }

    const updatedEvent = { ...event, pages };
    const updatedEvents = [...events];
    updatedEvents[eventIdx] = updatedEvent;

    writer.writeMap(mapId, { ...mapData, events: updatedEvents });

    changeLog.append({
      tool: "edit-event-page",
      entityType: "Map",
      entityId: mapId,
      action: "update",
      summary: `Map ${mapId} event ${eventId}: page ${mode}d — ${pages.length} total pages`,
    });

    return JSON.stringify({ success: true, map_id: mapId, event_id: eventId, mode, pages_count: pages.length });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
