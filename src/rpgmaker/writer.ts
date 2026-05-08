/**
 * Writer para archivos de datos de RPG Maker MZ
 */

import * as fs from "fs";
import * as path from "path";

export interface WriteOptions {
  projectPath: string;
  createBackup?: boolean;
  debug?: boolean;
}

type RPGDatabaseEntry = Record<string, unknown> & {
  id: number;
};

function isDatabaseEntry(value: unknown): value is RPGDatabaseEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "number"
  );
}

export class RPGMakerWriter {
  private projectPath: string;
  private dataPath: string;
  private backupPath: string;
  private createBackup: boolean;
  private debug: boolean;

  constructor(options: WriteOptions) {
    this.projectPath = options.projectPath;
    this.dataPath = path.join(this.projectPath, "data");
    this.backupPath = path.join(this.projectPath, "backups");
    this.createBackup = options.createBackup !== false;
    this.debug = options.debug || false;

    if (!fs.existsSync(this.dataPath)) {
      throw new Error(
        `Data directory not found at: ${this.dataPath}. Is this a valid RPG Maker MZ project?`
      );
    }

    // Crear directorio de backups si no existe
    if (this.createBackup && !fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  /**
   * Crear un backup de un archivo antes de modificarlo
   */
  private createBackupFile(filename: string): void {
    if (!this.createBackup) return;

    const sourceFile = path.join(this.dataPath, filename);
    if (!fs.existsSync(sourceFile)) return;

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(
        this.backupPath,
        `${filename.replace(".json", "")}_${timestamp}.json`
      );

      const content = fs.readFileSync(sourceFile, "utf-8");
      fs.writeFileSync(backupFile, content, "utf-8");

      if (this.debug) {
        console.log(`[DEBUG] Backup created: ${backupFile}`);
      }
    } catch (error) {
      console.error(`Failed to create backup for ${filename}:`, error);
    }
  }

  /**
   * Escribe un archivo JSON con validación
   */
  private writeJsonFile(
    filename: string,
    data: unknown,
    createBackup = true
  ): void {
    const filePath = path.join(this.dataPath, filename);

    // Crear backup antes de escribir
    if (createBackup) {
      this.createBackupFile(filename);
    }

    try {
      const jsonContent = JSON.stringify(data, null, 2) + "\n";
      fs.writeFileSync(filePath, jsonContent, "utf-8");

      if (this.debug) {
        console.log(`[DEBUG] File written: ${filePath}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to write ${filename}: ${(error as Error).message}`
      );
    }
  }

  private readDatabaseArray(filename: string): unknown[] {
    const filePath = path.join(this.dataPath, filename);
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    if (!Array.isArray(data)) {
      throw new Error(`${filename} must contain a JSON array`);
    }

    return data;
  }

  private getNextId(items: unknown[]): number {
    const ids = items.filter(isDatabaseEntry).map((item) => item.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  /**
   * Escribe un archivo JSON dentro de data/.
   */
  writeDataFile(filename: string, data: unknown, createBackup = true): void {
    if (path.basename(filename) !== filename || !filename.endsWith(".json")) {
      throw new Error("Data filename must be a local .json file name");
    }

    this.writeJsonFile(filename, data, createBackup);
  }

  /**
   * Escribe un mapa RPG Maker MZ por ID.
   */
  writeMap(mapId: number, mapData: unknown): void {
    const mapFilename = `Map${String(mapId).padStart(3, "0")}.json`;
    this.writeJsonFile(mapFilename, mapData);
  }

  /**
   * Actualiza un actor en la lista
   */
  updateActor(actorId: number, updates: Record<string, unknown>): void {
    const actors = this.readDatabaseArray("Actors.json");

    const actorIndex = actors.findIndex(
      (actor) => isDatabaseEntry(actor) && actor.id === actorId
    );
    if (actorIndex === -1) {
      throw new Error(`Actor with ID ${actorId} not found`);
    }

    const currentActor = actors[actorIndex] as Record<string, unknown>;
    actors[actorIndex] = { ...currentActor, ...updates };
    this.writeJsonFile("Actors.json", actors);
  }

  /**
   * Agrega un nuevo actor
   */
  addActor(actorData: Record<string, unknown>): number {
    const actors = this.readDatabaseArray("Actors.json");

    const newId = this.getNextId(actors);
    const newActor = { ...actorData, id: newId };

    actors.push(newActor);
    this.writeJsonFile("Actors.json", actors);

    return newId;
  }

  /**
   * Actualiza un item en la lista
   */
  updateItem(itemId: number, updates: Record<string, unknown>): void {
    const items = this.readDatabaseArray("Items.json");

    const itemIndex = items.findIndex(
      (item) => isDatabaseEntry(item) && item.id === itemId
    );
    if (itemIndex === -1) {
      throw new Error(`Item with ID ${itemId} not found`);
    }

    const currentItem = items[itemIndex] as Record<string, unknown>;
    items[itemIndex] = { ...currentItem, ...updates };
    this.writeJsonFile("Items.json", items);
  }

  /**
   * Agrega un nuevo item
   */
  addItem(itemData: Record<string, unknown>): number {
    const items = this.readDatabaseArray("Items.json");

    const newId = this.getNextId(items);
    const newItem = { ...itemData, id: newId };

    items.push(newItem);
    this.writeJsonFile("Items.json", items);

    return newId;
  }

  /**
   * Actualiza un enemigo en la lista
   */
  updateEnemy(enemyId: number, updates: Record<string, unknown>): void {
    const enemies = this.readDatabaseArray("Enemies.json");

    const enemyIndex = enemies.findIndex(
      (enemy) => isDatabaseEntry(enemy) && enemy.id === enemyId
    );
    if (enemyIndex === -1) {
      throw new Error(`Enemy with ID ${enemyId} not found`);
    }

    const currentEnemy = enemies[enemyIndex] as Record<string, unknown>;
    enemies[enemyIndex] = { ...currentEnemy, ...updates };
    this.writeJsonFile("Enemies.json", enemies);
  }

  /**
   * Agrega un nuevo enemigo
   */
  addEnemy(enemyData: Record<string, unknown>): number {
    const enemies = this.readDatabaseArray("Enemies.json");

    const newId = this.getNextId(enemies);
    const newEnemy = { ...enemyData, id: newId };

    enemies.push(newEnemy);
    this.writeJsonFile("Enemies.json", enemies);

    return newId;
  }

  /**
   * Escribe un plugin JavaScript
   */
  writePlugin(filename: string, content: string): void {
    const jsPath = path.join(this.projectPath, "js", "plugins");

    if (!fs.existsSync(jsPath)) {
      fs.mkdirSync(jsPath, { recursive: true });
    }

    const pluginPath = path.join(jsPath, filename);

    // Crear backup si el archivo existe
    if (fs.existsSync(pluginPath) && this.createBackup) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(
        this.backupPath,
        `${filename.replace(".js", "")}_${timestamp}.js`
      );
      fs.writeFileSync(backupFile, fs.readFileSync(pluginPath, "utf-8"), "utf-8");
    }

    try {
      fs.writeFileSync(pluginPath, content, "utf-8");

      if (this.debug) {
        console.log(`[DEBUG] Plugin written: ${pluginPath}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to write plugin ${filename}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Agrega un evento común
   */
  addCommonEvent(eventData: Record<string, unknown>): number {
    const events = this.readDatabaseArray("CommonEvents.json");

    const newId = this.getNextId(events);
    const newEvent = { ...eventData, id: newId };

    events.push(newEvent);
    this.writeJsonFile("CommonEvents.json", events);

    return newId;
  }

  /**
   * Obtiene la lista de archivos de backup
   */
  getBackups(filename?: string): string[] {
    if (!fs.existsSync(this.backupPath)) {
      return [];
    }

    let files = fs.readdirSync(this.backupPath).sort().reverse();

    if (filename) {
      const baseName = filename.replace(".json", "");
      files = files.filter((f) => f.startsWith(baseName));
    }

    return files;
  }

  /**
   * Restaura un archivo desde un backup
   */
  restoreFromBackup(backupFilename: string): void {
    const backupFile = path.join(this.backupPath, backupFilename);

    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFilename}`);
    }

    // Extraer nombre del archivo original
    const originalFilename = backupFilename.split("_")[0] + ".json";
    const targetFile = path.join(this.dataPath, originalFilename);

    try {
      const content = fs.readFileSync(backupFile, "utf-8");
      fs.writeFileSync(targetFile, content, "utf-8");

      if (this.debug) {
        console.log(
          `[DEBUG] Restored from backup: ${backupFilename} -> ${originalFilename}`
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to restore backup: ${(error as Error).message}`
      );
    }
  }
}
