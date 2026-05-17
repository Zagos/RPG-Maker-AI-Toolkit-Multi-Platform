import { commandInputToEventCommands } from "../adapters/mz/commands.js";
import type { MapEventCommandInput } from "../adapters/mz/commands.js";
import type { HandlerContext } from "./types.js";

function buildCommandList(commands: MapEventCommandInput[]): unknown[] {
  const list: unknown[] = [];
  for (const cmd of commands) {
    list.push(...commandInputToEventCommands(cmd));
  }
  list.push({ code: 0, indent: 0, parameters: [] });
  return list;
}

export async function handleCreateCommonEvent(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const name = (input.name as string | undefined)?.trim();
    if (!name) return JSON.stringify({ error: "name is required" });

    const trigger = (input.trigger as number | undefined) ?? 0;
    if (![0, 1, 2].includes(trigger)) {
      return JSON.stringify({ error: "trigger must be 0 (None), 1 (Autorun) or 2 (Parallel)" });
    }

    const switchId = (input.switch_id as number | undefined) ?? 1;
    if (trigger > 0 && (!switchId || switchId < 1)) {
      return JSON.stringify({ error: "switch_id is required when trigger is 1 or 2" });
    }

    const rawCommands = (input.commands as MapEventCommandInput[] | undefined) ?? [];
    const list = buildCommandList(rawCommands);

    const eventData: Record<string, unknown> = { name, trigger, switchId, list };
    const newId = writer.addCommonEvent(eventData);

    changeLog.append({
      tool: "create-common-event",
      entityType: "CommonEvent",
      entityId: newId,
      action: "create",
      summary: `Common event ${newId} created: name='${name}' trigger=${trigger}`,
    });

    return JSON.stringify({ success: true, event_id: newId, name, trigger });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleEditCommonEvent(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const eventId = input.event_id as number | undefined;
    if (typeof eventId !== "number" || eventId < 1) {
      return JSON.stringify({ error: "event_id is required and must be a positive integer" });
    }

    const updates: Record<string, unknown> = {};

    if (input.name !== undefined) {
      const name = (input.name as string).trim();
      if (!name) return JSON.stringify({ error: "name must not be empty" });
      updates.name = name;
    }

    if (input.trigger !== undefined) {
      const trigger = input.trigger as number;
      if (![0, 1, 2].includes(trigger)) {
        return JSON.stringify({ error: "trigger must be 0, 1 or 2" });
      }
      updates.trigger = trigger;
    }

    if (input.switch_id !== undefined) {
      updates.switchId = input.switch_id as number;
    }

    if (input.commands !== undefined) {
      const rawCommands = input.commands as MapEventCommandInput[];
      updates.list = buildCommandList(rawCommands);
    }

    if (Object.keys(updates).length === 0) {
      return JSON.stringify({ error: "No fields to update. Provide at least one of: name, trigger, switch_id, commands." });
    }

    writer.updateCommonEvent(eventId, updates);

    changeLog.append({
      tool: "edit-common-event",
      entityType: "CommonEvent",
      entityId: eventId,
      action: "update",
      summary: `Common event ${eventId} updated: ${Object.keys(updates).join(", ")}`,
    });

    return JSON.stringify({ success: true, event_id: eventId, updated: Object.keys(updates) });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
