import * as fs from "fs";
import * as path from "path";
import { readMarshalFile, type BridgeOptions } from "../ruby-bridge/index.js";
import { normalizeKeys } from "./normalize.js";
import type { IProjectReader } from "../../core/types/reader.js";
import type {
  RPGActor,
  RPGEnemy,
  RPGItem,
  RPGWeapon,
  RPGArmor,
  RPGClass,
  RPGSkill,
  RPGState,
  RPGMap,
  RPGDataType,
} from "../mz/types/rpgmaker.js";

export interface VXAceReaderOptions {
  projectPath: string;
  debug?: boolean;
  rubyPath?: string;
}

export class VXAceReader implements IProjectReader {
  protected projectPath: string;
  protected dataPath: string;
  protected debug: boolean;
  protected bridgeOpts: BridgeOptions;
  private cache = new Map<string, unknown>();

  constructor(opts: VXAceReaderOptions) {
    this.projectPath = opts.projectPath;
    this.dataPath = path.join(opts.projectPath, "data");
    this.debug = opts.debug ?? false;
    this.bridgeOpts = { rubyPath: opts.rubyPath };

    if (!fs.existsSync(this.dataPath)) {
      throw new Error(
        `Data directory not found at: ${this.dataPath}. Is this a valid RPG Maker VX Ace project?`
      );
    }
  }

  protected readFile(filename: string): unknown {
    if (this.cache.has(filename)) return this.cache.get(filename);
    const filePath = path.join(this.dataPath, filename);
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
    const raw = readMarshalFile(filePath, this.bridgeOpts);
    const normalized = normalizeKeys(raw);
    this.cache.set(filename, normalized);
    return normalized;
  }

  // For array-based database files (Actors, Items, etc.)
  private readArray<T>(filename: string): T[] {
    const data = this.readFile(filename);
    if (!Array.isArray(data)) return [];
    return (data as Array<T | null>).filter((x): x is T => x !== null);
  }

  // For MapInfos which is a Hash {id: mapInfo}
  private readMapInfosHash(): Array<Record<string, unknown> | null> {
    const raw = this.readFile("MapInfos.rvdata2") as Record<string, unknown>;
    // Ruby Hash keys become string numbers: "1", "2", etc.
    const maxId = Math.max(0, ...Object.keys(raw).map(Number));
    const result: Array<Record<string, unknown> | null> = new Array(maxId + 1).fill(null);
    for (const [k, v] of Object.entries(raw)) {
      const id = parseInt(k, 10);
      if (!isNaN(id)) result[id] = v as Record<string, unknown>;
    }
    return result;
  }

  readActors(): RPGActor[] { return this.readArray<RPGActor>("Actors.rvdata2"); }
  readActor(id: number): RPGActor | null { return this.readActors().find((a) => a.id === id) ?? null; }

  readEnemies(): RPGEnemy[] { return this.readArray<RPGEnemy>("Enemies.rvdata2"); }
  readEnemy(id: number): RPGEnemy | null { return this.readEnemies().find((e) => e.id === id) ?? null; }

  readItems(): RPGItem[] { return this.readArray<RPGItem>("Items.rvdata2"); }
  readItem(id: number): RPGItem | null { return this.readItems().find((i) => i.id === id) ?? null; }

  readWeapons(): RPGWeapon[] { return this.readArray<RPGWeapon>("Weapons.rvdata2"); }
  readWeapon(id: number): RPGWeapon | null { return this.readWeapons().find((w) => w.id === id) ?? null; }

  readArmors(): RPGArmor[] { return this.readArray<RPGArmor>("Armors.rvdata2"); }
  readArmor(id: number): RPGArmor | null { return this.readArmors().find((a) => a.id === id) ?? null; }

  readClasses(): RPGClass[] { return this.readArray<RPGClass>("Classes.rvdata2"); }
  readClass(id: number): RPGClass | null { return this.readClasses().find((c) => c.id === id) ?? null; }

  readSkills(): RPGSkill[] { return this.readArray<RPGSkill>("Skills.rvdata2"); }
  readSkill(id: number): RPGSkill | null { return this.readSkills().find((s) => s.id === id) ?? null; }

  readStates(): RPGState[] { return this.readArray<RPGState>("States.rvdata2"); }
  readState(id: number): RPGState | null { return this.readStates().find((s) => s.id === id) ?? null; }

  readTroops(): Array<Record<string, unknown>> { return this.readArray<Record<string, unknown>>("Troops.rvdata2"); }
  readTroop(id: number): Record<string, unknown> | null { return this.readTroops().find((t) => t["id"] === id) ?? null; }

  readCommonEvents(): Array<Record<string, unknown>> { return this.readArray<Record<string, unknown>>("CommonEvents.rvdata2"); }
  readCommonEvent(id: number): Record<string, unknown> | null { return this.readCommonEvents().find((e) => e["id"] === id) ?? null; }

  readTilesets(): Array<Record<string, unknown>> { return this.readArray<Record<string, unknown>>("Tilesets.rvdata2"); }
  readTileset(id: number): Record<string, unknown> | null { return this.readTilesets().find((t) => t["id"] === id) ?? null; }

  readAnimations(): unknown[] { return this.readArray<unknown>("Animations.rvdata2"); }
  readAnimation(id: number): unknown {
    return (
      this.readAnimations().find(
        (a) => a !== null && typeof a === "object" && (a as Record<string, unknown>)["id"] === id
      ) ?? null
    );
  }

  readMap(id: number): RPGMap | null {
    const filename = `Map${String(id).padStart(3, "0")}.rvdata2`;
    try { return this.readFile(filename) as RPGMap; } catch { return null; }
  }

  readProjectConfig(): Record<string, unknown> {
    try { return this.readFile("System.rvdata2") as Record<string, unknown>; } catch { return {}; }
  }

  readMapInfos(): Array<Record<string, unknown> | null> {
    return this.readMapInfosHash();
  }

  getPluginFiles(): string[] { return []; }

  readPlugin(_filename: string): string {
    throw new Error("RPG Maker VX Ace uses Ruby scripts, not JavaScript plugins.");
  }

  clearCache(): void { this.cache.clear(); }

  getDataInfo(dataType: RPGDataType): { count: number; preview: unknown[] } {
    const methodMap: Record<string, () => unknown[]> = {
      Actors: () => this.readActors(),
      Enemies: () => this.readEnemies(),
      Items: () => this.readItems(),
      Weapons: () => this.readWeapons(),
      Armors: () => this.readArmors(),
      Classes: () => this.readClasses(),
      Skills: () => this.readSkills(),
      States: () => this.readStates(),
    };
    try {
      const fn = methodMap[dataType];
      if (!fn) return { count: 0, preview: [] };
      const data = fn();
      return { count: data.length, preview: data.slice(0, 3) };
    } catch { return { count: 0, preview: [] }; }
  }
}
