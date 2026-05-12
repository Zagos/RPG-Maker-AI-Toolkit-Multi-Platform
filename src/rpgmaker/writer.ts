/**
 * Writer para archivos de datos de RPG Maker MZ
 */

import * as fs from "fs";
import * as path from "path";

export interface WriteOptions {
  projectPath: string;
  createBackup?: boolean;
  debug?: boolean;
  maxBackups?: number;
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
  private maxBackups: number;

  constructor(options: WriteOptions) {
    this.projectPath = options.projectPath;
    this.dataPath = path.join(this.projectPath, "data");
    this.backupPath = path.join(this.projectPath, "backups");
    this.createBackup = options.createBackup !== false;
    this.debug = options.debug || false;
    this.maxBackups = options.maxBackups ?? 10;

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
      const unique = Math.floor(Math.random() * 9000 + 1000).toString();
      const backupFile = path.join(
        this.backupPath,
        `${filename.replace(".json", "")}_${timestamp}_${unique}.json`
      );

      const content = fs.readFileSync(sourceFile, "utf-8");
      fs.writeFileSync(backupFile, content, "utf-8");

      if (this.debug) {
        console.log(`[DEBUG] Backup created: ${backupFile}`);
      }

      this.pruneBackups(filename, this.maxBackups);
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
   * Escribe un mapa RPG Maker MZ por ID y actualiza MapInfos.json + System.json.versionId
   */
  writeMap(mapId: number, mapData: unknown, mapInfo?: unknown): void {
    const mapFilename = `Map${String(mapId).padStart(3, "0")}.json`;

    // Escribe el archivo del mapa
    this.writeJsonFile(mapFilename, mapData);

    // Validate mapInfo before writing (throws if invalid)
    if (mapInfo !== undefined) {
      const info = mapInfo as Record<string, unknown>;
      const required = ["id", "name", "parentId", "order", "expanded", "scrollX", "scrollY"];
      const missing = required.filter((k) => !(k in info));
      if (missing.length > 0) {
        throw new Error(`mapInfo is missing required fields: ${missing.join(", ")}`);
      }
      if (typeof info.id !== "number" || info.id !== mapId) {
        throw new Error(`mapInfo.id must equal mapId (${mapId})`);
      }
    }

    // Actualiza MapInfos.json (asegura longitud y valor)
    const mapInfosPath = path.join(this.dataPath, "MapInfos.json");
    try {
      let mapInfos: Array<Record<string, unknown> | null> = [];
      if (fs.existsSync(mapInfosPath)) {
        const content = fs.readFileSync(mapInfosPath, "utf-8");
        try {
          mapInfos = JSON.parse(content) as Array<Record<string, unknown> | null>;
        } catch {
          mapInfos = [];
        }
      }

      // Asegurar tamaño suficiente
      while (mapInfos.length <= mapId) {
        mapInfos.push(null);
      }

      if (mapInfo !== undefined) {
        mapInfos[mapId] = mapInfo as Record<string, unknown>;
      }

      this.writeJsonFile("MapInfos.json", mapInfos);
    } catch (error) {
      if (this.debug) {
        console.error("Failed to update MapInfos.json:", error);
      }
    }

    // Refresh System.json versionId para forzar recarga del editor
    try {
      this.refreshVersionId();
    } catch (error) {
      if (this.debug) {
        console.error("Failed to refresh System.json versionId:", error);
      }
    }
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

  updateWeapon(weaponId: number, updates: Record<string, unknown>): void {
    const weapons = this.readDatabaseArray("Weapons.json");
    const idx = weapons.findIndex((w) => isDatabaseEntry(w) && w.id === weaponId);
    if (idx === -1) throw new Error(`Weapon with ID ${weaponId} not found`);
    weapons[idx] = { ...(weapons[idx] as Record<string, unknown>), ...updates };
    this.writeJsonFile("Weapons.json", weapons);
  }

  addWeapon(weaponData: Record<string, unknown>): number {
    const weapons = this.readDatabaseArray("Weapons.json");
    const newId = this.getNextId(weapons);
    weapons.push({ ...weaponData, id: newId });
    this.writeJsonFile("Weapons.json", weapons);
    return newId;
  }

  updateArmor(armorId: number, updates: Record<string, unknown>): void {
    const armors = this.readDatabaseArray("Armors.json");
    const idx = armors.findIndex((a) => isDatabaseEntry(a) && a.id === armorId);
    if (idx === -1) throw new Error(`Armor with ID ${armorId} not found`);
    armors[idx] = { ...(armors[idx] as Record<string, unknown>), ...updates };
    this.writeJsonFile("Armors.json", armors);
  }

  addArmor(armorData: Record<string, unknown>): number {
    const armors = this.readDatabaseArray("Armors.json");
    const newId = this.getNextId(armors);
    armors.push({ ...armorData, id: newId });
    this.writeJsonFile("Armors.json", armors);
    return newId;
  }

  updateSkill(skillId: number, updates: Record<string, unknown>): void {
    const skills = this.readDatabaseArray("Skills.json");
    const idx = skills.findIndex((s) => isDatabaseEntry(s) && s.id === skillId);
    if (idx === -1) throw new Error(`Skill with ID ${skillId} not found`);
    skills[idx] = { ...(skills[idx] as Record<string, unknown>), ...updates };
    this.writeJsonFile("Skills.json", skills);
  }

  addSkill(skillData: Record<string, unknown>): number {
    const skills = this.readDatabaseArray("Skills.json");
    const newId = this.getNextId(skills);
    skills.push({ ...skillData, id: newId });
    this.writeJsonFile("Skills.json", skills);
    return newId;
  }

  updateClass(classId: number, updates: Record<string, unknown>): void {
    const classes = this.readDatabaseArray("Classes.json");
    const idx = classes.findIndex((c) => isDatabaseEntry(c) && c.id === classId);
    if (idx === -1) throw new Error(`Class with ID ${classId} not found`);
    classes[idx] = { ...(classes[idx] as Record<string, unknown>), ...updates };
    this.writeJsonFile("Classes.json", classes);
  }

  addClass(classData: Record<string, unknown>): number {
    const classes = this.readDatabaseArray("Classes.json");
    const newId = this.getNextId(classes);
    classes.push({ ...classData, id: newId });
    this.writeJsonFile("Classes.json", classes);
    return newId;
  }

  updateState(stateId: number, updates: Record<string, unknown>): void {
    const states = this.readDatabaseArray("States.json");
    const idx = states.findIndex((s) => isDatabaseEntry(s) && s.id === stateId);
    if (idx === -1) throw new Error(`State with ID ${stateId} not found`);
    states[idx] = { ...(states[idx] as Record<string, unknown>), ...updates };
    this.writeJsonFile("States.json", states);
  }

  addState(stateData: Record<string, unknown>): number {
    const states = this.readDatabaseArray("States.json");
    const newId = this.getNextId(states);
    states.push({ ...stateData, id: newId });
    this.writeJsonFile("States.json", states);
    return newId;
  }

  updateCommonEvent(eventId: number, updates: Record<string, unknown>): void {
    const events = this.readDatabaseArray("CommonEvents.json");
    const idx = events.findIndex((e) => isDatabaseEntry(e) && e.id === eventId);
    if (idx === -1) throw new Error(`Common event with ID ${eventId} not found`);
    events[idx] = { ...(events[idx] as Record<string, unknown>), ...updates };
    this.writeJsonFile("CommonEvents.json", events);
  }

  addTroop(troopData: Record<string, unknown>): number {
    const troops = this.readDatabaseArray("Troops.json");
    const newId = this.getNextId(troops);
    troops.push({ ...troopData, id: newId });
    this.writeJsonFile("Troops.json", troops);
    return newId;
  }

  updateTroop(troopId: number, updates: Record<string, unknown>): void {
    const troops = this.readDatabaseArray("Troops.json");
    const idx = troops.findIndex((t) => isDatabaseEntry(t) && t.id === troopId);
    if (idx === -1) throw new Error(`Troop with ID ${troopId} not found`);
    troops[idx] = { ...(troops[idx] as Record<string, unknown>), ...updates };
    this.writeJsonFile("Troops.json", troops);
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
    const backupFile = path.join(this.backupPath, backupFilename);
    if (!fs.existsSync(backupFile)) throw new Error(`Backup not found: ${backupFilename}`);
    fs.unlinkSync(backupFile);
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
    // Reject any path that tries to escape the backup directory
    if (path.basename(backupFilename) !== backupFilename || backupFilename.includes("..")) {
      throw new Error("Invalid backup filename");
    }

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

  /**
   * Escribe un plugin JavaScript
   */
  writePlugin(filename: string, content: string): void {
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(filename) || filename.includes("..") || path.basename(filename) !== filename) {
      throw new Error(`Invalid plugin filename: '${filename}'. Must not contain special characters or path separators.`);
    }
    const reserved = /^(CON|PRN|AUX|NUL|COM\d|LPT\d)(\.|$)/i;
    if (reserved.test(filename)) {
      throw new Error(`Invalid plugin filename: '${filename}' is a reserved Windows name.`);
    }

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
   * Extracts the $plugins array from plugins.js content using a bracket-aware
   * parser. Handles nested arrays/objects inside parameter string values (e.g.
   * plugins like ActorPictures that store serialized JSON in their parameters).
   * The non-greedy regex approach [\s\S]*? breaks on those cases.
   */
  private extractPluginsArray(content: string): Array<{ name: string; status?: boolean; description?: string; parameters?: Record<string, unknown> }> {
    const assignIdx = content.search(/\$plugins\s*=/);
    if (assignIdx === -1) return [];

    const start = content.indexOf("[", assignIdx);
    if (start === -1) return [];

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < content.length; i++) {
      const ch = content[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\" && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (!inString) {
        if (ch === "[") depth++;
        else if (ch === "]") {
          depth--;
          if (depth === 0) {
            try {
              return JSON.parse(content.slice(start, i + 1)) as Array<{ name: string; status?: boolean; description?: string; parameters?: Record<string, unknown> }>;
            } catch {
              return [];
            }
          }
        }
      }
    }
    return [];
  }

  /**
   * Actualiza (o crea) el archivo js/plugins.js con la lista de plugins.
   * Lee los plugins existentes sin destruirlos, luego añade o actualiza
   * las entradas indicadas.
   */
  updatePluginsRegistry(pluginEntry: { name: string; status?: boolean; description?: string; parameters?: Record<string, unknown>; } | { name: string; status?: boolean; description?: string; parameters?: Record<string, unknown>; }[]): void {
    const pluginsJsPath = path.join(this.projectPath, "js", "plugins.js");

    const entries = Array.isArray(pluginEntry) ? pluginEntry : [pluginEntry];

    let plugins: Array<{ name: string; status?: boolean; description?: string; parameters?: Record<string, unknown> }> = [];

    if (fs.existsSync(pluginsJsPath)) {
      try {
        const content = fs.readFileSync(pluginsJsPath, "utf-8");
        plugins = this.extractPluginsArray(content);
      } catch {
        plugins = [];
      }
    }

    for (const e of entries) {
      const name = e.name;
      const idx = plugins.findIndex((p) => p && p.name === name);
      const entry = {
        name,
        status: e.status === undefined ? true : Boolean(e.status),
        description: e.description || "",
        parameters: e.parameters || {},
      };

      if (idx >= 0) {
        plugins[idx] = entry;
      } else {
        plugins.push(entry);
      }
    }

    // Preserve RPG Maker's expected format: compact JSON, one entry per line
    const lines = plugins.map((p) => JSON.stringify(p)).join(",\n");
    const out = `// Generated by RPG Maker.\n// Do not edit this file directly.\nvar $plugins =\n[\n${lines}\n];\n`;

    try {
      fs.writeFileSync(pluginsJsPath, out, "utf-8");
    } catch (err) {
      if (this.debug) console.error("Failed to write plugins.js:", err);
    }
  }

  /**
   * Refresh System.json versionId to force editor refresh
   */
  refreshVersionId(): void {
    const systemPath = path.join(this.dataPath, "System.json");

    if (!fs.existsSync(systemPath)) return;

    try {
      const content = fs.readFileSync(systemPath, "utf-8");
      const system = JSON.parse(content) as Record<string, unknown> & { versionId?: number };
      // Use a large random integer to minimize collision probability
      system.versionId = Math.floor(Math.random() * 1_000_000_000);
      this.writeJsonFile("System.json", system);
    } catch (err) {
      if (this.debug) console.error("Failed to refresh System.json:", err);
    }
  }
}
