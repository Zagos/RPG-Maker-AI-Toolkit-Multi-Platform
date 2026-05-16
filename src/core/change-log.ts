import * as fs from "fs";
import * as path from "path";

export interface ChangeEntry {
  timestamp: string;
  tool: string;
  entityType: string;
  entityId?: number;
  action: "create" | "update" | "delete";
  summary: string;
}

export interface ReadOptions {
  limit?: number;
  entityType?: string;
  tool?: string;
  action?: "create" | "update" | "delete";
  since?: string;
}

export class ChangeLog {
  private logPath: string;

  constructor(projectPath: string) {
    this.logPath = path.join(projectPath, "mcp-changes.json");
  }

  append(entry: Omit<ChangeEntry, "timestamp">): void {
    const entries = this.readRaw();
    entries.push({ timestamp: new Date().toISOString(), ...entry });
    try {
      fs.writeFileSync(this.logPath, JSON.stringify(entries, null, 2) + "\n", "utf-8");
    } catch {
      // change log is best-effort; never throw
    }
  }

  read(options: ReadOptions = {}): ChangeEntry[] {
    let entries = this.readRaw();

    if (options.tool) {
      entries = entries.filter((e) => e.tool === options.tool);
    }
    if (options.entityType) {
      entries = entries.filter((e) => e.entityType === options.entityType);
    }
    if (options.action) {
      entries = entries.filter((e) => e.action === options.action);
    }
    if (options.since) {
      entries = entries.filter((e) => e.timestamp >= options.since!);
    }

    // newest first
    entries = entries.slice().reverse();

    if (options.limit) {
      entries = entries.slice(0, options.limit);
    }

    return entries;
  }

  clear(): void {
    try {
      fs.writeFileSync(this.logPath, "[]\n", "utf-8");
    } catch {
      // best-effort
    }
  }

  private readRaw(): ChangeEntry[] {
    if (!fs.existsSync(this.logPath)) return [];
    try {
      return JSON.parse(fs.readFileSync(this.logPath, "utf-8")) as ChangeEntry[];
    } catch {
      return [];
    }
  }
}
