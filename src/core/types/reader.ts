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
} from "../../adapters/mz/types/rpgmaker.js";

export interface IProjectReader {
  readActors(): RPGActor[];
  readActor(id: number): RPGActor | null;
  readEnemies(): RPGEnemy[];
  readEnemy(id: number): RPGEnemy | null;
  readItems(): RPGItem[];
  readItem(id: number): RPGItem | null;
  readWeapons(): RPGWeapon[];
  readWeapon(id: number): RPGWeapon | null;
  readArmors(): RPGArmor[];
  readArmor(id: number): RPGArmor | null;
  readClasses(): RPGClass[];
  readClass(id: number): RPGClass | null;
  readSkills(): RPGSkill[];
  readSkill(id: number): RPGSkill | null;
  readStates(): RPGState[];
  readState(id: number): RPGState | null;
  readTroops(): Array<Record<string, unknown>>;
  readTroop(id: number): Record<string, unknown> | null;
  readCommonEvents(): Array<Record<string, unknown>>;
  readCommonEvent(id: number): Record<string, unknown> | null;
  readTilesets(): Array<Record<string, unknown>>;
  readTileset(id: number): Record<string, unknown> | null;
  readAnimations(): unknown[];
  readAnimation(id: number): unknown;
  readMap(id: number): RPGMap | null;
  readProjectConfig(): Record<string, unknown>;
  getPluginFiles(): string[];
  readPlugin(filename: string): string;
  clearCache(): void;
  getDataInfo(dataType: RPGDataType): { count: number; preview: unknown[] };
}
