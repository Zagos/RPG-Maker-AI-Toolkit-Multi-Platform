import { commandInputToEventCommands } from "../adapters/mz/commands.js";
import type { MapEventCommandInput } from "../adapters/mz/commands.js";
import type { HandlerContext } from "./types.js";

interface TroopPageInput {
  span?: number;
  conditions?: {
    turnEnding?: boolean;
    turnValid?: boolean;
    turnA?: number;
    turnB?: number;
    enemyValid?: boolean;
    enemyIndex?: number;
    enemyHp?: number;
    actorValid?: boolean;
    actorId?: number;
    actorHp?: number;
    switchValid?: boolean;
    switchId?: number;
  };
  commands?: MapEventCommandInput[];
}

function defaultTroopConditions() {
  return {
    turnEnding: false,
    turnValid: false,
    turnA: 0,
    turnB: 0,
    enemyValid: false,
    enemyIndex: 0,
    enemyHp: 50,
    actorValid: false,
    actorId: 1,
    actorHp: 50,
    switchValid: false,
    switchId: 1,
  };
}

function buildTroopPage(page: TroopPageInput) {
  const conditions = { ...defaultTroopConditions(), ...(page.conditions ?? {}) };
  const span = page.span ?? 0;

  const list = (page.commands ?? []).flatMap((cmd) => commandInputToEventCommands(cmd));
  list.push({ code: 0, indent: 0, parameters: [] });

  return { conditions, list, span };
}

export async function handleEditTroopEvents(ctx: HandlerContext): Promise<string> {
  const { input, reader, writer, changeLog } = ctx;

  try {
    const troopId = input.troop_id as number;
    const mode = input.mode as string;

    if (typeof troopId !== "number" || troopId < 1) {
      return JSON.stringify({ error: "troop_id must be a positive integer" });
    }
    if (!["replace_all", "append", "clear"].includes(mode)) {
      return JSON.stringify({ error: "mode must be replace_all, append, or clear" });
    }

    const troop = reader.readTroop(troopId);
    if (!troop) return JSON.stringify({ error: `Troop ${troopId} not found` });

    if (mode === "clear") {
      writer.updateTroop(troopId, { pages: [] });
      changeLog.append({ tool: "edit-troop-events", entityType: "Troop", entityId: troopId, action: "update", summary: `Troop ${troopId} battle event pages cleared` });
      return JSON.stringify({ success: true, troop_id: troopId, pages_count: 0 });
    }

    const pageInputs = (input.pages as TroopPageInput[] | undefined) ?? [];
    if (pageInputs.length === 0) {
      return JSON.stringify({ error: "pages array is required for replace_all and append modes" });
    }

    const builtPages = pageInputs.map(buildTroopPage);

    let finalPages: unknown[];
    if (mode === "replace_all") {
      finalPages = builtPages;
    } else {
      const existing = (troop.pages as unknown[] | undefined) ?? [];
      finalPages = [...existing, ...builtPages];
    }

    writer.updateTroop(troopId, { pages: finalPages });

    changeLog.append({
      tool: "edit-troop-events",
      entityType: "Troop",
      entityId: troopId,
      action: "update",
      summary: `Troop ${troopId} battle event pages ${mode}: ${finalPages.length} total`,
    });

    return JSON.stringify({ success: true, troop_id: troopId, mode, pages_count: finalPages.length });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
