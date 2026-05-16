import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { handleControlTimerRuntime } from "../../src/handlers/control-timer-runtime.js";
import { handleGetBattleStateRuntime } from "../../src/handlers/get-battle-state-runtime.js";
import type { HandlerContext } from "../../src/handlers/types.js";
import type { RPGMakerReader } from "../../src/rpgmaker/reader.js";
import type { RPGMakerWriter } from "../../src/rpgmaker/writer.js";
import type { RPGMakerDebugBridge } from "../../src/rpgmaker/debug-bridge.js";
import type { ChangeLog } from "../../src/rpgmaker/change-log.js";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeBridge(overrides?: {
  connected?: boolean;
  queryResult?: unknown;
}) {
  const qr = overrides?.queryResult !== undefined ? overrides.queryResult : null;
  return {
    connected: overrides?.connected !== undefined ? overrides.connected : true,
    waitForAck: vi.fn().mockResolvedValue(undefined),
    waitForGameState: vi.fn().mockResolvedValue({
      mapId: 1,
      playerX: 0,
      playerY: 0,
      switches: {},
      variables: {},
      queryResult: qr,
    }),
    setCommand: vi.fn(),
  };
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-runtime-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function makeCtx(
  input: Record<string, unknown>,
  bridge: ReturnType<typeof makeBridge>
): HandlerContext {
  return {
    input,
    projectPath: tmpDir,
    reader: {} as RPGMakerReader,
    writer: {} as RPGMakerWriter,
    debugBridge: bridge as unknown as RPGMakerDebugBridge,
    changeLog: { append: vi.fn(), read: vi.fn() } as unknown as ChangeLog,
    debug: false,
  };
}

// ── control-timer-runtime ─────────────────────────────────────────────────────

describe("handleControlTimerRuntime", () => {
  it("action=start calls waitForAck then setCommand with $gameTimer.start(frames)", async () => {
    const bridge = makeBridge();
    const result = JSON.parse(
      await handleControlTimerRuntime(makeCtx({ action: "start", frames: 300 }, bridge))
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe("start");
    expect(result.frames).toBe(300);

    expect(bridge.waitForAck).toHaveBeenCalledOnce();
    expect(bridge.setCommand).toHaveBeenCalledOnce();

    const [cmdName, cmdArgs] = bridge.setCommand.mock.calls[0] as [string, { code: string }];
    expect(cmdName).toBe("execute_script");
    expect((cmdArgs as { code: string }).code).toContain("$gameTimer");
    expect((cmdArgs as { code: string }).code).toContain("start(300)");
  });

  it("action=stop calls waitForAck then setCommand with $gameTimer.stop()", async () => {
    const bridge = makeBridge();
    const result = JSON.parse(
      await handleControlTimerRuntime(makeCtx({ action: "stop" }, bridge))
    );

    expect(result.success).toBe(true);
    expect(result.action).toBe("stop");

    expect(bridge.waitForAck).toHaveBeenCalledOnce();
    expect(bridge.setCommand).toHaveBeenCalledOnce();

    const [, cmdArgs] = bridge.setCommand.mock.calls[0] as [string, { code: string }];
    expect((cmdArgs as { code: string }).code).toContain("$gameTimer");
    expect((cmdArgs as { code: string }).code).toContain("stop()");
  });

  it("action=get calls waitForGameState BEFORE setCommand (order matters)", async () => {
    const callOrder: string[] = [];
    const bridge = makeBridge({ queryResult: { working: false, seconds: 0 } });

    bridge.waitForGameState = vi.fn().mockImplementation(() => {
      callOrder.push("waitForGameState");
      return Promise.resolve({
        mapId: 1, playerX: 0, playerY: 0, switches: {}, variables: {},
        queryResult: { working: false, seconds: 0 },
      });
    });

    bridge.setCommand = vi.fn().mockImplementation(() => {
      callOrder.push("setCommand");
    });

    await handleControlTimerRuntime(makeCtx({ action: "get" }, bridge));

    expect(callOrder[0]).toBe("waitForGameState");
    expect(callOrder[1]).toBe("setCommand");
  });

  it("action=get returns timer data from queryResult", async () => {
    const bridge = makeBridge({ queryResult: { working: true, seconds: 10 } });
    const result = JSON.parse(
      await handleControlTimerRuntime(makeCtx({ action: "get" }, bridge))
    );

    expect(result.success).toBe(true);
    expect(result.timer).toEqual({ working: true, seconds: 10 });
  });

  it("action=start without frames returns error", async () => {
    const bridge = makeBridge();
    const result = JSON.parse(
      await handleControlTimerRuntime(makeCtx({ action: "start" }, bridge))
    );

    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/frames/i);
    expect(bridge.setCommand).not.toHaveBeenCalled();
  });

  it("returns error when not connected", async () => {
    const bridge = makeBridge({ connected: false });
    const result = JSON.parse(
      await handleControlTimerRuntime(makeCtx({ action: "start", frames: 60 }, bridge))
    );

    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/not connected/i);
    expect(bridge.waitForAck).not.toHaveBeenCalled();
    expect(bridge.setCommand).not.toHaveBeenCalled();
  });
});

// ── get-battle-state-runtime ──────────────────────────────────────────────────

describe("handleGetBattleStateRuntime", () => {
  it("calls waitForGameState before setCommand", async () => {
    const callOrder: string[] = [];
    const bridge = makeBridge({ queryResult: { in_battle: false } });

    bridge.waitForGameState = vi.fn().mockImplementation(() => {
      callOrder.push("waitForGameState");
      return Promise.resolve({
        mapId: 1, playerX: 0, playerY: 0, switches: {}, variables: {},
        queryResult: { in_battle: false, turn: 0, enemies: [], party: [] },
      });
    });

    bridge.setCommand = vi.fn().mockImplementation(() => {
      callOrder.push("setCommand");
    });

    await handleGetBattleStateRuntime(makeCtx({}, bridge));

    expect(callOrder[0]).toBe("waitForGameState");
    expect(callOrder[1]).toBe("setCommand");
  });

  it("returns { success: true, battle: queryResult }", async () => {
    const battleData = { in_battle: true, turn: 2, enemies: [], party: [] };
    const bridge = makeBridge({ queryResult: battleData });
    const result = JSON.parse(
      await handleGetBattleStateRuntime(makeCtx({}, bridge))
    );

    expect(result.success).toBe(true);
    expect(result.battle).toEqual(battleData);
  });

  it("returns error when not connected", async () => {
    const bridge = makeBridge({ connected: false });
    const result = JSON.parse(
      await handleGetBattleStateRuntime(makeCtx({}, bridge))
    );

    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/not connected/i);
    expect(bridge.waitForGameState).not.toHaveBeenCalled();
    expect(bridge.setCommand).not.toHaveBeenCalled();
  });
});
