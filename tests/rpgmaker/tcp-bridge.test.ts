import { describe, it, expect, afterEach } from "vitest";
import * as net from "net";
import { RPGMakerRubyBridge } from "../../src/adapters/ruby-bridge/tcp-bridge.js";

type JsonRecord = Record<string, unknown>;

// Tracks open server-side sockets so we can force-close them in afterEach.
// Without this, server.close() hangs indefinitely when a connected client
// holds the socket open (e.g. the silent-server timeout test).
const trackedSockets = new Set<net.Socket>();

function createTrackedServer(handler?: (socket: net.Socket) => void): net.Server {
  return net.createServer((socket) => {
    trackedSockets.add(socket);
    socket.on("close", () => trackedSockets.delete(socket));
    handler?.(socket);
  });
}

function startMockServer(
  handler: (cmd: JsonRecord) => JsonRecord
): Promise<{ server: net.Server; port: number }> {
  return new Promise((resolve) => {
    const server = createTrackedServer((socket) => {
      socket.setEncoding("utf-8");
      let buf = "";
      socket.on("data", (chunk: string) => {
        buf += chunk;
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          try {
            const resp = handler(JSON.parse(line) as JsonRecord);
            socket.write(JSON.stringify(resp) + "\n");
          } catch {
            socket.write(JSON.stringify({ ok: false, error: "server parse error" }) + "\n");
          }
        }
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as net.AddressInfo;
      resolve({ server, port });
    });
  });
}

// Port unlikely to have anything listening
const DEAD_PORT = 19099;

describe("RPGMakerRubyBridge", () => {
  let server: net.Server | null = null;
  let bridge: RPGMakerRubyBridge;

  afterEach(async () => {
    bridge?.disconnect();
    // Force-close all tracked server-side sockets before closing the server.
    // This prevents server.close() from hanging when the client held a socket open.
    for (const sock of trackedSockets) sock.destroy();
    trackedSockets.clear();
    if (server) {
      await new Promise<void>((res) => server!.close(() => res()));
      server = null;
    }
  });

  // ── connect ──────────────────────────────────────────────────────────────

  describe("connect", () => {
    it("starts disconnected", () => {
      bridge = new RPGMakerRubyBridge(DEAD_PORT);
      expect(bridge.connected).toBe(false);
    });

    it("sets connected=true after successful connect", async () => {
      ({ server } = await startMockServer(() => ({ ok: true })));
      const { port } = server.address() as net.AddressInfo;
      bridge = new RPGMakerRubyBridge(port);
      await bridge.connect(3000);
      expect(bridge.connected).toBe(true);
    });

    it("is idempotent — calling connect twice is a no-op", async () => {
      ({ server } = await startMockServer(() => ({ ok: true })));
      const { port } = server.address() as net.AddressInfo;
      bridge = new RPGMakerRubyBridge(port);
      await bridge.connect(3000);
      await bridge.connect(3000);
      expect(bridge.connected).toBe(true);
    });

    it("throws with helpful message when nothing is listening", async () => {
      bridge = new RPGMakerRubyBridge(DEAD_PORT);
      await expect(bridge.connect(500)).rejects.toThrow(/Ruby bridge|port/);
    });
  });

  // ── ping ─────────────────────────────────────────────────────────────────

  describe("ping", () => {
    it("returns true when server responds with pong", async () => {
      ({ server } = await startMockServer(() => ({ ok: true, pong: true, version: "1.0" })));
      const { port } = server.address() as net.AddressInfo;
      bridge = new RPGMakerRubyBridge(port);
      const result = await bridge.ping(3000);
      expect(result).toBe(true);
    });

    it("returns false when server is not reachable", async () => {
      bridge = new RPGMakerRubyBridge(DEAD_PORT);
      const result = await bridge.ping(300);
      expect(result).toBe(false);
    });

    it("returns false when server responds ok:false", async () => {
      ({ server } = await startMockServer(() => ({ ok: false, error: "not ready" })));
      const { port } = server.address() as net.AddressInfo;
      bridge = new RPGMakerRubyBridge(port);
      const result = await bridge.ping(3000);
      expect(result).toBe(false);
    });
  });

  // ── executeScript ─────────────────────────────────────────────────────────

  describe("executeScript", () => {
    it("sends {type:'execute', code} and resolves on ok:true", async () => {
      const received: JsonRecord[] = [];
      ({ server } = await startMockServer((cmd) => {
        received.push(cmd);
        return { ok: true };
      }));
      const { port } = server.address() as net.AddressInfo;
      bridge = new RPGMakerRubyBridge(port);
      await bridge.executeScript("$game_switches[1] = true");
      expect(received).toHaveLength(1);
      expect(received[0]).toEqual({ type: "execute", code: "$game_switches[1] = true" });
    });

    it("auto-connects if not already connected", async () => {
      ({ server } = await startMockServer(() => ({ ok: true })));
      const { port } = server.address() as net.AddressInfo;
      bridge = new RPGMakerRubyBridge(port);
      expect(bridge.connected).toBe(false);
      await bridge.executeScript("nil");
      expect(bridge.connected).toBe(true);
    });

    it("throws when server responds ok:false", async () => {
      ({ server } = await startMockServer(() => ({ ok: false, error: "undefined method 'foo'" })));
      const { port } = server.address() as net.AddressInfo;
      bridge = new RPGMakerRubyBridge(port);
      await expect(bridge.executeScript("foo.bar")).rejects.toThrow("undefined method 'foo'");
    });
  });

  // ── queryValue ────────────────────────────────────────────────────────────

  describe("queryValue", () => {
    it("sends {type:'query', code} and returns result", async () => {
      const received: JsonRecord[] = [];
      ({ server } = await startMockServer((cmd) => {
        received.push(cmd);
        return { ok: true, result: 42 };
      }));
      const { port } = server.address() as net.AddressInfo;
      bridge = new RPGMakerRubyBridge(port);
      const value = await bridge.queryValue("$game_variables[1]");
      expect(value).toBe(42);
      expect(received[0]).toEqual({ type: "query", code: "$game_variables[1]" });
    });

    it("returns nested object results", async () => {
      const mockState = { map_id: 3, player_x: 5, player_y: 7, gold: 1000 };
      ({ server } = await startMockServer(() => ({ ok: true, result: mockState })));
      const { port } = server.address() as net.AddressInfo;
      bridge = new RPGMakerRubyBridge(port);
      const result = await bridge.queryValue("{ map_id: $game_map.map_id }");
      expect(result).toEqual(mockState);
    });

    it("returns null when result is null", async () => {
      ({ server } = await startMockServer(() => ({ ok: true, result: null })));
      const { port } = server.address() as net.AddressInfo;
      bridge = new RPGMakerRubyBridge(port);
      const result = await bridge.queryValue("nil");
      expect(result).toBeNull();
    });

    it("throws when server responds ok:false", async () => {
      ({ server } = await startMockServer(() => ({ ok: false, error: "no method map_id" })));
      const { port } = server.address() as net.AddressInfo;
      bridge = new RPGMakerRubyBridge(port);
      await expect(bridge.queryValue("bad")).rejects.toThrow("no method map_id");
    });
  });

  // ── timeout ───────────────────────────────────────────────────────────────

  describe("command timeout", () => {
    it("rejects when server connects but never replies", async () => {
      const silentServer = createTrackedServer();
      await new Promise<void>((res) => silentServer.listen(0, "127.0.0.1", res));
      server = silentServer;
      const { port } = server.address() as net.AddressInfo;
      bridge = new RPGMakerRubyBridge(port);
      await bridge.connect(3000);
      await expect(bridge.executeScript("x", 200)).rejects.toThrow(/timed out/);
    });
  });

  // ── disconnect ────────────────────────────────────────────────────────────

  describe("disconnect", () => {
    it("sets connected=false", async () => {
      ({ server } = await startMockServer(() => ({ ok: true })));
      const { port } = server.address() as net.AddressInfo;
      bridge = new RPGMakerRubyBridge(port);
      await bridge.connect(3000);
      bridge.disconnect();
      expect(bridge.connected).toBe(false);
    });

    it("is safe to call when already disconnected", () => {
      bridge = new RPGMakerRubyBridge(DEAD_PORT);
      expect(() => bridge.disconnect()).not.toThrow();
    });
  });
});
