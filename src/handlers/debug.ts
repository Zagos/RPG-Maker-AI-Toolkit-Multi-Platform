import * as fs from "fs";
import { spawn } from "child_process";
import type { ChildProcess } from "child_process";
import type { HandlerContext } from "./types.js";
import type { RPGMakerWriter } from "../rpgmaker/writer.js";
import type { EncounterResult, BattleLogEntry } from "../rpgmaker/debug-bridge.js";

function notConnected(): string {
  return JSON.stringify({
    error: "Game not connected. Make sure:\n1. The game is running (press Play / F5)\n2. The RPGMakerDebugger plugin is installed and enabled\n3. Wait a few seconds after the map loads",
  });
}

function createTempTroop(writer: RPGMakerWriter, projectPath: string, enemyId: number, count: number): number {
  const troopsPath = `${projectPath}/data/Troops.json`;
  const troops = JSON.parse(fs.readFileSync(troopsPath, "utf-8")) as Array<Record<string, unknown> | null>;

  const ids = troops
    .filter((t): t is Record<string, unknown> => t !== null && typeof t.id === "number")
    .map((t) => t.id as number);
  const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const members = Array.from({ length: count }, (_, i) => ({
    enemyId,
    x: 500 + i * 100,
    y: 400 + (i % 2) * 100,
    hidden: false,
  }));

  troops.push({
    id: newId,
    name: `Auto Troop (Enemy ${enemyId})`,
    members,
    pages: [{
      conditions: {
        actorHp: 50, actorId: 1, actorValid: false,
        enemyHp: 50, enemyIndex: 0, enemyValid: false,
        switchId: 1, switchValid: false,
        turnA: 0, turnB: 0, turnEnding: false, turnValid: false,
      },
      list: [{ code: 0, indent: 0, parameters: [] }],
      span: 0,
    }],
  });

  writer.writeDataFile("Troops.json", troops);
  return newId;
}

