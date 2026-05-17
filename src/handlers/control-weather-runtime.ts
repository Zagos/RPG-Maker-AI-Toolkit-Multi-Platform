import type { HandlerContext } from "./types.js";

function notConnected(): string {
  return JSON.stringify({ error: "Game not connected. Start the game with the RPGMakerDebugger plugin enabled." });
}

export async function handleControlWeatherRuntime(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge, changeLog } = ctx;
  if (!debugBridge.connected) return notConnected();

  const type = (input.type as string) ?? "none";
  const power = (input.power as number) ?? 5;
  const duration = (input.duration as number) ?? 60;

  const validTypes = ["none", "rain", "storm", "snow"];
  if (!validTypes.includes(type)) {
    return JSON.stringify({ error: `Invalid weather type: ${type}. Must be one of: none, rain, storm, snow` });
  }

  const code = `$gameScreen.changeWeather('${type}', ${power}, ${duration});`;

  try {
    await debugBridge.waitForAck(5000);
    debugBridge.setCommand("execute_script", { code });
    changeLog.append({ tool: "control-weather-runtime", entityType: "Screen", action: "update", summary: `Weather changed to '${type}' (power: ${power}, duration: ${duration}) at runtime` });
    return JSON.stringify({ success: true, type, power, duration });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
