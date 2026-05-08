/**
 * Tipos y interfaces para RPG Maker MZ
 */

export interface RPGActor {
  id: number;
  name: string;
  nickname: string;
  classId: number;
  initialLevel: number;
  maxLevel: number;
  character: [string, number];
  face: [string, number];
  battlerName: string;
  traits: RPGTrait[];
  equips: number[];
}

export interface RPGEnemy {
  id: number;
  name: string;
  battlerName: string;
  battlerHue: number;
  exp: number;
  gold: number;
  dropItems: RPGDropItem[];
  actions: RPGEnemyAction[];
  traits: RPGTrait[];
}

export interface RPGItem {
  id: number;
  name: string;
  iconIndex: number;
  description: string;
  itemType: number; // 0: normal, 1: key item
  price: number;
  consumable: boolean;
  effects: RPGEffect[];
  scope: number;
  occasion: number;
  speed: number;
  successRate: number;
  repeats: number;
  tpGain: number;
  hitType: number;
}

export interface RPGWeapon {
  id: number;
  name: string;
  description: string;
  iconIndex: number;
  type: number;
  wtypeId: number;
  status: number[];
  traits: RPGTrait[];
  price: number;
  parameters: number[];
}

export interface RPGArmor {
  id: number;
  name: string;
  description: string;
  iconIndex: number;
  type: number;
  atypeId: number;
  status: number[];
  traits: RPGTrait[];
  price: number;
  parameters: number[];
}

export interface RPGClass {
  id: number;
  name: string;
  expParams: number[];
  params: number[][];
  traits: RPGTrait[];
}

export interface RPGSkill {
  id: number;
  name: string;
  description: string;
  scope: number;
  occasion: number;
  speed: number;
  successRate: number;
  repeats: number;
  tpCost: number;
  mpCost: number;
  hitType: number;
  animationId: number;
  effect: RPGEffect[];
  message1: string;
  message2: string;
  damageType: number;
}

export interface RPGState {
  id: number;
  name: string;
  description: string;
  iconIndex: number;
  color: number;
  priority: number;
  removeAtBattleEnd: boolean;
  removeByRecover: boolean;
  removeByDamage: boolean;
  damageRate: number;
  minTurns: number;
  maxTurns: number;
  removeByWalking: number;
  steps: number;
}

export interface RPGMap {
  autoplayBgm: boolean;
  autoplayBgs: boolean;
  battleback1Name: string;
  battleback2Name: string;
  bgm: RPGAudio;
  bgs: RPGAudio;
  data: number[];
  displayName: string;
  encounterList: RPGEncounter[];
  enableNameDisplay: boolean;
  encounterStep: number;
  height: number;
  note: string;
  parallaxLoopX: boolean;
  parallaxLoopY: boolean;
  parallaxName: string;
  parallaxShow: boolean;
  parallaxSx: number;
  parallaxSy: number;
  scrollType: number;
  specifyBattleback: boolean;
  tilesetId: number;
  width: number;
  events: RPGMapEvent[];
}

export interface RPGMapEvent {
  id: number;
  name: string;
  note: string;
  pages: RPGEventPage[];
  x: number;
  y: number;
}

export interface RPGEventPage {
  conditions: RPGEventPageConditions;
  directionFix: boolean;
  image: RPGEventPageImage;
  moveFrequency: number;
  moveRoute: RPGMoveRoute;
  moveSpeed: number;
  moveType: number;
  priorityType: number;
  stepAnime: boolean;
  through: boolean;
  trigger: number;
  walkAnime: boolean;
  list: RPGEventCommand[];
}

export interface RPGEventCommand {
  code: number;
  indent: number;
  parameters: unknown[];
}

export interface RPGEventPageConditions {
  actorId: number;
  actorValid: boolean;
  itemId: number;
  itemValid: boolean;
  selfSwitchCh: string;
  selfSwitchValid: boolean;
  switch1Id: number;
  switch1Valid: boolean;
  switch2Id: number;
  switch2Valid: boolean;
  variableId: number;
  variableValid: boolean;
  variableValue: number;
}

export interface RPGEventPageImage {
  characterIndex: number;
  characterName: string;
  direction: number;
  pattern: number;
  tileId: number;
}

export interface RPGMoveRoute {
  list: RPGMoveCommand[];
  repeat: boolean;
  skippable: boolean;
  wait: boolean;
}

export interface RPGMoveCommand {
  code: number;
  parameters: unknown[];
}

export interface RPGTrait {
  code: number;
  dataId: number;
  value: number;
}

export interface RPGDropItem {
  dataId: number;
  denominator: number;
  kind: number;
}

export interface RPGEnemyAction {
  conditionParam1: number;
  conditionParam2: number;
  conditionType: number;
  rating: number;
  skillId: number;
}

export interface RPGEffect {
  code: number;
  dataId: number;
  value1: number;
  value2: number;
}

export interface RPGAudio {
  name: string;
  pan: number;
  pitch: number;
  volume: number;
}

export interface RPGEncounter {
  enemyId: number;
  weight: number;
}

export type RPGDataType =
  | "Actors"
  | "Classes"
  | "Skills"
  | "Items"
  | "Weapons"
  | "Armors"
  | "Enemies"
  | "Troops"
  | "States"
  | "Animations"
  | "Tilesets"
  | "Maps"
  | "CommonEvents";

export interface RPGProject {
  data: {
    actors?: RPGActor[];
    classes?: RPGClass[];
    skills?: RPGSkill[];
    items?: RPGItem[];
    weapons?: RPGWeapon[];
    armors?: RPGArmor[];
    enemies?: RPGEnemy[];
    states?: RPGState[];
  };
}