export async function handleLaunchGame(ctx: HandlerContext): Promise<string> {
  const { input, projectPath } = ctx;
  const executablePath = process.env.RPGMAKER_EXECUTABLE_PATH || "";
  const gamePath = (input.game_path as string | undefined) || executablePath;

  if (!gamePath) {
    return JSON.stringify({
      error: "No executable path configured. Set RPGMAKER_EXECUTABLE_PATH in .env or provide game_path parameter.",
    });
  }

  if (!fs.existsSync(gamePath)) {
    return JSON.stringify({ error: `Executable not found at: ${gamePath}` });
  }

  try {
    const child = spawn(gamePath, [projectPath], {
      cwd: projectPath,
      stdio: ["ignore", "ignore", "ignore"],
      detached: true,
      shell: false,
    }) as ChildProcess;
    child.unref();

    return JSON.stringify({ success: true, message: "Game process launched", executable: gamePath, pid: child.pid || 0 });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleStartEncounter(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath, debugBridge } = ctx;
  const troopId = input.troop_id as number | undefined;
  const enemyId = input.enemy_id as number | undefined;
  const count = (input.count as number) || 1;

  let resolvedTroopId = troopId;

  if (!resolvedTroopId && enemyId) {
    try {
      resolvedTroopId = createTempTroop(writer, projectPath, enemyId, count);
    } catch (error) {
      return JSON.stringify({ error: (error as Error).message });
    }
  }

  if (!resolvedTroopId) {
    return JSON.stringify({ error: "Provide either troop_id or enemy_id" });
  }

  if (!debugBridge.connected) {
    return JSON.stringify({
      error: "Game not connected. Make sure:\n1. The game is running (press Play)\n2. The RPGMakerDebugger plugin is installed and enabled\n3. Wait a few seconds after the game loads",
    });
  }

  const actionQueue = (input.actions as unknown[][] | undefined) ?? [];

  try {
    debugBridge.setCommand("start_battle", { troopId: resolvedTroopId, actionQueue });
    const result = await debugBridge.waitForBattle(120000);

    return JSON.stringify({
      success: result.success,
      battle_log: result.log,
      final_state: result.state,
      summary: result.summary || "",
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleGetGameState(ctx: HandlerContext): Promise<string> {
  const { debugBridge } = ctx;
  if (!debugBridge.connected) return notConnected();

  try {
    debugBridge.setCommand("get_state", {});
    const state = await debugBridge.waitForGameState(10000);
    return JSON.stringify({ success: true, state });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleSetSwitch(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge } = ctx;
  if (!debugBridge.connected) return notConnected();

  const id = input.id as number;
  const value = input.value as boolean;

  try {
    debugBridge.setCommand("set_switch", { id, value });
    const ok = await debugBridge.waitForAck(10000);
    if (!ok) return JSON.stringify({ error: "Timed out waiting for game to confirm set_switch" });
    ctx.changeLog.append({ tool: "set-switch", entityType: "Switch", entityId: id, action: "update", summary: `Switch ${id} = ${value}` });
    return JSON.stringify({ success: true, switch_id: id, value });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleSetVariable(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge } = ctx;
  if (!debugBridge.connected) return notConnected();

  const id = input.id as number;
  const value = input.value;

  try {
    debugBridge.setCommand("set_variable", { id, value });
    const ok = await debugBridge.waitForAck(10000);
    if (!ok) return JSON.stringify({ error: "Timed out waiting for game to confirm set_variable" });
    ctx.changeLog.append({ tool: "set-variable", entityType: "Variable", entityId: id, action: "update", summary: `Variable ${id} = ${JSON.stringify(value)}` });
    return JSON.stringify({ success: true, variable_id: id, value });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleTeleportPlayer(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge } = ctx;
  if (!debugBridge.connected) return notConnected();

  const mapId = input.map_id as number;
  const x = input.x as number;
  const y = input.y as number;
  const direction = (input.direction as number | undefined) ?? 0;

  try {
    debugBridge.setCommand("teleport", { mapId, x, y, direction });
    const ok = await debugBridge.waitForAck(10000);
    if (!ok) return JSON.stringify({ error: "Timed out waiting for game to confirm teleport" });
    ctx.changeLog.append({ tool: "teleport-player", entityType: "Player", action: "update", summary: `Teleported to map ${mapId} (${x}, ${y})` });
    return JSON.stringify({ success: true, map_id: mapId, x, y, direction });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleSetPartyState(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge } = ctx;
  if (!debugBridge.connected) return notConnected();

  const { actor_id, hp_percent, mp_percent, add_states, remove_states } = input as {
    actor_id?: number;
    hp_percent?: number;
    mp_percent?: number;
    add_states?: number[];
    remove_states?: number[];
  };

  if (hp_percent !== undefined && (hp_percent < 0 || hp_percent > 1))
    return JSON.stringify({ error: "hp_percent must be between 0.0 and 1.0" });
  if (mp_percent !== undefined && (mp_percent < 0 || mp_percent > 1))
    return JSON.stringify({ error: "mp_percent must be between 0.0 and 1.0" });

  try {
    debugBridge.setCommand("set_party_state", { actor_id, hp_percent, mp_percent, add_states, remove_states });
    const ok = await debugBridge.waitForAck(10000);
    if (!ok) return JSON.stringify({ error: "Timed out waiting for game to confirm set_party_state" });
    const target = actor_id ? `actor ${actor_id}` : "all party members";
    const changes: string[] = [];
    if (hp_percent !== undefined) changes.push(`hp=${Math.round(hp_percent * 100)}%`);
    if (mp_percent !== undefined) changes.push(`mp=${Math.round(mp_percent * 100)}%`);
    if (add_states?.length) changes.push(`+states[${add_states.join(",")}]`);
    if (remove_states?.length) changes.push(`-states[${remove_states.join(",")}]`);
    ctx.changeLog.append({ tool: "set-party-state", entityType: "Party", action: "update", summary: `${target}: ${changes.join(" ")}` });
    return JSON.stringify({ success: true, actor_id, hp_percent, mp_percent, add_states, remove_states });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleLoadGame(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge } = ctx;
  if (!debugBridge.connected) return notConnected();

  const slot = (input.slot as number | undefined) ?? 98;

  try {
    debugBridge.setCommand("load_game", { slot });
    // wait for the map to report back (loading takes longer than a simple ack)
    const state = await debugBridge.waitForGameState(20000);
    ctx.changeLog.append({ tool: "load-game", entityType: "SaveFile", entityId: slot, action: "update", summary: `Game loaded from slot ${slot}` });
    return JSON.stringify({ success: true, slot, state });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleSaveGame(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge } = ctx;
  if (!debugBridge.connected) return notConnected();

  const slot = (input.slot as number | undefined) ?? 98;

  try {
    debugBridge.setCommand("save_game", { slot });
    const ok = await debugBridge.waitForAck(10000);
    if (!ok) return JSON.stringify({ error: "Timed out waiting for game to confirm save" });
    ctx.changeLog.append({ tool: "save-game", entityType: "SaveFile", entityId: slot, action: "create", summary: `Game saved to slot ${slot}` });
    return JSON.stringify({ success: true, slot });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

// ---------------------------------------------------------------------------
// run-battle-suite
// ---------------------------------------------------------------------------

interface SuiteActorStat {
  name: string;
  avg_hp: number;
  avg_hp_percent: number;
  survival_rate: number;
}

interface SuiteSummary {
  total_runs: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_turns: number;
  actors: SuiteActorStat[];
  damage: { avg_dealt: number; avg_taken: number };
}

function aggregateSuite(results: EncounterResult[]): SuiteSummary {
  let wins = 0;
  let losses = 0;
  let totalTurns = 0;
  let totalDealt = 0;
  let totalTaken = 0;

  const actorMap = new Map<string, { sumHp: number; sumMhp: number; survived: number; count: number }>();

  for (const r of results) {
    const endEvent = r.log.find((e: BattleLogEntry) => e.type === "battle_end");
    if ((endEvent?.result as number) === 0) wins++;
    else losses++;

    totalTurns += r.state?.turn ?? 0;

    for (const actor of r.state?.actors ?? []) {
      const s = actorMap.get(actor.name) ?? { sumHp: 0, sumMhp: 0, survived: 0, count: 0 };
      s.sumHp += actor.hp;
      s.sumMhp += actor.mhp;
      s.count++;
      if (actor.hp > 0) s.survived++;
      actorMap.set(actor.name, s);
    }

    for (const ev of r.log) {
      if (ev.type !== "action") continue;
      const dmg = (ev.hpDamage as number) ?? 0;
      if ((ev.subject_type as string) === "actor") totalDealt += dmg;
      else totalTaken += dmg;
    }
  }

  const n = results.length || 1;
  return {
    total_runs: results.length,
    wins,
    losses,
    win_rate: Math.round((wins / n) * 100) / 100,
    avg_turns: Math.round((totalTurns / n) * 10) / 10,
    actors: Array.from(actorMap.entries()).map(([name, s]) => ({
      name,
      avg_hp: Math.round(s.sumHp / s.count),
      avg_hp_percent: Math.round((s.sumHp / (s.sumMhp || 1)) * 100),
      survival_rate: Math.round((s.survived / s.count) * 100) / 100,
    })),
    damage: {
      avg_dealt: Math.round(totalDealt / n),
      avg_taken: Math.round(totalTaken / n),
    },
  };
}

export async function handleRunBattleSuite(ctx: HandlerContext): Promise<string> {
  const { input, writer, projectPath, debugBridge } = ctx;
  if (!debugBridge.connected) return notConnected();

  const runs = Math.min((input.runs as number | undefined) ?? 5, 50);
  const troopId = input.troop_id as number | undefined;
  const enemyId = input.enemy_id as number | undefined;
  const count = (input.count as number | undefined) ?? 1;
  const partyState = (input.party_state as Record<string, unknown> | undefined) ?? { hp_percent: 1.0, mp_percent: 1.0 };
  const actions = (input.actions as unknown[][] | undefined) ?? [];

  let resolvedTroopId = troopId;
  if (!resolvedTroopId && enemyId) {
    try { resolvedTroopId = createTempTroop(writer, projectPath, enemyId, count); }
    catch (error) { return JSON.stringify({ error: (error as Error).message }); }
  }
  if (!resolvedTroopId) return JSON.stringify({ error: "Provide either troop_id or enemy_id" });

  const results: EncounterResult[] = [];

  try {
    for (let i = 0; i < runs; i++) {
      // Restore party state before each run
      debugBridge.setCommand("set_party_state", partyState);
      const ackOk = await debugBridge.waitForAck(10000);
      if (!ackOk) return JSON.stringify({ error: `Run ${i + 1}/${runs}: timed out restoring party state` });

      await new Promise<void>((r) => setTimeout(r, 200));

      // Run battle
      debugBridge.setCommand("start_battle", { troopId: resolvedTroopId, actionQueue: actions });
      const result = await debugBridge.waitForBattle(120000);
      if (!result.success) return JSON.stringify({ error: `Run ${i + 1}/${runs} failed: ${result.summary}` });

      results.push(result);
      await new Promise<void>((r) => setTimeout(r, 600));
    }

    const summary = aggregateSuite(results);
    ctx.changeLog.append({
      tool: "run-battle-suite",
      entityType: "Battle",
      action: "update",
      summary: `${runs} runs vs troop ${resolvedTroopId}: ${summary.wins}W/${summary.losses}L (${Math.round(summary.win_rate * 100)}% win rate)`,
    });

    return JSON.stringify({ success: true, runs, summary });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
