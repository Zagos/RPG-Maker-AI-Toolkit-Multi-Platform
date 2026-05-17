import type { HandlerContext } from "../../handlers/types.js";
import { resolveHandler } from "../../core/resolve-handler.js";

export async function handleRuntimeControl(ctx: HandlerContext): Promise<string> {
  const input = ctx.input;
  const action = input.action as string;

  let toolName: string;
  let childInput: Record<string, unknown>;

  switch (action) {
    case "set-switch":
      toolName = "set-switch";
      childInput = { id: input.id, value: input.value };
      break;
    case "set-variable":
      toolName = "set-variable";
      childInput = { id: input.id, value: input.value };
      break;
    case "teleport":
      toolName = "teleport-player";
      childInput = { map_id: input.map_id, x: input.x, y: input.y, direction: input.direction };
      break;
    case "save":
      toolName = "save-game";
      childInput = { slot: input.slot };
      break;
    case "load":
      toolName = "load-game";
      childInput = { slot: input.slot };
      break;
    case "modify-inventory":
      toolName = "modify-inventory";
      childInput = { operations: input.operations };
      break;
    case "set-party-state":
      toolName = "set-party-state";
      childInput = {
        actor_id: input.actor_id,
        hp_percent: input.hp_percent,
        mp_percent: input.mp_percent,
        add_states: input.add_states,
        remove_states: input.remove_states,
      };
      break;
    case "call-common-event":
      toolName = "call-common-event";
      // support both macro field name (event_id) and internal field name (common_event_id)
      childInput = { common_event_id: input.event_id ?? input.common_event_id };
      break;
    case "modify-actor":
      toolName = "modify-actor-runtime";
      childInput = { actor_id: input.actor_id, operations: input.operations };
      break;
    case "manage-party":
      toolName = "manage-party-runtime";
      childInput = { action: input.party_action, actor_id: input.actor_id };
      break;
    case "control-weather":
      toolName = "control-weather-runtime";
      childInput = { type: input.weather_type, power: input.power, duration: input.duration };
      break;
    case "play-audio":
      toolName = "play-audio-runtime";
      childInput = {
        type: input.audio_type,
        name: input.name,
        volume: input.volume,
        pitch: input.pitch,
        pan: input.pan,
      };
      break;
    case "control-timer":
      toolName = "control-timer-runtime";
      childInput = { action: input.timer_action, frames: input.frames };
      break;
    case "show-message":
      toolName = "show-message";
      childInput = { text: input.text, speaker: input.speaker };
      break;
    case "execute-script":
      toolName = "execute-script";
      childInput = { code: input.code, timeout: input.timeout };
      break;
    default:
      return JSON.stringify({ error: `Unknown runtime-control action: ${action}` });
  }

  const handler = resolveHandler(toolName, ctx.engine);
  if (!handler) {
    return JSON.stringify({ error: `Internal handler not found for: ${toolName}` });
  }

  return handler({ ...ctx, input: childInput });
}
