import type { HandlerContext } from "./types.js";

function notConnected(): string {
  return JSON.stringify({ error: "Game not connected. Start the game with the RPGMakerDebugger plugin enabled." });
}

export async function handlePlayAudioRuntime(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge, changeLog } = ctx;
  if (!debugBridge.connected) return notConnected();

  const type = input.type as string;
  const name = input.name as string | undefined;
  const volume = (input.volume as number) ?? 90;
  const pitch = (input.pitch as number) ?? 100;
  const pan = (input.pan as number) ?? 0;

  let code: string;

  const audioObj = `{name:'${name ?? ""}',volume:${volume},pitch:${pitch},pan:${pan}}`;

  switch (type) {
    case "bgm":
      if (!name) return JSON.stringify({ error: "name is required for bgm" });
      code = `AudioManager.playBgm(${audioObj});`;
      break;
    case "bgs":
      if (!name) return JSON.stringify({ error: "name is required for bgs" });
      code = `AudioManager.playBgs(${audioObj});`;
      break;
    case "se":
      if (!name) return JSON.stringify({ error: "name is required for se" });
      code = `AudioManager.playSe(${audioObj});`;
      break;
    case "me":
      if (!name) return JSON.stringify({ error: "name is required for me" });
      code = `AudioManager.playMe(${audioObj});`;
      break;
    case "stop_bgm":
      code = `AudioManager.stopBgm();`;
      break;
    case "stop_bgs":
      code = `AudioManager.stopBgs();`;
      break;
    default:
      return JSON.stringify({ error: `Unknown audio type: ${type}. Must be one of: bgm, bgs, se, me, stop_bgm, stop_bgs` });
  }

  try {
    await debugBridge.waitForAck(5000);
    debugBridge.setCommand("execute_script", { code });
    changeLog.append({ tool: "play-audio-runtime", entityType: "Audio", action: "update", summary: `Audio action '${type}'${name ? ` (${name})` : ""} executed at runtime` });
    return JSON.stringify({ success: true, type, name: name ?? null, volume, pitch, pan });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
