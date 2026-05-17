import type { HandlerContext } from "./types.js";

// Error returned when the bridge cannot be reached
function notConnected(extra = ""): string {
  const base =
    "Ruby bridge not available. Make sure:\n" +
    "1. The game is running (press F12 or use launch-game)\n" +
    "2. The RpgMakerMCPBridge script is installed (use setup-debug-plugin)\n" +
    "3. Wait a few seconds after the map loads";
  return JSON.stringify({ error: extra ? `${base}\n${extra}` : base });
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

export async function handleGetGameStateRuby(ctx: HandlerContext): Promise<string> {
  try {
    const result = await ctx.rubyBridge.queryValue(
      `{
        map_id: $game_map.map_id,
        player_x: $game_player.x,
        player_y: $game_player.y,
        gold: $game_party.gold,
        party_members: $game_party.members.map { |m|
          { name: m.name, hp: m.hp, mhp: m.mhp, level: m.level }
        },
        in_battle: SceneManager.scene.is_a?(Scene_Battle)
      }`
    );
    return JSON.stringify({ success: true, state: result });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}

// ---------------------------------------------------------------------------
// Switches
// ---------------------------------------------------------------------------

export async function handleSetSwitchRuby(ctx: HandlerContext): Promise<string> {
  const id    = ctx.input.id    as number;
  const value = ctx.input.value as boolean;
  try {
    await ctx.rubyBridge.executeScript(`$game_switches[${id}] = ${value}`);
    ctx.changeLog.append({ tool: "set-switch", entityType: "Switch", entityId: id, action: "update", summary: `Switch ${id} = ${value}` });
    return JSON.stringify({ success: true, switch_id: id, value });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

export async function handleGetSwitchRuby(ctx: HandlerContext): Promise<string> {
  const id = ctx.input.id as number;
  let name = `Switch ${id}`;
  try {
    const sys = ctx.reader.readProjectConfig();
    const switches = sys.switches as string[] | undefined;
    if (switches?.[id]) name = switches[id];
  } catch { /* ignore */ }

  try {
    const value = await ctx.rubyBridge.queryValue(`$game_switches[${id}]`);
    return JSON.stringify({ success: true, id, name, value });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

export async function handleSetVariableRuby(ctx: HandlerContext): Promise<string> {
  const id    = ctx.input.id    as number;
  const value = ctx.input.value;
  const rubyVal = typeof value === "string" ? `"${(value as string).replace(/"/g, '\\"')}"` : String(value);
  try {
    await ctx.rubyBridge.executeScript(`$game_variables[${id}] = ${rubyVal}`);
    ctx.changeLog.append({ tool: "set-variable", entityType: "Variable", entityId: id, action: "update", summary: `Variable ${id} = ${JSON.stringify(value)}` });
    return JSON.stringify({ success: true, variable_id: id, value });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

export async function handleGetVariableRuby(ctx: HandlerContext): Promise<string> {
  const id = ctx.input.id as number;
  let name = `Variable ${id}`;
  try {
    const sys = ctx.reader.readProjectConfig();
    const variables = sys.variables as string[] | undefined;
    if (variables?.[id]) name = variables[id];
  } catch { /* ignore */ }

  try {
    const value = await ctx.rubyBridge.queryValue(`$game_variables[${id}]`);
    return JSON.stringify({ success: true, id, name, value });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Player teleport
// ---------------------------------------------------------------------------

export async function handleTeleportPlayerRuby(ctx: HandlerContext): Promise<string> {
  const mapId     = ctx.input.map_id    as number;
  const x         = ctx.input.x         as number;
  const y         = ctx.input.y         as number;
  const direction = (ctx.input.direction as number | undefined) ?? 0;
  try {
    await ctx.rubyBridge.executeScript(
      `$game_player.reserve_transfer(${mapId}, ${x}, ${y}, ${direction})`
    );
    ctx.changeLog.append({ tool: "teleport-player", entityType: "Player", action: "update", summary: `Teleported to map ${mapId} (${x}, ${y})` });
    return JSON.stringify({ success: true, map_id: mapId, x, y, direction });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Save / load
// ---------------------------------------------------------------------------

export async function handleSaveGameRuby(ctx: HandlerContext): Promise<string> {
  const slot = (ctx.input.slot as number | undefined) ?? 0;
  try {
    await ctx.rubyBridge.executeScript(`DataManager.save_game(${slot})`);
    ctx.changeLog.append({ tool: "save-game", entityType: "SaveFile", entityId: slot, action: "create", summary: `Game saved to slot ${slot}` });
    return JSON.stringify({ success: true, slot });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

export async function handleLoadGameRuby(ctx: HandlerContext): Promise<string> {
  const slot = (ctx.input.slot as number | undefined) ?? 0;
  try {
    await ctx.rubyBridge.executeScript(
      `DataManager.load_game(${slot}); SceneManager.goto(Scene_Map)`
    );
    ctx.changeLog.append({ tool: "load-game", entityType: "SaveFile", entityId: slot, action: "update", summary: `Game loaded from slot ${slot}` });
    return JSON.stringify({ success: true, slot });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Party state
// ---------------------------------------------------------------------------

export async function handleSetPartyStateRuby(ctx: HandlerContext): Promise<string> {
  const { actor_id, hp_percent, mp_percent, add_states, remove_states } = ctx.input as {
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

  const lines: string[] = [];
  const selector = actor_id ? `[$game_actors[${actor_id}]]` : "$game_party.members";
  lines.push(`${selector}.each do |actor|`);
  lines.push(`  next unless actor`);
  if (hp_percent !== undefined)  lines.push(`  actor.hp = (actor.mhp * ${hp_percent}).to_i`);
  if (mp_percent !== undefined)  lines.push(`  actor.mp = (actor.mmp * ${mp_percent}).to_i`);
  if (add_states?.length)        lines.push(`  [${add_states.join(",")}].each { |s| actor.add_state(s) }`);
  if (remove_states?.length)     lines.push(`  [${remove_states.join(",")}].each { |s| actor.remove_state(s) }`);
  lines.push(`end`);
  const code = lines.join("\n");

  try {
    await ctx.rubyBridge.executeScript(code);
    const target = actor_id ? `actor ${actor_id}` : "all party members";
    const changes: string[] = [];
    if (hp_percent !== undefined)  changes.push(`hp=${Math.round(hp_percent * 100)}%`);
    if (mp_percent !== undefined)  changes.push(`mp=${Math.round(mp_percent * 100)}%`);
    if (add_states?.length)        changes.push(`+states[${add_states.join(",")}]`);
    if (remove_states?.length)     changes.push(`-states[${remove_states.join(",")}]`);
    ctx.changeLog.append({ tool: "set-party-state", entityType: "Party", action: "update", summary: `${target}: ${changes.join(" ")}` });
    return JSON.stringify({ success: true, actor_id, hp_percent, mp_percent, add_states, remove_states });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export async function handleGetInventoryRuby(ctx: HandlerContext): Promise<string> {
  const category = (ctx.input.category as string | undefined) ?? "all";
  const code = `
result = { gold: $game_party.gold }
if ['items', 'all'].include?('${category}')
  result[:items] = $game_party.items.map { |i| { id: i.id, name: i.name, count: $game_party.item_number(i) } }
end
if ['weapons', 'all'].include?('${category}')
  result[:weapons] = $game_party.weapons.map { |w| { id: w.id, name: w.name, count: $game_party.item_number(w) } }
end
if ['armors', 'all'].include?('${category}')
  result[:armors] = $game_party.armors.map { |a| { id: a.id, name: a.name, count: $game_party.item_number(a) } }
end
result`.trim();
  try {
    const inventory = await ctx.rubyBridge.queryValue(code);
    return JSON.stringify({ success: true, category, inventory });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

export async function handleModifyInventoryRuby(ctx: HandlerContext): Promise<string> {
  const operations = ctx.input.operations as Array<{ action: string; type: string; id?: number; amount: number }>;
  if (!operations?.length) return JSON.stringify({ error: "operations array is required" });

  const lines: string[] = [];
  for (const op of operations) {
    const amount = op.action === "remove" ? -op.amount : op.amount;
    if (op.type === "gold") {
      lines.push(`$game_party.gain_gold(${amount})`);
    } else if (op.type === "item" && op.id) {
      lines.push(`$game_party.gain_item($data_items[${op.id}], ${amount}, false)`);
    } else if (op.type === "weapon" && op.id) {
      lines.push(`$game_party.gain_item($data_weapons[${op.id}], ${amount}, false)`);
    } else if (op.type === "armor" && op.id) {
      lines.push(`$game_party.gain_item($data_armors[${op.id}], ${amount}, false)`);
    }
  }
  try {
    await ctx.rubyBridge.executeScript(lines.join("; "));
    ctx.changeLog.append({ tool: "modify-inventory", entityType: "Inventory", action: "update", summary: `Inventory modified: ${operations.length} operations` });
    return JSON.stringify({ success: true, operations_applied: operations.length });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Common events
// ---------------------------------------------------------------------------

export async function handleCallCommonEventRuby(ctx: HandlerContext): Promise<string> {
  const eventId = ctx.input.common_event_id as number;
  try {
    await ctx.rubyBridge.executeScript(`$game_temp.reserve_common_event(${eventId})`);
    ctx.changeLog.append({ tool: "call-common-event", entityType: "CommonEvent", entityId: eventId, action: "update", summary: `CommonEvent ${eventId} triggered at runtime` });
    return JSON.stringify({ success: true, common_event_id: eventId });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Actor runtime
// ---------------------------------------------------------------------------

export async function handleModifyActorRuntimeRuby(ctx: HandlerContext): Promise<string> {
  const actorId   = ctx.input.actor_id   as number;
  const operations = ctx.input.operations as Array<{ field: string; mode: string; value: number }>;
  if (!operations?.length) return JSON.stringify({ error: "operations array is required" });

  const lines: string[] = [`actor = $game_actors[${actorId}]`, `return unless actor`];
  for (const op of operations) {
    const v   = op.value;
    const set = op.mode === "set";
    switch (op.field) {
      case "level": lines.push(set ? `actor.change_level(${v}, false)` : `actor.change_level(actor.level + ${v}, false)`); break;
      case "exp":   lines.push(set ? `actor.change_exp(${v}, false)` : `actor.change_exp(actor.exp + ${v}, false)`); break;
      case "hp":    lines.push(set ? `actor.hp = ${v}` : `actor.hp += ${v}`); break;
      case "mp":    lines.push(set ? `actor.mp = ${v}` : `actor.mp += ${v}`); break;
      case "tp":    lines.push(set ? `actor.tp = ${v}` : `actor.tp += ${v}`); break;
    }
  }
  try {
    await ctx.rubyBridge.executeScript(lines.join("; "));
    ctx.changeLog.append({ tool: "modify-actor-runtime", entityType: "Actor", entityId: actorId, action: "update", summary: `Actor ${actorId} modified at runtime: ${operations.length} operations` });
    return JSON.stringify({ success: true, actor_id: actorId, operations_applied: operations.length });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

export async function handleGetActorRuntimeRuby(ctx: HandlerContext): Promise<string> {
  const actorId = ctx.input.actor_id as number;
  if (!actorId) return JSON.stringify({ error: "actor_id is required" });
  try {
    const actor = await ctx.rubyBridge.queryValue(
      `actor = $game_actors[${actorId}]
       actor ? {
         id: actor.id, name: actor.name, level: actor.level,
         hp: actor.hp, max_hp: actor.mhp, mp: actor.mp, max_mp: actor.mmp,
         tp: actor.tp, exp: actor.exp,
         states: actor.states.map(&:id),
         is_alive: actor.alive?
       } : nil`
    );
    if (actor === null) return JSON.stringify({ error: `Actor ${actorId} not found in game` });
    return JSON.stringify({ success: true, actor });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Party management
// ---------------------------------------------------------------------------

export async function handleManagePartyRuntimeRuby(ctx: HandlerContext): Promise<string> {
  const action  = ctx.input.action   as "add" | "remove" | "get";
  const actorId = ctx.input.actor_id as number | undefined;

  if ((action === "add" || action === "remove") && !actorId)
    return JSON.stringify({ error: "actor_id is required for add/remove actions" });

  try {
    if (action === "get") {
      const party = await ctx.rubyBridge.queryValue(
        `$game_party.members.map { |m| { id: m.id, name: m.name, hp: m.hp, max_hp: m.mhp, level: m.level } }`
      );
      return JSON.stringify({ success: true, party });
    }
    if (action === "add") {
      await ctx.rubyBridge.executeScript(`$game_party.add_actor(${actorId})`);
      ctx.changeLog.append({ tool: "manage-party-runtime", entityType: "Actor", entityId: actorId, action: "update", summary: `Actor ${actorId} added to party at runtime` });
      return JSON.stringify({ success: true, action: "add", actor_id: actorId });
    }
    if (action === "remove") {
      await ctx.rubyBridge.executeScript(`$game_party.remove_actor(${actorId})`);
      ctx.changeLog.append({ tool: "manage-party-runtime", entityType: "Actor", entityId: actorId, action: "update", summary: `Actor ${actorId} removed from party at runtime` });
      return JSON.stringify({ success: true, action: "remove", actor_id: actorId });
    }
    return JSON.stringify({ error: `Unknown action: ${String(action)}` });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------

const WEATHER_TYPE_MAP: Record<string, number> = { none: 0, rain: 1, storm: 2, snow: 3 };

export async function handleControlWeatherRuntimeRuby(ctx: HandlerContext): Promise<string> {
  const type     = (ctx.input.type     as string) ?? "none";
  const power    = (ctx.input.power    as number) ?? 5;
  const duration = (ctx.input.duration as number) ?? 60;

  const validTypes = Object.keys(WEATHER_TYPE_MAP);
  if (!validTypes.includes(type))
    return JSON.stringify({ error: `Invalid weather type: ${type}. Must be one of: ${validTypes.join(", ")}` });

  const typeNum = WEATHER_TYPE_MAP[type];
  try {
    await ctx.rubyBridge.executeScript(`$game_screen.change_weather(${typeNum}, ${power}, ${duration})`);
    ctx.changeLog.append({ tool: "control-weather-runtime", entityType: "Screen", action: "update", summary: `Weather changed to '${type}' (power: ${power}, duration: ${duration}) at runtime` });
    return JSON.stringify({ success: true, type, power, duration });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

export async function handlePlayAudioRuntimeRuby(ctx: HandlerContext): Promise<string> {
  const type   = ctx.input.type   as string;
  const name   = ctx.input.name   as string | undefined;
  const volume = (ctx.input.volume as number) ?? 90;
  const pitch  = (ctx.input.pitch  as number) ?? 100;

  let code: string;
  switch (type) {
    case "bgm":
      if (!name) return JSON.stringify({ error: "name is required for bgm" });
      code = `RPG::BGM.new("${name}", ${volume}, ${pitch}).play`;
      break;
    case "bgs":
      if (!name) return JSON.stringify({ error: "name is required for bgs" });
      code = `RPG::BGS.new("${name}", ${volume}, ${pitch}).play`;
      break;
    case "se":
      if (!name) return JSON.stringify({ error: "name is required for se" });
      code = `RPG::SE.new("${name}", ${volume}, ${pitch}).play`;
      break;
    case "me":
      if (!name) return JSON.stringify({ error: "name is required for me" });
      code = `RPG::ME.new("${name}", ${volume}, ${pitch}).play`;
      break;
    case "stop_bgm":
      code = `RPG::BGM.new("").play`;
      break;
    case "stop_bgs":
      code = `RPG::BGS.new("").stop`;
      break;
    default:
      return JSON.stringify({ error: `Unknown audio type: ${type}. Must be one of: bgm, bgs, se, me, stop_bgm, stop_bgs` });
  }
  try {
    await ctx.rubyBridge.executeScript(code);
    ctx.changeLog.append({ tool: "play-audio-runtime", entityType: "Audio", action: "update", summary: `Audio action '${type}'${name ? ` (${name})` : ""} executed at runtime` });
    return JSON.stringify({ success: true, type, name: name ?? null, volume, pitch });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Map / battle / timer state queries
// ---------------------------------------------------------------------------

export async function handleGetMapStateRuntimeRuby(ctx: HandlerContext): Promise<string> {
  try {
    const map_state = await ctx.rubyBridge.queryValue(
      `{
        map_id: $game_map.map_id,
        map_name: $game_map.display_name,
        width: $game_map.width,
        height: $game_map.height,
        player_x: $game_player.x,
        player_y: $game_player.y,
        player_direction: $game_player.direction,
        event_count: $game_map.events.size,
        weather_type: $game_screen.weather_type,
        parallax_name: $game_map.parallax_name
      }`
    );
    return JSON.stringify({ success: true, map_state });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

export async function handleGetBattleStateRuntimeRuby(ctx: HandlerContext): Promise<string> {
  try {
    const battle = await ctx.rubyBridge.queryValue(
      `in_battle = SceneManager.scene.is_a?(Scene_Battle)
       result = { in_battle: in_battle, turn: 0, enemies: [], party: [] }
       if in_battle && $game_troop
         result[:turn]    = $game_troop.turn_count
         result[:enemies] = $game_troop.members.map { |e|
           { id: e.enemy_id, name: e.name, hp: e.hp, mhp: e.mhp, alive: e.alive? }
         }
       end
       if $game_party
         result[:party] = $game_party.members.map { |a|
           { id: a.id, name: a.name, hp: a.hp, mhp: a.mhp, alive: a.alive? }
         }
       end
       result`
    );
    return JSON.stringify({ success: true, battle });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

export async function handleControlTimerRuntimeRuby(ctx: HandlerContext): Promise<string> {
  const action = ctx.input.action as string;
  try {
    if (action === "get") {
      const timer = await ctx.rubyBridge.queryValue(
        `{ working: $game_timer.working?, seconds: $game_timer.sec }`
      );
      return JSON.stringify({ success: true, timer });
    }
    if (action === "stop") {
      await ctx.rubyBridge.executeScript(`$game_timer.stop`);
      return JSON.stringify({ success: true, action: "stop" });
    }
    // action === "start"
    const frames = ctx.input.frames as number | undefined;
    if (!frames || frames < 1)
      return JSON.stringify({ error: "frames is required and must be positive for action=start" });
    await ctx.rubyBridge.executeScript(`$game_timer.start(${frames})`);
    return JSON.stringify({ success: true, action: "start", frames });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Direct script execution
// ---------------------------------------------------------------------------

export async function handleExecuteScriptRuby(ctx: HandlerContext): Promise<string> {
  const code    = (ctx.input.code    as string | undefined)?.trim();
  const timeout = (ctx.input.timeout as number | undefined) ?? 5000;
  if (!code) return JSON.stringify({ error: "code is required" });
  try {
    await ctx.rubyBridge.executeScript(code, timeout);
    ctx.changeLog.append({ tool: "execute-script", entityType: "Script", action: "update", summary: `Ruby script executed: ${code.slice(0, 80)}` });
    return JSON.stringify({ success: true, code });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Show message
// ---------------------------------------------------------------------------

export async function handleShowMessageRuby(ctx: HandlerContext): Promise<string> {
  const text    = (ctx.input.text    as string | undefined)?.trim();
  const speaker = (ctx.input.speaker as string | undefined) ?? "";
  if (!text) return JSON.stringify({ error: "text is required" });

  const escapedText    = text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  const escapedSpeaker = speaker.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const code = speaker
    ? `$game_message.face_name = ""; $game_message.face_index = 0; $game_message.add("\\\\N[0]${escapedSpeaker}"); $game_message.add("${escapedText}")`
    : `$game_message.add("${escapedText}")`;

  try {
    await ctx.rubyBridge.executeScript(code);
    ctx.changeLog.append({ tool: "show-message", entityType: "Message", action: "update", summary: `Message shown: "${text.slice(0, 60)}"` });
    return JSON.stringify({ success: true, text, speaker });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}

// ---------------------------------------------------------------------------
// Start encounter (basic — no result return)
// ---------------------------------------------------------------------------

export async function handleStartEncounterRuby(ctx: HandlerContext): Promise<string> {
  const troopId = ctx.input.troop_id as number | undefined;
  if (!troopId) return JSON.stringify({ error: "troop_id is required for Ruby engines (enemy_id auto-creation not supported)" });

  try {
    await ctx.rubyBridge.executeScript(
      `$game_troop.setup(${troopId}); SceneManager.call(Scene_Battle)`
    );
    return JSON.stringify({
      success: true,
      note: "Battle started. Use get-battle-state-runtime to monitor the battle state. Results are not returned automatically on Ruby engines.",
    });
  } catch (error) {
    const msg = (error as Error).message;
    return msg.includes("timed out") || msg.includes("not available") || msg.includes("connect")
      ? notConnected()
      : JSON.stringify({ error: msg });
  }
}
