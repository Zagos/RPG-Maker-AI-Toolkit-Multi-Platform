import type { HandlerContext } from "./types.js";

function notConnected(): string {
  return JSON.stringify({ error: "Game not connected. Start the game with the RPGMakerDebugger plugin enabled." });
}

export async function handleControlTimerRuntime(ctx: HandlerContext): Promise<string> {
  const { input, debugBridge } = ctx;
  if (!debugBridge.connected) return notConnected();

  const action = input.action as string;

  try {
    if (action === "get") {
      const script = `(function(){
        var working = $gameTimer ? $gameTimer.isWorking() : false;
        var seconds = $gameTimer ? $gameTimer.seconds() : 0;
        fetch('http://127.0.0.1:9001/gamestate', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            mapId: $gameMap ? $gameMap.mapId() : 0,
            playerX: $gamePlayer ? $gamePlayer.x : 0,
            playerY: $gamePlayer ? $gamePlayer.y : 0,
            switches: {}, variables: {},
            queryResult: { working: working, seconds: seconds }
          })
        });
      })();`;
      const state = await ctx.debugBridge.waitForGameState(8000);
      ctx.debugBridge.setCommand("execute_script", { code: script });
      const qr = (state as unknown as Record<string, unknown>).queryResult;
      return JSON.stringify({ success: true, timer: qr });
    }

    if (action === "stop") {
      const script = `(function(){ if($gameTimer) $gameTimer.stop(); })();`;
      await ctx.debugBridge.waitForAck(5000);
      ctx.debugBridge.setCommand("execute_script", { code: script });
      return JSON.stringify({ success: true, action: "stop" });
    }

    // action === "start"
    const frames = input.frames as number | undefined;
    if (!frames || frames < 1) return JSON.stringify({ error: "frames is required and must be positive for action=start" });
    const script = `(function(){ if($gameTimer) $gameTimer.start(${frames}); })();`;
    await ctx.debugBridge.waitForAck(5000);
    ctx.debugBridge.setCommand("execute_script", { code: script });
    return JSON.stringify({ success: true, action: "start", frames });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
