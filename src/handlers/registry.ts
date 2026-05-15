import type { HandlerContext } from "./types.js";
import { handleHealthCheck, handleListGameData } from "./data.js";
import { handleEditActor } from "./actor.js";
import { handleEditItem } from "./item.js";
import { handleEditEnemy } from "./enemy.js";
import { handleCreatePlugin, handleCreatePluginAdvanced, handleSetupDebugPlugin } from "./plugin.js";
import { handleAddDialogue, handleCreateDialogueAdvanced } from "./dialogue.js";
import { handleCreateMapEvent } from "./map-event.js";
import { handleStoryGenerator } from "./story.js";
import { handleLaunchGame, handleStartEncounter, handleGetGameState, handleSetSwitch, handleSetVariable, handleTeleportPlayer, handleSaveGame, handleLoadGame, handleSetPartyState, handleRunBattleSuite, handleExecuteScript, handleShowMessage } from "./debug.js";
import { handleEditWeapon } from "./weapon.js";
import { handleEditArmor } from "./armor.js";
import { handleEditSkill } from "./skill.js";
import { handleEditClass } from "./class.js";
import { handleEditState } from "./state.js";
import { handleReadMap } from "./map-read.js";
import { handleCreateMap } from "./map-create.js";
import { handleCreateTroop, handleEditTroop } from "./troop.js";
import { handleCreateCommonEvent, handleEditCommonEvent } from "./common-event.js";
import { handleEditMap } from "./map-edit.js";
import { handleEditSystem } from "./system.js";
import { handleManageBackups } from "./backup.js";
import { handleGetChangeHistory } from "./change-history.js";
import { handleListMaps } from "./map-list.js";
import { handleDeleteMap } from "./map-delete.js";
import { handleEditMapEvent, handleDeleteMapEvent } from "./map-event-edit.js";
import { handleManagePlugins } from "./manage-plugins.js";
import { handleReadEntity } from "./read-entity.js";
import { handleEditTileset } from "./tileset.js";
import { handleEditDropItems } from "./drop-items.js";
import { handleEditClassLearnings } from "./class-learnings.js";
import { handleEditVehicle } from "./vehicle.js";
import { handleGetInventory, handleModifyInventory, handleGetSwitch, handleGetVariable, handleCallCommonEvent, handleModifyActorRuntime } from "./runtime-query.js";
import { handleReadSystemExtended } from "./system-extended.js";

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
  "get-game-state": handleGetGameState,
  "set-switch": handleSetSwitch,
  "set-variable": handleSetVariable,
  "teleport-player": handleTeleportPlayer,
  "save-game": handleSaveGame,
  "load-game": handleLoadGame,
  "set-party-state": handleSetPartyState,
  "run-battle-suite": handleRunBattleSuite,
  "edit-weapon": handleEditWeapon,
  "edit-armor": handleEditArmor,
  "edit-skill": handleEditSkill,
  "edit-class": handleEditClass,
  "edit-state": handleEditState,
  "read-map": handleReadMap,
  "create-map": handleCreateMap,
  "create-troop": handleCreateTroop,
  "edit-troop": handleEditTroop,
  "create-common-event": handleCreateCommonEvent,
  "edit-common-event": handleEditCommonEvent,
  "edit-map": handleEditMap,
  "edit-system": handleEditSystem,
  "manage-backups": handleManageBackups,
  "get-change-history": handleGetChangeHistory,
  "list-maps": handleListMaps,
  "delete-map": handleDeleteMap,
  "edit-map-event": handleEditMapEvent,
  "delete-map-event": handleDeleteMapEvent,
  "manage-plugins": handleManagePlugins,
  "read-entity": handleReadEntity,
  "execute-script": handleExecuteScript,
  "show-message": handleShowMessage,
  "edit-tileset": handleEditTileset,
  "edit-drop-items": handleEditDropItems,
  "edit-class-learnings": handleEditClassLearnings,
  "edit-vehicle": handleEditVehicle,
  "get-inventory": handleGetInventory,
  "modify-inventory": handleModifyInventory,
  "get-switch": handleGetSwitch,
  "get-variable": handleGetVariable,
  "call-common-event": handleCallCommonEvent,
  "modify-actor-runtime": handleModifyActorRuntime,
  "read-system-extended": handleReadSystemExtended,
};
