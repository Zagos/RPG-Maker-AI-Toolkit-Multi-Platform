import type { HandlerContext } from "./types.js";
import { handleHealthCheck, handleListGameData } from "./data.js";
import { handleEditActor } from "./actor.js";
import { handleEditItem } from "./item.js";
import { handleEditEnemy } from "./enemy.js";
import { handleCreatePlugin, handleCreatePluginAdvanced, handleSetupDebugPlugin } from "./plugin.js";
import { handleAddDialogue, handleCreateDialogueAdvanced } from "./dialogue.js";
import { handleCreateMapEvent } from "./map-event.js";
import { handleStoryGenerator } from "./story.js";
import { handleLaunchGame, handleStartEncounter } from "./debug.js";
import { handleEditWeapon } from "./weapon.js";
import { handleEditArmor } from "./armor.js";
import { handleEditSkill } from "./skill.js";
import { handleEditClass } from "./class.js";
import { handleEditState } from "./state.js";
import { handleReadMap } from "./map-read.js";
import { handleManageBackups } from "./backup.js";
import { handleGetChangeHistory } from "./change-history.js";

// All tool handlers except batch-edit (to avoid circular imports)
export const TOOL_HANDLERS: Record<string, (ctx: HandlerContext) => Promise<string>> = {
  "health-check": handleHealthCheck,
  "list-game-data": handleListGameData,
  "edit-actor": handleEditActor,
  "edit-item": handleEditItem,
  "edit-enemy": handleEditEnemy,
  "create-plugin": handleCreatePlugin,
  "add-dialogue": handleAddDialogue,
  "create-plugin-advanced": handleCreatePluginAdvanced,
  "create-dialogue-advanced": handleCreateDialogueAdvanced,
  "create-map-event": handleCreateMapEvent,
  "story-generator": handleStoryGenerator,
  "setup-debug-plugin": handleSetupDebugPlugin,
  "launch-game": handleLaunchGame,
  "start-encounter": handleStartEncounter,
  "edit-weapon": handleEditWeapon,
  "edit-armor": handleEditArmor,
  "edit-skill": handleEditSkill,
  "edit-class": handleEditClass,
  "edit-state": handleEditState,
  "read-map": handleReadMap,
  "manage-backups": handleManageBackups,
  "get-change-history": handleGetChangeHistory,
};
