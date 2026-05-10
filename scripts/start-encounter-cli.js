import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";

const BRIDGE_PORT = 9001;
const RPGMAKER_PROJECT_PATH =
  process.env.RPGMAKER_PROJECT_PATH ||
  "C:\\Users\\tcl_m\\Documents\\RMMZ\\Project1";
const RPGMAKER_EXECUTABLE =
  process.env.RPGMAKER_EXECUTABLE_PATH ||
  "F:\\SteamLibrary\\steamapps\\common\\RPG Maker MZ\\nwjs-win\\nw.exe";
const TIMEOUT = 120000;

let pendingCmd = null;
let events = [];
let finalState = null;
let connected = false;

function createTempTroop(enemyId, count) {
  const troopsPath = path.join(RPGMAKER_PROJECT_PATH, "data", "Troops.json");
  const troops = JSON.parse(fs.readFileSync(troopsPath, "utf-8"));
  const ids = troops
    .filter((t) => t !== null && typeof t.id === "number")
    .map((t) => t.id);
  const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

  const members = [];
  for (let i = 0; i < count; i++) {
    members.push({
      enemyId,
      x: 500 + i * 100,
      y: 400 + (i % 2) * 100,
      hidden: false,
    });
  }

  troops.push({
    id: newId,
    name: `Auto Troop (Enemy ${enemyId})`,
    members,
    pages: [
      {
        conditions: {
          actorHp: 50,
          actorId: 1,
          actorValid: false,
          enemyHp: 50,
          enemyIndex: 0,
          enemyValid: false,
          switchId: 1,
          switchValid: false,
          turnA: 0,
          turnB: 0,
          turnEnding: false,
          turnValid: false,
        },
        list: [{ code: 0, indent: 0, parameters: [] }],
        span: 0,
      },
    ],
  });

  fs.writeFileSync(troopsPath, JSON.stringify(troops, null, 2));
  return newId;
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || "/";

  if (req.method === "GET" && url === "/ping") {
    connected = true;
    if (pendingCmd) {
      const cmd = pendingCmd;
      pendingCmd = null;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(cmd));
    } else {
      res.writeHead(204);
      res.end();
    }
    return;
  }

  if (req.method === "POST" && url === "/log") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        events.push(JSON.parse(body));
      } catch {}
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok" }));
    });
    return;
  }

  if (req.method === "POST" && url === "/state") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const state = JSON.parse(body);
        finalState = state;
        if (!state.inBattle || state.battleOver) {
          console.error("[BATTLE] Battle ended");
        }
      } catch {}
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok" }));
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(BRIDGE_PORT, "127.0.0.1", () => {
  console.error("[BRIDGE] HTTP battle bridge on port 9001");
});

async function waitForGame() {
  console.error("[BRIDGE] Waiting for game to connect...");
  const start = Date.now();
  while (!connected && Date.now() - start < 30000) {
    await new Promise((r) => setTimeout(r, 200));
  }
  if (!connected) {
    throw new Error("Game did not connect within 30s");
  }
  console.error("[BRIDGE] Game connected!");
}

async function waitForBattle() {
  console.error("[BATTLE] Waiting for battle to complete...");
  const start = Date.now();
  while (Date.now() - start < TIMEOUT) {
    if (finalState && finalState.battleOver) {
      return { success: true, state: finalState, log: events };
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return { success: false, log: events, state: finalState };
}

const troopId = parseInt(process.argv[2]) || undefined;
const enemyId = parseInt(process.argv[3]) || undefined;
const count = parseInt(process.argv[4]) || 1;

async function main() {
  // Determine troop ID
  let resolvedTroopId = troopId;
  if (!resolvedTroopId && enemyId) {
    resolvedTroopId = createTempTroop(enemyId, count);
    console.error(`[TROOP] Created temp troop #${resolvedTroopId}`);
  }
  if (!resolvedTroopId) {
    resolvedTroopId = 1;
    console.error("[TROOP] Using troop #1");
  }

  // Launch game
  console.error(`[LAUNCH] Starting game: ${RPGMAKER_EXECUTABLE}`);
  const child = spawn(RPGMAKER_EXECUTABLE, [RPGMAKER_PROJECT_PATH], {
    detached: true,
    stdio: ["ignore", "ignore", "ignore"],
    shell: false,
  });
  child.unref();
  console.error("[LAUNCH] Game launched, waiting for plugin to connect...");

  // Wait for game plugin to connect (title screen + auto new game)
  await waitForGame();

  // Wait extra for map to load (auto new game takes ~3-5s after connect)
  console.error("[BRIDGE] Waiting for map scene to load...");
  await new Promise((r) => setTimeout(r, 8000));

  // Send battle command
  pendingCmd = { command: "start_battle", troopId: resolvedTroopId };
  console.error(`[BATTLE] Command sent: start_battle troop=${resolvedTroopId}`);

  // Wait for battle result
  const result = await waitForBattle();

  if (result.success) {
    console.log(
      JSON.stringify({
        success: true,
        battle_log: result.log,
        final_state: result.state,
      })
    );
  } else {
    console.log(
      JSON.stringify({
        success: false,
        battle_log: result.log,
        error: "Battle timed out or failed",
      })
    );
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(`[FATAL] ${e.message}`);
  process.exit(1);
});
