import type { HandlerContext } from "./types.js";

interface TroopMemberInput {
  enemy_id: number;
  x?: number;
  y?: number;
  hidden?: boolean;
}

function defaultBattlePositions(count: number): Array<{ x: number; y: number }> {
  // Spread enemies horizontally across the right side of the battle screen.
  // Screen is roughly 816x624; enemies typically sit in the 300-700 x range.
  const positions: Array<{ x: number; y: number }> = [];
  const baseX = count === 1 ? 500 : 300;
  const stepX = count === 1 ? 0 : Math.min(200, 400 / (count - 1));
  for (let i = 0; i < count; i++) {
    positions.push({
      x: Math.round(baseX + stepX * i),
      y: i % 2 === 0 ? 400 : 340,
    });
  }
  return positions;
}

function buildMembers(raw: TroopMemberInput[]): Record<string, unknown>[] {
  const positions = defaultBattlePositions(raw.length);
  return raw.map((m, i) => ({
    enemyId: m.enemy_id,
    x: m.x ?? positions[i].x,
    y: m.y ?? positions[i].y,
    hidden: m.hidden ?? false,
  }));
}

function defaultTroopPage(): Record<string, unknown> {
  return {
    conditions: {
      actorHp: 50, actorId: 1, actorValid: false,
      enemyHp: 50, enemyIndex: 0, enemyValid: false,
      switchId: 1, switchValid: false,
      turnA: 0, turnB: 0, turnEnding: false, turnValid: false,
    },
    list: [{ code: 0, indent: 0, parameters: [] }],
    span: 0,
  };
}

export async function handleCreateTroop(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const name = (input.name as string | undefined)?.trim();
    if (!name) return JSON.stringify({ error: "name is required" });

    const rawMembers = input.members as TroopMemberInput[] | undefined;
    if (!rawMembers || rawMembers.length === 0) {
      return JSON.stringify({ error: "members array must contain at least one enemy" });
    }
    if (rawMembers.length > 8) {
      return JSON.stringify({ error: "A troop may contain at most 8 members" });
    }
    for (const m of rawMembers) {
      if (typeof m.enemy_id !== "number" || m.enemy_id < 1) {
        return JSON.stringify({ error: `Invalid enemy_id: ${m.enemy_id}` });
      }
    }

    const troopData = {
      name,
      members: buildMembers(rawMembers),
      pages: [defaultTroopPage()],
    };

    const newId = writer.addTroop(troopData);

    changeLog.append({
      tool: "create-troop",
      entityType: "Troop",
      entityId: newId,
      action: "create",
      summary: `Troop ${newId} created: name='${name}' members=${rawMembers.length}`,
    });

    return JSON.stringify({
      success: true,
      troop_id: newId,
      name,
      member_count: rawMembers.length,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleEditTroop(ctx: HandlerContext): Promise<string> {
  const { input, writer, changeLog } = ctx;

  try {
    const troopId = input.troop_id as number | undefined;
    if (typeof troopId !== "number" || troopId < 1) {
      return JSON.stringify({ error: "troop_id is required and must be a positive integer" });
    }

    const updates: Record<string, unknown> = {};

    if (input.name !== undefined) {
      const name = (input.name as string).trim();
      if (!name) return JSON.stringify({ error: "name must not be empty" });
      updates.name = name;
    }

    if (input.members !== undefined) {
      const rawMembers = input.members as TroopMemberInput[];
      if (!Array.isArray(rawMembers) || rawMembers.length === 0) {
        return JSON.stringify({ error: "members must be a non-empty array" });
      }
      if (rawMembers.length > 8) {
        return JSON.stringify({ error: "A troop may contain at most 8 members" });
      }
      for (const m of rawMembers) {
        if (typeof m.enemy_id !== "number" || m.enemy_id < 1) {
          return JSON.stringify({ error: `Invalid enemy_id: ${m.enemy_id}` });
        }
      }
      updates.members = buildMembers(rawMembers);
    }

    if (Object.keys(updates).length === 0) {
      return JSON.stringify({ error: "No fields to update. Provide name and/or members." });
    }

    writer.updateTroop(troopId, updates);

    const summary = Object.entries(updates)
      .map(([k, v]) => `${k}=${k === "members" ? (v as unknown[]).length + " members" : JSON.stringify(v)}`)
      .join(", ");

    changeLog.append({
      tool: "edit-troop",
      entityType: "Troop",
      entityId: troopId,
      action: "update",
      summary: `Troop ${troopId} updated: ${summary}`,
    });

    return JSON.stringify({ success: true, troop_id: troopId, updated: Object.keys(updates) });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
