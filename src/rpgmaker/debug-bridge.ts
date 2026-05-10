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

interface PendingCommand {
  command: string;
  args: Record<string, unknown>;
}

export class RPGMakerDebugBridge {
  private pendingCmd: PendingCommand | null = null;
  private events: BattleLogEntry[] = [];
  private finalState: BattleState | null = null;
  private gameConnected = false;

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
