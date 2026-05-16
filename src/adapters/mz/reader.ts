/**
 * Reader para archivos de datos de RPG Maker MZ
 */

import * as fs from "fs";
import * as path from "path";
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
} from "./types/rpgmaker.js";
import type { IProjectReader } from "../../core/types/reader.js";

export interface ReadOptions {
  projectPath: string;
  debug?: boolean;
}

export class RPGMakerReader implements IProjectReader {
  private projectPath: string;
  private dataPath: string;
  private debug: boolean;
  private cache: Map<string, unknown> = new Map();

  constructor(options: ReadOptions) {
    this.projectPath = options.projectPath;
    this.dataPath = path.join(this.projectPath, "data");
    this.debug = options.debug || false;

    if (!fs.existsSync(this.dataPath)) {
      throw new Error(
        `Data directory not found at: ${this.dataPath}. Is this a valid RPG Maker MZ project?`
      );
    }
  }

  /**
   * Lee un archivo JSON de datos
   */
  private readJsonFile(filename: string): unknown {
    const cacheKey = filename;

    // Retornar del cache si existe
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const filePath = path.join(this.dataPath, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(content);
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      throw new Error(
        `Failed to read ${filename}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Lee todos los actores
   */
  readActors(): RPGActor[] {
    const data = this.readJsonFile("Actors.json") as RPGActor[];
    return data.filter((actor) => actor !== null);
  }

  /**
   * Lee un actor específico por ID
   */
  readActor(id: number): RPGActor | null {
    const actors = this.readActors();
    return actors.find((a) => a && a.id === id) || null;
  }

  /**
   * Lee todos los enemigos
   */
  readEnemies(): RPGEnemy[] {
    const data = this.readJsonFile("Enemies.json") as RPGEnemy[];
    return data.filter((enemy) => enemy !== null);
  }

  /**
   * Lee un enemigo específico por ID
   */
  readEnemy(id: number): RPGEnemy | null {
    const enemies = this.readEnemies();
    return enemies.find((e) => e && e.id === id) || null;
  }

  /**
   * Lee todos los items
   */
  readItems(): RPGItem[] {
    const data = this.readJsonFile("Items.json") as RPGItem[];
    return data.filter((item) => item !== null);
  }

  /**
   * Lee un item específico por ID
   */
  readItem(id: number): RPGItem | null {
    const items = this.readItems();
    return items.find((i) => i && i.id === id) || null;
  }

  /**
   * Lee todas las armas
   */
  readWeapons(): RPGWeapon[] {
    const data = this.readJsonFile("Weapons.json") as RPGWeapon[];
    return data.filter((weapon) => weapon !== null);
  }

  /**
   * Lee una arma específica por ID
   */
  readWeapon(id: number): RPGWeapon | null {
    const weapons = this.readWeapons();
    return weapons.find((w) => w && w.id === id) || null;
  }

  /**
   * Lee todas las armaduras
   */
  readArmors(): RPGArmor[] {
    const data = this.readJsonFile("Armors.json") as RPGArmor[];
    return data.filter((armor) => armor !== null);
  }

  /**
   * Lee una armadura específica por ID
   */
  readArmor(id: number): RPGArmor | null {
    const armors = this.readArmors();
    return armors.find((a) => a && a.id === id) || null;
  }

  /**
   * Lee todas las clases
   */
  readClasses(): RPGClass[] {
    const data = this.readJsonFile("Classes.json") as RPGClass[];
    return data.filter((cls) => cls !== null);
  }

  /**
   * Lee una clase específica por ID
   */
  readClass(id: number): RPGClass | null {
    const classes = this.readClasses();
    return classes.find((c) => c && c.id === id) || null;
  }

  /**
   * Lee todas las habilidades
   */
  readSkills(): RPGSkill[] {
    const data = this.readJsonFile("Skills.json") as RPGSkill[];
    return data.filter((skill) => skill !== null);
  }

  /**
   * Lee una habilidad específica por ID
   */
  readSkill(id: number): RPGSkill | null {
    const skills = this.readSkills();
    return skills.find((s) => s && s.id === id) || null;
  }

  /**
   * Lee todos los estados
   */
  readStates(): RPGState[] {
    const data = this.readJsonFile("States.json") as RPGState[];
    return data.filter((state) => state !== null);
  }

  /**
   * Lee un estado específico por ID
   */
  readState(id: number): RPGState | null {
    const states = this.readStates();
    return states.find((s) => s && s.id === id) || null;
  }

  readTroops(): Array<Record<string, unknown>> {
    try {
      const data = this.readJsonFile("Troops.json") as Array<Record<string, unknown> | null>;
      return data.filter((t): t is Record<string, unknown> => t !== null);
    } catch { return []; }
  }

  readTroop(id: number): Record<string, unknown> | null {
    return this.readTroops().find((t) => t.id === id) ?? null;
  }

  readCommonEvents(): Array<Record<string, unknown>> {
    try {
      const data = this.readJsonFile("CommonEvents.json") as Array<Record<string, unknown> | null>;
      return data.filter((e): e is Record<string, unknown> => e !== null);
    } catch { return []; }
  }

  readCommonEvent(id: number): Record<string, unknown> | null {
    return this.readCommonEvents().find((e) => e.id === id) ?? null;
  }

  readTilesets(): Array<Record<string, unknown>> {
    try {
      const data = this.readJsonFile("Tilesets.json") as Array<Record<string, unknown> | null>;
      return data.filter((t): t is Record<string, unknown> => t !== null);
    } catch { return []; }
  }

  readTileset(id: number): Record<string, unknown> | null {
    return this.readTilesets().find((t) => t.id === id) ?? null;
  }

  readAnimations(): unknown[] {
    const data = this.readJsonFile("Animations.json") as unknown[];
    return data.filter((a) => a !== null);
  }

  readAnimation(id: number): unknown {
    const anims = this.readAnimations();
    return anims.find((a) => a !== null && typeof a === "object" && (a as Record<string, unknown>).id === id) || null;
  }

  /**
   * Lee un mapa específico por ID
   */
  readMap(id: number): RPGMap | null {
    const mapFilename = `Map${String(id).padStart(3, "0")}.json`;
    try {
      return this.readJsonFile(mapFilename) as RPGMap;
    } catch {
      return null;
    }
  }

  /**
   * Lee los metadatos del proyecto (config)
   */
  readProjectConfig(): Record<string, unknown> {
    try {
      return this.readJsonFile("System.json") as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  /**
   * Obtiene lista de archivos de plugin
   */
  getPluginFiles(): string[] {
    const jsPath = path.join(this.projectPath, "js", "plugins");

    if (!fs.existsSync(jsPath)) {
      return [];
    }

    return fs
      .readdirSync(jsPath)
      .filter((file) => file.endsWith(".js"))
      .sort();
  }

  /**
   * Lee el contenido de un plugin
   */
  readPlugin(filename: string): string {
    const jsPath = path.join(this.projectPath, "js", "plugins", filename);

    if (!fs.existsSync(jsPath)) {
      throw new Error(`Plugin not found: ${filename}`);
    }

    return fs.readFileSync(jsPath, "utf-8");
  }

  /**
   * Limpia el cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Obtiene información genérica de datos
   */
  getDataInfo(dataType: RPGDataType): { count: number; preview: unknown[] } {
    try {
      let data: unknown[];

      switch (dataType) {
        case "Actors":
          data = this.readActors();
          break;
        case "Enemies":
          data = this.readEnemies();
          break;
        case "Items":
          data = this.readItems();
          break;
        case "Weapons":
          data = this.readWeapons();
          break;
        case "Armors":
          data = this.readArmors();
          break;
        case "Classes":
          data = this.readClasses();
          break;
        case "Skills":
          data = this.readSkills();
          break;
        case "States":
          data = this.readStates();
          break;
        default:
          return { count: 0, preview: [] };
      }

      return {
        count: data.length,
        preview: data.slice(0, 3),
      };
    } catch (error) {
      if (this.debug) {
        console.error(`Error reading ${dataType}:`, error);
      }
      return { count: 0, preview: [] };
    }
  }
}
