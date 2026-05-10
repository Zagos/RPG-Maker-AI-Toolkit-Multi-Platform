import * as fs from "fs";
import { spawn } from "child_process";
import type { ChildProcess } from "child_process";
import type { HandlerContext } from "./types.js";
import type { RPGMakerWriter } from "../rpgmaker/writer.js";

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

  try {
    debugBridge.setCommand("start_battle", { troopId: resolvedTroopId });
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
