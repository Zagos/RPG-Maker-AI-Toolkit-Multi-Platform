export interface IProjectWriter {
  writeDataFile(filename: string, data: unknown, createBackup?: boolean): void;
  writeMap(mapId: number, mapData: unknown, mapInfo?: unknown): void;
  updateActor(actorId: number, updates: Record<string, unknown>): void;
  addActor(actorData: Record<string, unknown>): number;
  updateItem(itemId: number, updates: Record<string, unknown>): void;
  addItem(itemData: Record<string, unknown>): number;
  updateEnemy(enemyId: number, updates: Record<string, unknown>): void;
  addEnemy(enemyData: Record<string, unknown>): number;
  updateWeapon(weaponId: number, updates: Record<string, unknown>): void;
  addWeapon(weaponData: Record<string, unknown>): number;
  updateArmor(armorId: number, updates: Record<string, unknown>): void;
  addArmor(armorData: Record<string, unknown>): number;
  updateSkill(skillId: number, updates: Record<string, unknown>): void;
  addSkill(skillData: Record<string, unknown>): number;
  updateClass(classId: number, updates: Record<string, unknown>): void;
  addClass(classData: Record<string, unknown>): number;
  updateState(stateId: number, updates: Record<string, unknown>): void;
  addState(stateData: Record<string, unknown>): number;
  updateCommonEvent(eventId: number, updates: Record<string, unknown>): void;
  addCommonEvent(eventData: Record<string, unknown>): number;
  updateTroop(troopId: number, updates: Record<string, unknown>): void;
  addTroop(troopData: Record<string, unknown>): number;
  addAnimation(animationData: Record<string, unknown>): number;
  updateAnimation(animationId: number, updates: Record<string, unknown>): void;
  addTileset(tilesetData: Record<string, unknown>): number;
  updateTileset(tilesetId: number, updates: Record<string, unknown>): void;
  deleteMap(mapId: number): void;
  writePlugin(filename: string, content: string): void;
  updatePluginsRegistry(
    pluginEntry:
      | { name: string; status?: boolean; description?: string; parameters?: Record<string, unknown> }
      | { name: string; status?: boolean; description?: string; parameters?: Record<string, unknown> }[]
  ): void;
  listPlugins(): Array<{ name: string; status: boolean; description: string; parameters: Record<string, unknown> }>;
  removePluginFromRegistry(pluginName: string): void;
  writeSystemConfig(data: Record<string, unknown>): void;
  refreshVersionId(): void;
  getBackups(filename?: string): string[];
  restoreFromBackup(backupFilename: string): void;
  pruneBackups(filename?: string, maxCount?: number): number;
  deleteBackup(backupFilename: string): void;
}
