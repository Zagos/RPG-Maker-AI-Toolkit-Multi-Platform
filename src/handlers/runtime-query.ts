import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";

function notConnected(): string {
  return JSON.stringify({ error: "Game not connected. Start the game with the RPGMakerDebugger plugin enabled." });
}

export async function handleGetInventory(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge } = ctx;
  if (!debugBridge.connected) return notConnected();
  const category = (input.category as string | undefined) ?? "all";

  const script = `(function(){
    var result = {};
    if ('${category}' === 'items' || '${category}' === 'all') {
      result.items = $gameParty.items().map(function(i){return{id:i.id,name:i.name,count:$gameParty.numItems(i)};});
    }
    if ('${category}' === 'weapons' || '${category}' === 'all') {
      result.weapons = $gameParty.weapons().map(function(w){return{id:w.id,name:w.name,count:$gameParty.numItems(w)};});
    }
    if ('${category}' === 'armors' || '${category}' === 'all') {
      result.armors = $gameParty.armors().map(function(a){return{id:a.id,name:a.name,count:$gameParty.numItems(a)};});
    }
    result.gold = $gameParty.gold();
    fetch('http://127.0.0.1:9001/gamestate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mapId:$gameMap.mapId(),playerX:$gamePlayer.x,playerY:$gamePlayer.y,gold:$gameParty.gold(),partyMembers:$gameParty.members().map(function(m){return{name:m.name(),hp:m.hp,mhp:m.mhp,level:m.level};}),inBattle:$gameParty.inBattle(),timestamp:new Date().toISOString(),queryResult:result})});
  })();`;

  try {
    debugBridge.setCommand("execute_script", { code: script });
    const state = await debugBridge.waitForGameState(8000);
    const stateRecord = state as unknown as Record<string, unknown>;
    return JSON.stringify({ success: true, category, inventory: stateRecord.queryResult ?? state });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleModifyInventory(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge, changeLog } = ctx;
  if (!debugBridge.connected) return notConnected();

  const operations = input.operations as Array<{ action: string; type: string; id?: number; amount: number }>;
  if (!operations || operations.length === 0) return JSON.stringify({ error: "operations array is required" });

  const lines: string[] = [];
  for (const op of operations) {
    const amount = op.action === "remove" ? -op.amount : op.amount;
    if (op.type === "gold") {
      lines.push(`$gameParty.gainGold(${amount});`);
    } else if (op.type === "item" && op.id) {
      lines.push(`$gameParty.gainItem($dataItems[${op.id}], ${amount});`);
    } else if (op.type === "weapon" && op.id) {
      lines.push(`$gameParty.gainItem($dataWeapons[${op.id}], ${amount});`);
    } else if (op.type === "armor" && op.id) {
      lines.push(`$gameParty.gainItem($dataArmors[${op.id}], ${amount});`);
    }
  }

  const code = lines.join(" ");
  try {
    debugBridge.setCommand("execute_script", { code });
    const ok = await debugBridge.waitForAck(8000);
    if (!ok) return JSON.stringify({ error: "Timed out waiting for game confirmation" });
    changeLog.append({ tool: "modify-inventory", entityType: "Inventory", action: "update", summary: `Inventory modified: ${operations.length} operations` });
    return JSON.stringify({ success: true, operations_applied: operations.length });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleGetSwitch(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge, projectPath } = ctx;
  if (!debugBridge.connected) return notConnected();
  const id = input.id as number;

  // Read switch name from System.json
  let name = `Switch ${id}`;
  try {
    const sys = JSON.parse(fs.readFileSync(path.join(projectPath, "data", "System.json"), "utf-8")) as Record<string, unknown>;
    const switches = sys.switches as string[] | undefined;
    if (switches && switches[id]) name = switches[id];
  } catch { /* ignore */ }

  const script = `(function(){
    var v=$gameSwitches.value(${id});
    fetch('http://127.0.0.1:9001/gamestate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mapId:$gameMap.mapId(),playerX:$gamePlayer.x,playerY:$gamePlayer.y,gold:$gameParty.gold(),partyMembers:[],inBattle:$gameParty.inBattle(),timestamp:new Date().toISOString(),queryResult:{switchId:${id},value:v}})});
  })();`;

  try {
    debugBridge.setCommand("execute_script", { code: script });
    const state = await debugBridge.waitForGameState(8000);
    const qr = (state as unknown as Record<string, unknown>).queryResult as { switchId: number; value: boolean } | undefined;
    return JSON.stringify({ success: true, id, name, value: qr?.value ?? null });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleGetVariable(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge, projectPath } = ctx;
  if (!debugBridge.connected) return notConnected();
  const id = input.id as number;

  let name = `Variable ${id}`;
  try {
    const sys = JSON.parse(fs.readFileSync(path.join(projectPath, "data", "System.json"), "utf-8")) as Record<string, unknown>;
    const variables = sys.variables as string[] | undefined;
    if (variables && variables[id]) name = variables[id];
  } catch { /* ignore */ }

  const script = `(function(){
    var v=$gameVariables.value(${id});
    fetch('http://127.0.0.1:9001/gamestate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mapId:$gameMap.mapId(),playerX:$gamePlayer.x,playerY:$gamePlayer.y,gold:$gameParty.gold(),partyMembers:[],inBattle:$gameParty.inBattle(),timestamp:new Date().toISOString(),queryResult:{variableId:${id},value:v}})});
  })();`;

  try {
    debugBridge.setCommand("execute_script", { code: script });
    const state = await debugBridge.waitForGameState(8000);
    const qr = (state as unknown as Record<string, unknown>).queryResult as { variableId: number; value: unknown } | undefined;
    return JSON.stringify({ success: true, id, name, value: qr?.value ?? null });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleCallCommonEvent(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge, projectPath, changeLog } = ctx;
  if (!debugBridge.connected) return notConnected();
  const eventId = input.common_event_id as number;

  // Validate event exists
  try {
    const filePath = path.join(projectPath, "data", "CommonEvents.json");
    if (fs.existsSync(filePath)) {
      const events = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<Record<string, unknown> | null>;
      const exists = events.some(e => e !== null && (e as Record<string, unknown>).id === eventId);
      if (!exists) return JSON.stringify({ error: `CommonEvent ${eventId} not found` });
    }
  } catch { /* ignore */ }

  const code = `$gameTemp.reserveCommonEvent(${eventId});`;
  try {
    debugBridge.setCommand("execute_script", { code });
    const ok = await debugBridge.waitForAck(8000);
    if (!ok) return JSON.stringify({ error: "Timed out waiting for game confirmation" });
    changeLog.append({ tool: "call-common-event", entityType: "CommonEvent", entityId: eventId, action: "update", summary: `CommonEvent ${eventId} triggered at runtime` });
    return JSON.stringify({ success: true, common_event_id: eventId });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

export async function handleModifyActorRuntime(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge, changeLog } = ctx;
  if (!debugBridge.connected) return notConnected();
  const actorId = input.actor_id as number;
  const operations = input.operations as Array<{ field: string; mode: string; value: number }>;
  if (!operations || operations.length === 0) return JSON.stringify({ error: "operations array is required" });

  const lines: string[] = [`var a = $gameActors.actor(${actorId});`, `if (!a) return;`];
  for (const op of operations) {
    const v = op.value;
    const set = op.mode === "set";
    switch (op.field) {
      case "level": lines.push(set ? `a.changeLevel(${v}, false);` : `a.changeLevel(a.level + (${v}), false);`); break;
      case "exp": lines.push(set ? `a.changeExp(${v}, false);` : `a.gainExp(${v}, false);`); break;
      case "hp": lines.push(set ? `a.setHp(${v});` : `a.gainHp(${v});`); break;
      case "mp": lines.push(set ? `a.setMp(${v});` : `a.gainMp(${v});`); break;
      case "tp": lines.push(set ? `a.setTp(${v});` : `a.gainTp(${v});`); break;
    }
  }
  const code = `(function(){${lines.join(" ")}})();`;

  try {
    debugBridge.setCommand("execute_script", { code });
    const ok = await debugBridge.waitForAck(8000);
    if (!ok) return JSON.stringify({ error: "Timed out waiting for game confirmation" });
    changeLog.append({ tool: "modify-actor-runtime", entityType: "Actor", entityId: actorId, action: "update", summary: `Actor ${actorId} modified at runtime: ${operations.length} operations` });
    return JSON.stringify({ success: true, actor_id: actorId, operations_applied: operations.length });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
