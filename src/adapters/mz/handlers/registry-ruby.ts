import type { HandlerContext } from "./types.js";
import { handleLaunchGame } from "./debug.js";
import { handleSetupDebugPlugin } from "./plugin.js";
import {
  handleGetGameStateRuby,
  handleSetSwitchRuby,
  handleGetSwitchRuby,
  handleSetVariableRuby,
  handleGetVariableRuby,
  handleTeleportPlayerRuby,
  handleSaveGameRuby,
  handleLoadGameRuby,
  handleSetPartyStateRuby,
  handleGetInventoryRuby,
  handleModifyInventoryRuby,
  handleCallCommonEventRuby,
  handleModifyActorRuntimeRuby,
  handleGetActorRuntimeRuby,
  handleManagePartyRuntimeRuby,
  handleControlWeatherRuntimeRuby,
  handlePlayAudioRuntimeRuby,
  handleGetMapStateRuntimeRuby,
  handleGetBattleStateRuntimeRuby,
  handleControlTimerRuntimeRuby,
  handleExecuteScriptRuby,
  handleShowMessageRuby,
  handleStartEncounterRuby,
} from "./runtime-ruby.js";

// Handlers that replace the MZ defaults when RPGMAKER_ENGINE is vxace, vx, or xp.
// launch-game reuses the MZ handler (same executable-spawn logic).
// setup-debug-plugin is engine-aware internally.
export const RUBY_RUNTIME_HANDLERS: Record<string, (ctx: HandlerContext) => Promise<string>> = {
  "launch-game":               handleLaunchGame,
  "setup-debug-plugin":        handleSetupDebugPlugin,
  "get-game-state":            handleGetGameStateRuby,
  "set-switch":                handleSetSwitchRuby,
  "get-switch":                handleGetSwitchRuby,
  "set-variable":              handleSetVariableRuby,
  "get-variable":              handleGetVariableRuby,
  "teleport-player":           handleTeleportPlayerRuby,
  "save-game":                 handleSaveGameRuby,
  "load-game":                 handleLoadGameRuby,
  "set-party-state":           handleSetPartyStateRuby,
  "get-inventory":             handleGetInventoryRuby,
  "modify-inventory":          handleModifyInventoryRuby,
  "call-common-event":         handleCallCommonEventRuby,
  "modify-actor-runtime":      handleModifyActorRuntimeRuby,
  "get-actor-runtime":         handleGetActorRuntimeRuby,
  "manage-party-runtime":      handleManagePartyRuntimeRuby,
  "control-weather-runtime":   handleControlWeatherRuntimeRuby,
  "play-audio-runtime":        handlePlayAudioRuntimeRuby,
  "get-map-state-runtime":     handleGetMapStateRuntimeRuby,
  "get-battle-state-runtime":  handleGetBattleStateRuntimeRuby,
  "control-timer-runtime":     handleControlTimerRuntimeRuby,
  "execute-script":            handleExecuteScriptRuby,
  "show-message":              handleShowMessageRuby,
  "start-encounter":           handleStartEncounterRuby,
};
