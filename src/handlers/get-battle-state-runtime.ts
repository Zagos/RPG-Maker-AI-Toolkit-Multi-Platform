import type { HandlerContext } from "./types.js";

function notConnected(): string {
  return JSON.stringify({ error: "Game not connected. Start the game with the RPGMakerDebugger plugin enabled." });
}

export async function handleGetBattleStateRuntime(ctx: HandlerContext): Promise<string> {
  const { debugBridge } = ctx;
  if (!debugBridge.connected) return notConnected();

  const script = `(function(){
    var inBattle = !!$gameTroop && typeof $gameTroop.inBattle === 'function' ? $gameTroop.inBattle() : false;
    var result = { in_battle: inBattle, turn: 0, enemies: [], party: [] };
    if (inBattle && $gameTroop) {
      result.turn = $gameTroop.turnCount ? $gameTroop.turnCount() : 0;
      result.enemies = $gameTroop.members().map(function(e){
        return { id: e.enemyId(), name: e.name(), hp: e.hp, mhp: e.mhp, mp: e.mp, alive: e.isAlive(), states: e._states };
      });
    }
    if ($gameParty) {
      result.party = $gameParty.members().map(function(a){
        return { id: a.actorId(), name: a.name(), hp: a.hp, mhp: a.mhp, mp: a.mp, alive: a.isAlive() };
      });
    }
    fetch('http://127.0.0.1:9001/gamestate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        mapId: $gameMap ? $gameMap.mapId() : 0,
        playerX: $gamePlayer ? $gamePlayer.x : 0,
        playerY: $gamePlayer ? $gamePlayer.y : 0,
        switches: {}, variables: {},
        queryResult: result
      })
    });
  })();`;

  try {
    const state = await ctx.debugBridge.waitForGameState(8000);
    ctx.debugBridge.setCommand("execute_script", { code: script });
    const qr = (state as unknown as Record<string, unknown>).queryResult;
    return JSON.stringify({ success: true, battle: qr });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
