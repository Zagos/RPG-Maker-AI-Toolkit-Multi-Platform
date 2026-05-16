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
import { handleReadMapTiles } from "./map-tiles-read.js";
import { handlePaintMapTiles } from "./map-tiles-paint.js";
import { handleFillMapRegion } from "./map-tiles-fill.js";
import { handleReadTileset } from "./tileset-read.js";
import { handleCreateTileset } from "./tileset-create.js";
import { handleEditTilesetProperties } from "./tileset-edit-properties.js";
import { handleGenerateCharacter } from "./generate-character.js";
import { handleEditTraits } from "./traits.js";
import { handlePaintMapRegion } from "./map-paint.js";
import { handleEditTroopEvents } from "./troop-events.js";
import { handleListResources } from "./resources.js";
import { handleEditEffects } from "./effects.js";
import { handleEditEventPage } from "./event-page.js";
import { handleEditPluginParameters } from "./plugin-parameters.js";
import { handleEditEnemyActions } from "./enemy-actions.js";
import { handleDeleteEntity } from "./delete-entity.js";
import { handleReadAnimation, handleEditAnimation } from "./animation.js";
import { handleCreateSkill } from "./create-skill.js";
import { handleCreateItem } from "./create-item.js";
import { handleCreateWeapon } from "./create-weapon.js";
import { handleCreateArmor } from "./create-armor.js";
import { handleCreateClass } from "./create-class.js";
import { handleCreateState } from "./create-state.js";
import { handleCreateEnemy } from "./create-enemy.js";
import { handleCreateActor } from "./create-actor.js";
import { handleCreateAnimation } from "./create-animation.js";
import { handleGetActorRuntime } from "./get-actor-runtime.js";
import { handleManagePartyRuntime } from "./manage-party-runtime.js";
import { handleControlWeatherRuntime } from "./control-weather-runtime.js";
import { handlePlayAudioRuntime } from "./play-audio-runtime.js";
import { handleGetMapStateRuntime } from "./get-map-state-runtime.js";
import { handleEditMapInfo } from "./map-info.js";
import { handleSearchEntity } from "./search-entity.js";
import { handleDuplicateEntity } from "./duplicate-entity.js";
import { handleExportProjectSummary } from "./project-summary.js";
import { handleBatchCreateEntities } from "./batch-create-entities.js";
import { handleBatchDeleteEntities } from "./batch-delete-entities.js";
import { handleValidateProject } from "./validate-project.js";
import { handleFindAndReplace } from "./find-and-replace.js";
import { handleCopyMap } from "./copy-map.js";
import { handleCleanupProject } from "./cleanup-project.js";
import { handleControlTimerRuntime } from "./control-timer-runtime.js";
import { handleGetBattleStateRuntime } from "./get-battle-state-runtime.js";
import { handleReorderPlugin } from "./reorder-plugin.js";

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
  "read-map-tiles": handleReadMapTiles,
  "paint-map-tiles": handlePaintMapTiles,
  "fill-map-region": handleFillMapRegion,
  "read-tileset": handleReadTileset,
  "create-tileset": handleCreateTileset,
  "edit-tileset-properties": handleEditTilesetProperties,
  "generate-character": handleGenerateCharacter,
  "edit-traits": handleEditTraits,
  "paint-map-region": handlePaintMapRegion,
  "edit-troop-events": handleEditTroopEvents,
  "list-resources": handleListResources,
  "edit-effects": handleEditEffects,
  "edit-event-page": handleEditEventPage,
  "edit-plugin-parameters": handleEditPluginParameters,
  "edit-enemy-actions": handleEditEnemyActions,
  "delete-entity": handleDeleteEntity,
  "read-animation": handleReadAnimation,
  "edit-animation": handleEditAnimation,
  "create-skill": handleCreateSkill,
  "create-item": handleCreateItem,
  "create-weapon": handleCreateWeapon,
  "create-armor": handleCreateArmor,
  "create-class": handleCreateClass,
  "create-state": handleCreateState,
  "create-enemy": handleCreateEnemy,
  "create-actor": handleCreateActor,
  "create-animation": handleCreateAnimation,
  "get-actor-runtime": handleGetActorRuntime,
  "manage-party-runtime": handleManagePartyRuntime,
  "control-weather-runtime": handleControlWeatherRuntime,
  "play-audio-runtime": handlePlayAudioRuntime,
  "get-map-state-runtime": handleGetMapStateRuntime,
  "edit-map-info": handleEditMapInfo,
  "search-entity": handleSearchEntity,
  "duplicate-entity": handleDuplicateEntity,
  "export-project-summary": handleExportProjectSummary,
  "batch-create-entities": handleBatchCreateEntities,
  "batch-delete-entities": handleBatchDeleteEntities,
  "validate-project": handleValidateProject,
  "find-and-replace": handleFindAndReplace,
  "copy-map": handleCopyMap,
  "cleanup-project": handleCleanupProject,
  "control-timer-runtime": handleControlTimerRuntime,
  "get-battle-state-runtime": handleGetBattleStateRuntime,
  "reorder-plugin": handleReorderPlugin,
};
