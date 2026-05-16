export interface BattleLogEntry {
  type: string;
  [key: string]: unknown;
}

export interface BattleState {
  inBattle: boolean;
  battleOver?: boolean;
  turn: number;
  actors: BattlerState[];
  enemies: BattlerState[];
}

export interface BattlerState {
  name: string;
  hp: number;
  mhp: number;
  mp: number;
  mmp: number;
  states: string[];
}

export interface EncounterResult {
  success: boolean;
  log: BattleLogEntry[];
  state?: BattleState;
  summary?: string;
}

export interface PartyMemberState {
  name: string;
  hp: number;
  mhp: number;
  level: number;
}

export interface GameState {
  mapId: number;
  playerX: number;
  playerY: number;
  gold: number;
  partyMembers: PartyMemberState[];
  inBattle: boolean;
  timestamp: string;
}

interface PendingCommand {
  command: string;
  args: Record<string, unknown>;
}

export class RPGMakerDebugBridge {
  private pendingCmd: PendingCommand | null = null;
  private events: BattleLogEntry[] = [];
  private finalState: BattleState | null = null;
  private gameConnected = false;
  private gameState: GameState | null = null;
  private ackResolvers: Array<(value: boolean) => void> = [];

  setCommand(cmd: string, args: Record<string, unknown>): void {
    this.pendingCmd = { command: cmd, args };
    this.events = [];
    this.finalState = null;
  }

  getCommand(): PendingCommand | null {
    return this.pendingCmd;
  }

  clearCommand(): void {
    this.pendingCmd = null;
  }

  addEvent(entry: BattleLogEntry): void {
    this.events.push(entry);
  }

  setFinalState(state: BattleState): void {
    this.finalState = state;
  }

  setGameState(state: GameState): void {
    this.gameState = state;
  }

  getGameState(): GameState | null {
    return this.gameState;
  }

  resolveAck(): void {
    // Clear before resolving so the very next /ping returns nothing
    this.clearCommand();
    const resolver = this.ackResolvers.shift();
    if (resolver) resolver(true);
  }

  markConnected(): void {
    this.gameConnected = true;
  }

  get connected(): boolean {
    return this.gameConnected;
  }

  async waitForBattle(timeout = 120000): Promise<EncounterResult> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (this.finalState && !this.finalState.inBattle) {
        this.clearCommand();
        return {
          success: true,
          log: this.events,
          state: this.finalState,
          summary: this.generateSummary(this.finalState),
        };
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    return { success: false, log: this.events, summary: "Battle timed out" };
  }

  async waitForGameState(timeout = 10000): Promise<GameState> {
    this.gameState = null;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (this.gameState) {
        // Clear so the next /ping returns nothing (prevent re-execution)
        this.clearCommand();
        return this.gameState;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    this.clearCommand();
    throw new Error("Timed out waiting for game state");
  }

  async waitForAck(timeout = 10000): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        const idx = this.ackResolvers.indexOf(resolve);
        if (idx !== -1) this.ackResolvers.splice(idx, 1);
        resolve(false);
      }, timeout);

      this.ackResolvers.push((value) => {
        clearTimeout(timer);
        resolve(value);
      });
    });
  }

  private generateSummary(state: BattleState): string {
    const parts: string[] = [];
    if (state.actors?.length > 0) {
      const alive = state.actors.filter((a) => a.hp > 0).length;
      parts.push(`Party: ${alive}/${state.actors.length} alive`);
      for (const a of state.actors) {
        parts.push(`  ${a.name}: ${a.hp}/${a.mhp} HP (${Math.round((a.hp / Math.max(a.mhp, 1)) * 100)}%)`);
      }
    }
    if (state.enemies?.length > 0) {
      const alive = state.enemies.filter((e) => e.hp > 0).length;
      parts.push(`Enemies: ${alive}/${state.enemies.length} remaining`);
      for (const e of state.enemies) {
        parts.push(`  ${e.name}: ${e.hp}/${e.mhp} HP (${Math.round((e.hp / Math.max(e.mhp, 1)) * 100)}%)`);
      }
    }
    return parts.join("\n");
  }
}
