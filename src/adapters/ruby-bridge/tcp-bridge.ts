import * as net from "net";

export interface RubyBridgeResponse {
  ok: boolean;
  error?: string;
  result?: unknown;
  pong?: boolean;
  version?: string;
}

/**
 * TCP client that connects to the RpgMakerMCPBridge Ruby script running inside
 * RPG Maker VX Ace / VX / XP. Sends newline-delimited JSON commands and receives
 * newline-delimited JSON responses.
 *
 * Usage:
 *   const bridge = new RPGMakerRubyBridge(9002);
 *   await bridge.executeScript("$game_switches[1] = true");
 *   const hp = await bridge.queryValue("$game_actors[1].hp");
 */
export class RPGMakerRubyBridge {
  private socket: net.Socket | null = null;
  private port: number;
  private _connected = false;
  private buffer = "";
  private connecting = false;
  private pending: {
    resolve: (r: RubyBridgeResponse) => void;
    reject: (e: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  } | null = null;

  constructor(port = 9002) {
    this.port = port;
  }

  get connected(): boolean {
    return this._connected;
  }

  /**
   * Connect to the Ruby bridge server. Idempotent — safe to call if already connected.
   * Throws if the connection times out (game not running or bridge script not installed).
   */
  async connect(timeoutMs = 5000): Promise<void> {
    if (this._connected) return;
    if (this.connecting) {
      await new Promise<void>((res, rej) => {
        const poll = setInterval(() => {
          if (this._connected) { clearInterval(poll); res(); }
          else if (!this.connecting) { clearInterval(poll); rej(new Error("Connection failed")); }
        }, 50);
      });
      return;
    }

    this.connecting = true;
    try {
      await this._doConnect(timeoutMs);
    } finally {
      this.connecting = false;
    }
  }

  private _doConnect(timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        socket.destroy();
        reject(new Error(
          `Ruby bridge connection to port ${this.port} timed out. ` +
          `Make sure the game is running and the RpgMakerMCPBridge script is installed (use setup-debug-plugin).`
        ));
      }, timeoutMs);

      const socket = new net.Socket();
      socket.setEncoding("utf-8");

      socket.on("data", (data: string) => {
        this.buffer += data;
        this.flushBuffer();
      });

      socket.on("error", (err) => {
        clearTimeout(timer);
        if (!this._connected) {
          reject(new Error(
            `Could not connect to Ruby bridge on port ${this.port}: ${err.message}. ` +
            `Make sure the game is running and the RpgMakerMCPBridge script is installed.`
          ));
        } else {
          this.failPending(err);
          this.handleDisconnect();
        }
      });

      socket.on("close", () => {
        this.failPending(new Error("Ruby bridge connection closed unexpectedly"));
        this.handleDisconnect();
      });

      socket.connect(this.port, "127.0.0.1", () => {
        clearTimeout(timer);
        this.socket = socket;
        this._connected = true;
        resolve();
      });
    });
  }

  private flushBuffer(): void {
    let newline: number;
    while ((newline = this.buffer.indexOf("\n")) !== -1) {
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;
      try {
        const resp = JSON.parse(line) as RubyBridgeResponse;
        this.resolvePending(resp);
      } catch {
        this.failPending(new Error(`Invalid JSON from Ruby bridge: ${line.slice(0, 200)}`));
      }
    }
  }

  private resolvePending(resp: RubyBridgeResponse): void {
    if (!this.pending) return;
    const { resolve, timer } = this.pending;
    this.pending = null;
    clearTimeout(timer);
    resolve(resp);
  }

  private failPending(err: Error): void {
    if (!this.pending) return;
    const { reject, timer } = this.pending;
    this.pending = null;
    clearTimeout(timer);
    reject(err);
  }

  private handleDisconnect(): void {
    this._connected = false;
    this.socket = null;
    this.buffer = "";
  }

  /**
   * Send a raw command. Auto-connects if not already connected.
   */
  async sendCommand(cmd: { type: string; code?: string }, timeoutMs = 8000): Promise<RubyBridgeResponse> {
    if (!this._connected) {
      await this.connect(3000);
    }
    if (!this.socket) throw new Error("Not connected to Ruby bridge");

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending = null;
        reject(new Error(`Ruby bridge command '${cmd.type}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pending = { resolve, reject, timer };
      this.socket!.write(JSON.stringify(cmd) + "\n");
    });
  }

  /**
   * Execute Ruby code in the game. Does not return a value.
   * Throws if the code raises an exception or the bridge is unavailable.
   */
  async executeScript(code: string, timeoutMs = 8000): Promise<void> {
    const resp = await this.sendCommand({ type: "execute", code }, timeoutMs);
    if (!resp.ok) throw new Error(resp.error ?? "Ruby script execution failed");
  }

  /**
   * Evaluate Ruby code in the game and return the result as a JSON-safe value.
   * The result is serialized by the bridge's serialize() method.
   */
  async queryValue(code: string, timeoutMs = 8000): Promise<unknown> {
    const resp = await this.sendCommand({ type: "query", code }, timeoutMs);
    if (!resp.ok) throw new Error(resp.error ?? "Ruby query failed");
    return resp.result;
  }

  /**
   * Check if the bridge is reachable. Returns false on any error.
   */
  async ping(timeoutMs = 3000): Promise<boolean> {
    try {
      const resp = await this.sendCommand({ type: "ping" }, timeoutMs);
      return resp.ok && !!resp.pong;
    } catch {
      return false;
    }
  }

  disconnect(): void {
    if (this.pending) {
      this.failPending(new Error("Ruby bridge disconnected by caller"));
    }
    this.socket?.destroy();
    this.socket = null;
    this._connected = false;
  }
}
