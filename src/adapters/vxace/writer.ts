import * as fs from "fs";
import * as path from "path";
import { readMarshalFile, writeMarshalFile, type BridgeOptions } from "../ruby-bridge/index.js";
import { denormalizeKeys } from "./normalize.js";
import type { IProjectWriter } from "../../core/types/writer.js";

export interface VXAceWriterOptions {
  projectPath: string;
  createBackup?: boolean;
  debug?: boolean;
  maxBackups?: number;
  rubyPath?: string;
}

export class VXAceWriter implements IProjectWriter {
  protected ext = ".rvdata2";
  protected projectPath: string;
  protected dataPath: string;
  protected backupPath: string;
  protected createBackupEnabled: boolean;
  protected debug: boolean;
  protected maxBackups: number;
  protected bridgeOpts: BridgeOptions;

  constructor(opts: VXAceWriterOptions) {
    this.projectPath = opts.projectPath;
    this.dataPath = path.join(opts.projectPath, "data");
    this.backupPath = path.join(opts.projectPath, "backups");
    this.createBackupEnabled = opts.createBackup !== false;
    this.debug = opts.debug ?? false;
    this.maxBackups = opts.maxBackups ?? 10;
    this.bridgeOpts = { rubyPath: opts.rubyPath };

    if (!fs.existsSync(this.dataPath)) {
      throw new Error(
        `Data directory not found at: ${this.dataPath}. Is this a valid RPG Maker VX Ace project?`
      );
    }
    if (this.createBackupEnabled && !fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  protected backupFile(filename: string): void {
    if (!this.createBackupEnabled) return;
    const src = path.join(this.dataPath, filename);
    if (!fs.existsSync(src)) return;
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const unique = Math.floor(Math.random() * 9000 + 1000).toString();
      const base = filename.replace(/\.[^.]+$/, "");
      const dst = path.join(this.backupPath, `${base}_${timestamp}_${unique}${this.ext}`);
      fs.copyFileSync(src, dst);
      this.pruneBackups(filename, this.maxBackups);
    } catch (e) {
      if (this.debug) console.error(`Backup failed for ${filename}:`, e);
    }
  }

  // Read a .rvdata2 array file, returning the raw (snake_case) data
  protected readRawArray(filename: string): unknown[] {
    const filePath = path.join(this.dataPath, filename);
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
    const data = readMarshalFile(filePath, this.bridgeOpts);
    return Array.isArray(data) ? data : [];
  }

  protected writeRawArray(filename: string, data: unknown[]): void {
    this.backupFile(filename);
    const filePath = path.join(this.dataPath, filename);
    writeMarshalFile(filePath, data, this.bridgeOpts);
  }

  private updateInArray(
    filename: string,
    id: number,
    updates: Record<string, unknown>,
    entityName: string
  ): void {
    const items = this.readRawArray(filename);
    const idx = items.findIndex(
      (x) => x !== null && typeof x === "object" && (x as Record<string, unknown>)["id"] === id
    );
    if (idx === -1) throw new Error(`${entityName} with ID ${id} not found`);
    // denormalize camelCase updates → snake_case for VX Ace format
    const snakeUpdates = denormalizeKeys(updates) as Record<string, unknown>;
    items[idx] = { ...(items[idx] as Record<string, unknown>), ...snakeUpdates };
    this.writeRawArray(filename, items);
  }

  private addToArray(filename: string, data: Record<string, unknown>): number {
    const items = this.readRawArray(filename);
    const ids = items
      .filter(
        (x): x is Record<string, unknown> =>
          x !== null && typeof x === "object" && "id" in (x as object)
      )
      .map((x) => (x as Record<string, unknown>)["id"] as number);
    const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
    // denormalize camelCase → snake_case
    const snakeData = denormalizeKeys({ ...data, id: newId }) as Record<string, unknown>;
    items.push(snakeData);
    this.writeRawArray(filename, items);
    return newId;
  }

  updateActor(id: number, updates: Record<string, unknown>): void { this.updateInArray(`Actors${this.ext}`, id, updates, "Actor"); }
  addActor(data: Record<string, unknown>): number { return this.addToArray(`Actors${this.ext}`, data); }

  updateItem(id: number, updates: Record<string, unknown>): void { this.updateInArray(`Items${this.ext}`, id, updates, "Item"); }
  addItem(data: Record<string, unknown>): number { return this.addToArray(`Items${this.ext}`, data); }

  updateEnemy(id: number, updates: Record<string, unknown>): void { this.updateInArray(`Enemies${this.ext}`, id, updates, "Enemy"); }
  addEnemy(data: Record<string, unknown>): number { return this.addToArray(`Enemies${this.ext}`, data); }

  updateWeapon(id: number, updates: Record<string, unknown>): void { this.updateInArray(`Weapons${this.ext}`, id, updates, "Weapon"); }
  addWeapon(data: Record<string, unknown>): number { return this.addToArray(`Weapons${this.ext}`, data); }

  updateArmor(id: number, updates: Record<string, unknown>): void { this.updateInArray(`Armors${this.ext}`, id, updates, "Armor"); }
  addArmor(data: Record<string, unknown>): number { return this.addToArray(`Armors${this.ext}`, data); }

  updateSkill(id: number, updates: Record<string, unknown>): void { this.updateInArray(`Skills${this.ext}`, id, updates, "Skill"); }
  addSkill(data: Record<string, unknown>): number { return this.addToArray(`Skills${this.ext}`, data); }

  updateClass(id: number, updates: Record<string, unknown>): void { this.updateInArray(`Classes${this.ext}`, id, updates, "Class"); }
  addClass(data: Record<string, unknown>): number { return this.addToArray(`Classes${this.ext}`, data); }

  updateState(id: number, updates: Record<string, unknown>): void { this.updateInArray(`States${this.ext}`, id, updates, "State"); }
  addState(data: Record<string, unknown>): number { return this.addToArray(`States${this.ext}`, data); }

  updateCommonEvent(id: number, updates: Record<string, unknown>): void { this.updateInArray(`CommonEvents${this.ext}`, id, updates, "CommonEvent"); }
  addCommonEvent(data: Record<string, unknown>): number { return this.addToArray(`CommonEvents${this.ext}`, data); }

  updateTroop(id: number, updates: Record<string, unknown>): void { this.updateInArray(`Troops${this.ext}`, id, updates, "Troop"); }
  addTroop(data: Record<string, unknown>): number { return this.addToArray(`Troops${this.ext}`, data); }

  updateAnimation(id: number, updates: Record<string, unknown>): void { this.updateInArray(`Animations${this.ext}`, id, updates, "Animation"); }
  addAnimation(data: Record<string, unknown>): number { return this.addToArray(`Animations${this.ext}`, data); }

  updateTileset(id: number, updates: Record<string, unknown>): void { this.updateInArray(`Tilesets${this.ext}`, id, updates, "Tileset"); }
  addTileset(data: Record<string, unknown>): number { return this.addToArray(`Tilesets${this.ext}`, data); }

  writeMap(mapId: number, mapData: unknown, _mapInfo?: unknown): void {
    const filename = `Map${String(mapId).padStart(3, "0")}${this.ext}`;
    this.backupFile(filename);
    writeMarshalFile(path.join(this.dataPath, filename), denormalizeKeys(mapData), this.bridgeOpts);
  }

  deleteMap(mapId: number): void {
    const filename = `Map${String(mapId).padStart(3, "0")}${this.ext}`;
    const filePath = path.join(this.dataPath, filename);
    if (!fs.existsSync(filePath)) throw new Error(`Map file not found: ${filename}`);
    this.backupFile(filename);
    fs.unlinkSync(filePath);
    // Update MapInfos
    const mapInfosPath = path.join(this.dataPath, `MapInfos${this.ext}`);
    if (fs.existsSync(mapInfosPath)) {
      try {
        const raw = readMarshalFile(mapInfosPath, this.bridgeOpts) as Record<string, unknown>;
        delete raw[String(mapId)];
        writeMarshalFile(mapInfosPath, raw, this.bridgeOpts);
      } catch { /* best-effort */ }
    }
  }

  writeDataFile(filename: string, data: unknown, createBackup = true): void {
    if (!filename.endsWith(this.ext)) throw new Error(`VX Ace data files must have ${this.ext} extension`);
    if (createBackup) this.backupFile(filename);
    writeMarshalFile(path.join(this.dataPath, filename), denormalizeKeys(data), this.bridgeOpts);
  }

  refreshVersionId(): void {
    const systemPath = path.join(this.dataPath, `System${this.ext}`);
    if (!fs.existsSync(systemPath)) return;
    try {
      const data = readMarshalFile(systemPath, this.bridgeOpts) as Record<string, unknown>;
      data["version_id"] = Math.floor(Math.random() * 1_000_000_000);
      this.backupFile(`System${this.ext}`);
      writeMarshalFile(systemPath, data, this.bridgeOpts);
    } catch { /* best-effort */ }
  }

  writeSystemConfig(data: Record<string, unknown>): void {
    this.writeDataFile(`System${this.ext}`, data);
  }

  // Plugins: not supported in VX Ace (uses Ruby scripts, not JS plugins)
  writePlugin(_filename: string, _content: string): void {
    throw new Error("RPG Maker VX Ace uses Ruby scripts, not JavaScript plugins.");
  }

  updatePluginsRegistry(
    _entry:
      | { name: string; status?: boolean; description?: string; parameters?: Record<string, unknown> }
      | { name: string; status?: boolean; description?: string; parameters?: Record<string, unknown> }[]
  ): void {
    throw new Error("RPG Maker VX Ace uses Ruby scripts, not JavaScript plugins.");
  }

  listPlugins(): Array<{ name: string; status: boolean; description: string; parameters: Record<string, unknown> }> {
    return [];
  }

  removePluginFromRegistry(_name: string): void { /* no-op for VX Ace */ }

  getBackups(filename?: string): string[] {
    if (!fs.existsSync(this.backupPath)) return [];
    let files = fs.readdirSync(this.backupPath).sort().reverse();
    if (filename) {
      const base = filename.replace(/\.[^.]+$/, "");
      files = files.filter((f) => f.startsWith(base));
    }
    return files;
  }

  restoreFromBackup(backupFilename: string): void {
    if (path.basename(backupFilename) !== backupFilename || backupFilename.includes("..")) {
      throw new Error("Invalid backup filename");
    }
    const src = path.join(this.backupPath, backupFilename);
    if (!fs.existsSync(src)) throw new Error(`Backup not found: ${backupFilename}`);
    const originalName = backupFilename.split("_")[0] + this.ext;
    fs.copyFileSync(src, path.join(this.dataPath, originalName));
  }

  pruneBackups(filename?: string, maxCount = 10): number {
    const all = this.getBackups(filename);
    const toDelete = all.slice(maxCount);
    for (const f of toDelete) {
      try { fs.unlinkSync(path.join(this.backupPath, f)); } catch { /* best-effort */ }
    }
    return toDelete.length;
  }

  deleteBackup(backupFilename: string): void {
    if (path.basename(backupFilename) !== backupFilename || backupFilename.includes("..")) {
      throw new Error("Invalid backup filename");
    }
    const f = path.join(this.backupPath, backupFilename);
    if (!fs.existsSync(f)) throw new Error(`Backup not found: ${backupFilename}`);
    fs.unlinkSync(f);
  }
}
