/**
 * Plantillas para generación de plugins
 */

export const PluginTemplates = {
  // Template: Plugin con parámetros configurables
  withParameters: (
    pluginName: string,
    description: string,
    author: string,
    version: string,
    parameters: Array<{
      name: string;
      type: string;
      default?: string;
      description?: string;
      desc?: string;
    }>
  ): string => {
    const paramsJson = parameters
      .map(
        (p) => `
 * @param ${p.name}
 * @type ${p.type}
 * @default ${p.default || ""}
 * @description ${p.description || p.desc || ""}`
      )
      .join("");

    return `/*:
 * @target MZ
 * @plugindesc ${description}
 * @author ${author}
 * @version ${version}${paramsJson}
 *
 * @help
 * ${pluginName} v${version}
 * by ${author}
 *
 * ${description}
 */

(() => {
  const PLUGIN_NAME = "${pluginName}";
  const PLUGIN_VERSION = "${version}";

  // Get plugin parameters
  const params = PluginManager.parameters(PLUGIN_NAME);

  PluginManager.registerCommand(PLUGIN_NAME, "exampleCommand", args => {
    console.log(\`[\${PLUGIN_NAME}] Command executed\`, args);
  });

  console.log(\`\${PLUGIN_NAME} v\${PLUGIN_VERSION} loaded\`);
})();`;
  },

  // Template: Plugin que extiende Game_Actor
  gameActorExtension: (
    pluginName: string,
    description: string,
    author: string,
    version: string
  ): string => {
    return `/*:
 * @target MZ
 * @plugindesc ${description}
 * @author ${author}
 * @version ${version}
 *
 * @help
 * ${pluginName} - Actor Extension Plugin
 * Extends Game_Actor functionality.
 */

(() => {
  const PLUGIN_NAME = "${pluginName}";

  // Store original initialize
  const _Game_Actor_initialize = Game_Actor.prototype.initialize;
  Game_Actor.prototype.initialize = function(actorId) {
    _Game_Actor_initialize.call(this, actorId);
    this._customProperty = 0; // Add your custom property
  };

  // Add custom method
  Game_Actor.prototype.customMethod = function() {
    return this._customProperty;
  };

  console.log(\`[\${PLUGIN_NAME}] Loaded\`);
})();`;
  },

  // Template: Plugin que extiende Game_Enemy
  gameEnemyExtension: (
    pluginName: string,
    description: string,
    author: string,
    version: string
  ): string => {
    return `/*:
 * @target MZ
 * @plugindesc ${description}
 * @author ${author}
 * @version ${version}
 *
 * @help
 * ${pluginName} - Enemy Extension Plugin
 */

(() => {
  const PLUGIN_NAME = "${pluginName}";

  const _Game_Enemy_initialize = Game_Enemy.prototype.initialize;
  Game_Enemy.prototype.initialize = function(enemyId, x, y) {
    _Game_Enemy_initialize.call(this, enemyId, x, y);
    this._customStats = {};
  };

  Game_Enemy.prototype.getCustomStat = function(key) {
    return this._customStats[key] || 0;
  };

  console.log(\`[\${PLUGIN_NAME}] Loaded\`);
})();`;
  },

  // Template: Plugin para manejo de eventos
  eventHandler: (
    pluginName: string,
    description: string,
    author: string,
    version: string
  ): string => {
    return `/*:
 * @target MZ
 * @plugindesc ${description}
 * @author ${author}
 * @version ${version}
 *
 * @help
 * ${pluginName} - Custom Event Handler
 */

(() => {
  const PLUGIN_NAME = "${pluginName}";

  PluginManager.registerCommand(PLUGIN_NAME, "triggerEvent", args => {
    const mapId = Number(args.mapId || $gameMap._mapId);
    const eventId = Number(args.eventId);
    
    if (mapId === $gameMap._mapId) {
      const event = $gameMap.event(eventId);
      if (event) {
        event.start();
      }
    }
  });

  console.log(\`[\${PLUGIN_NAME}] Loaded\`);
})();`;
  },

  // Template: Plugin para UI/HUD personalizado
  customUI: (
    pluginName: string,
    description: string,
    author: string,
    version: string
  ): string => {
    return `/*:
 * @target MZ
 * @plugindesc ${description}
 * @author ${author}
 * @version ${version}
 *
 * @help
 * ${pluginName} - Custom UI Plugin
 */

(() => {
  const PLUGIN_NAME = "${pluginName}";

  // Custom Sprite class
  class CustomSprite extends Sprite {
    constructor() {
      super();
      this.initialize();
    }

    initialize() {
      super.initialize();
      this.x = 0;
      this.y = 0;
      this.visible = true;
    }

    update() {
      super.update();
      // Add update logic here
    }
  }

  // Hook into Scene_Map
  const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
  Scene_Map.prototype.createAllWindows = function() {
    _Scene_Map_createAllWindows.call(this);
    this._customSprite = new CustomSprite();
    this.addWindow(this._customSprite);
  };

  console.log(\`[\${PLUGIN_NAME}] Loaded\`);
})();`;
  },

  // Template: Debug Bridge plugin (AI runtime control via XHR)
  debugBridge: (bridgePort = 9001): string => {
    return `/*:
 * @target MZ
 * @plugindesc AI Debug Bridge - MCP runtime control
 * @author MCP Server
 * @version 2.1.0
 *
 * @help
 * RPGMakerDebugger v2.1.0
 *
 * Connects to the MCP server via HTTP polling.
 * Supports: battle control, switches, variables, teleport,
 *           game state, save/load, dialogue advancement.
 *
 * @command startBattle
 * @text Start Battle
 * @desc Start a battle with specified troop
 * @arg troopId
 * @text Troop ID
 * @type number
 * @default 1
 */

var RPGMakerDebugger = RPGMakerDebugger || {};

(function() {
    "use strict";

    var bridgeUrl = "http://127.0.0.1:${bridgePort}";
    var battleLog = [];
    var isInBattle = false;
    var battleComplete = false;
    var pollTimer = null;
    var gameReady = false;
    var autoNewGameDone = false;
    var actionQueue = [];   // per-turn action plans sent with start_battle

    // --- Network helpers ---

    function xhrGet(url, callback) {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.timeout = 10000;
            xhr.onload = function() { if (callback) callback(null, xhr.responseText); };
            xhr.onerror = function() { if (callback) callback("error", null); };
            xhr.ontimeout = function() { if (callback) callback("timeout", null); };
            xhr.send();
        } catch (e) { if (callback) callback(e.message, null); }
    }

    function xhrPost(url, data) {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", url, false);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(data));
        } catch (e) {}
    }

    function ack() { xhrPost(bridgeUrl + "/ack", { done: true }); }

    // --- Game state reporter ---

    function reportFullGameState() {
        var state = {
            mapId: $gameMap ? $gameMap.mapId() : 0,
            playerX: $gamePlayer ? $gamePlayer.x : 0,
            playerY: $gamePlayer ? $gamePlayer.y : 0,
            gold: $gameParty ? $gameParty.gold() : 0,
            partyMembers: [],
            inBattle: $gameParty ? $gameParty.inBattle() : false,
            timestamp: new Date().toISOString()
        };
        try {
            if ($gameParty) {
                $gameParty.members().forEach(function(a) {
                    state.partyMembers.push({ name: a.name(), hp: a.hp, mhp: a.mhp, level: a.level });
                });
            }
        } catch (e) {}
        xhrPost(bridgeUrl + "/gamestate", state);
    }

    // --- Auto New Game from Title Screen ---

    // Hook Scene_Title.start (fully ready) — skip command window, go directly to map
    var _SceneTitle_start = Scene_Title.prototype.start;
    Scene_Title.prototype.start = function() {
        _SceneTitle_start.call(this);
        if (!autoNewGameDone) {
            autoNewGameDone = true;
            setTimeout(function() {
                try {
                    DataManager.setupNewGame();
                    SceneManager.goto(Scene_Map);
                } catch(e) {
                    xhrPost(bridgeUrl + "/log", { type: "error", message: "autoNewGame failed: " + String(e) });
                }
            }, 500);
        }
    };

    var _SceneMap_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _SceneMap_start.call(this);
        gameReady = true;
    };

    // Auto-advance messages during AI battle (intro, victory, defeat, level-up, etc.)
    // Check the scene rather than isInBattle so post-battle dialogs are also skipped
    var _wmTriggered = Window_Message.prototype.isTriggered;
    Window_Message.prototype.isTriggered = function() {
        if (SceneManager._scene instanceof Scene_Battle) return true;
        return _wmTriggered.call(this);
    };

    // Skip actor command input in AI battle — go straight to turn execution
    var _gpCanInput = Game_Party.prototype.canInput;
    Game_Party.prototype.canInput = function() {
        if (isInBattle) return false;
        return _gpCanInput ? _gpCanInput.call(this) : true;
    };

    // --- Command dispatcher ---

    function dispatch(raw) {
        // Bridge sends { command, args: { ... } } — flatten to { command, ...args }
        var cmd = (raw && raw.args && typeof raw.args === "object")
            ? Object.assign({ command: raw.command }, raw.args)
            : raw;
        try {
            switch (cmd.command) {
                case "start_battle":
                    actionQueue = Array.isArray(cmd.actionQueue) ? cmd.actionQueue : [];
                    startBattle(Number(cmd.troopId) || 1);
                    // ACK clears the command so the game doesn't re-execute
                    // on the next poll while the battle is still running
                    ack();
                    break;
                case "set_switch":
                    $gameSwitches.setValue(Number(cmd.id), Boolean(cmd.value));
                    ack();
                    break;
                case "set_variable":
                    $gameVariables.setValue(Number(cmd.id), cmd.value);
                    ack();
                    break;
                case "teleport":
                    $gamePlayer.reserveTransfer(Number(cmd.mapId), Number(cmd.x), Number(cmd.y), cmd.direction || 0, 0);
                    ack();
                    break;
                case "get_state":
                    reportFullGameState();
                    break;
                case "save_game":
                    DataManager.saveGame(Number(cmd.slot) || 98);
                    ack();
                    break;
                case "set_party_state":
                    $gameParty.members().forEach(function(actor) {
                        if (cmd.actor_id !== undefined && actor.actorId() !== Number(cmd.actor_id)) return;
                        if (cmd.hp_percent !== undefined)
                            actor.setHp(Math.max(1, Math.floor(actor.mhp * Number(cmd.hp_percent))));
                        if (cmd.mp_percent !== undefined)
                            actor.setMp(Math.floor(actor.mmp * Number(cmd.mp_percent)));
                        if (cmd.add_states)
                            cmd.add_states.forEach(function(sid) { actor.addState(Number(sid)); });
                        if (cmd.remove_states)
                            cmd.remove_states.forEach(function(sid) { actor.removeState(Number(sid)); });
                    });
                    ack();
                    break;
                case "load_game":
                    DataManager.loadGame(Number(cmd.slot) || 98).then(function() {
                        SceneManager.goto(Scene_Map);
                        // report state once the map finishes loading
                        var _origStart = Scene_Map.prototype.start;
                        Scene_Map.prototype.start = function() {
                            _origStart.call(this);
                            Scene_Map.prototype.start = _origStart;
                            reportFullGameState();
                        };
                    });
                    break;
                case "advance_dialogue":
                    if ($gameMessage && $gameMessage.isBusy()) {
                        $gameMessage.clear();
                    }
                    ack();
                    break;
            }
        } catch (e) {
            xhrPost(bridgeUrl + "/log", { type: "error", command: cmd.command, message: String(e) });
        }
    }

    // --- Poll loop ---

    function poll() {
        xhrGet(bridgeUrl + "/ping", function(err, response) {
            if (!err) {
                if (response && response.length > 0) {
                    try { dispatch(JSON.parse(response)); } catch (e) {}
                }
            }
            pollTimer = setTimeout(poll, 500);
        });
    }

    // --- Battle logic ---

    function startBattle(troopId) {
        if (!gameReady) { xhrPost(bridgeUrl + "/log", {type:"error", message:"Game not ready"}); return; }
        if (isInBattle)  { xhrPost(bridgeUrl + "/log", {type:"error", message:"Already in battle"}); return; }

        battleLog = [];
        isInBattle = true;
        battleComplete = false;

        var troop = $dataTroops[troopId];
        if (!troop) {
            xhrPost(bridgeUrl + "/log", {type:"error", message:"Troop " + troopId + " not found"});
            isInBattle = false;
            reportBattleState();
            return;
        }

        var enemyNames = [];
        if (troop.members) {
            for (var i = 0; i < troop.members.length; i++) {
                var ed = $dataEnemies[troop.members[i].enemyId];
                enemyNames.push(ed ? ed.name : "Enemy " + troop.members[i].enemyId);
            }
        }
        xhrPost(bridgeUrl + "/log", {type:"battle_start", troopId: troopId, enemies: enemyNames});

        try {
            BattleManager.setup(troopId, true, true);
            SceneManager.push(Scene_Battle);
            xhrPost(bridgeUrl + "/state", { inBattle: true, battleOver: false, turn: 0, actors: [], enemies: [] });
        } catch(e) {
            isInBattle = false;
            xhrPost(bridgeUrl + "/log", { type: "error", message: "Failed to start battle: " + String(e) });
        }
    }

    function finishBattle(result) {
        isInBattle = false;
        battleComplete = true;
        xhrPost(bridgeUrl + "/log", {type:"battle_end", result: result});
        reportBattleState();
    }

    function reportBattleState() {
        var state = {
            inBattle: isInBattle,
            battleOver: battleComplete,
            turn: $gameTroop ? ($gameTroop._turnCount || 0) : 0,
            actors: [],
            enemies: []
        };
        try {
            if ($gameParty) {
                $gameParty.members().forEach(function(a) {
                    state.actors.push({ name: a.name(), hp: a.hp, mhp: a.mhp, mp: a.mp, mmp: a.mmp,
                        states: a.states().map(function(s) { return s.name; }) });
                });
            }
        } catch (e) {}
        try {
            if ($gameTroop) {
                $gameTroop.members().forEach(function(e) {
                    state.enemies.push({ name: e.name(), hp: e.hp, mhp: e.mhp, mp: e.mp, mmp: e.mmp,
                        states: e.states().map(function(s) { return s.name; }) });
                });
            }
        } catch (e) {}
        xhrPost(bridgeUrl + "/state", state);
    }

    // --- Hooks ---

    var _bmEnd = BattleManager.endBattle;
    BattleManager.endBattle = function(result) {
        finishBattle(result);
        _bmEnd.call(this, result);
    };

    var _actorMakeActions = Game_Actor.prototype.makeActions;
    Game_Actor.prototype.makeActions = function() {
        _actorMakeActions.call(this);
        if (!isInBattle || !this.canMove() || !this._actions.length) return;

        // Look up the action plan for the current turn
        var turnIdx = $gameTroop ? ($gameTroop._turnCount || 0) : 0;
        var turnPlan = actionQueue[turnIdx];
        var instr = null;
        if (turnPlan) {
            for (var i = 0; i < turnPlan.length; i++) {
                var a = turnPlan[i];
                if (a.actor_id === undefined || Number(a.actor_id) === this.actorId()) {
                    instr = a;
                    break;
                }
            }
        }

        var action = new Game_Action(this);
        if (instr) {
            if (instr.type === "skill" && instr.skill_id) {
                action.setSkill(Number(instr.skill_id));
            } else if (instr.type === "guard") {
                action.setGuard();
            } else if (instr.type === "item" && instr.item_id) {
                action.setItem(Number(instr.item_id));
            } else {
                action.setAttack();
            }
        } else {
            action.setAttack();
        }
        var targets = $gameTroop.aliveMembers();
        if (targets.length > 0) action.setTarget(targets[0].index());
        this._actions[0] = action;
        this.setActionState("waiting");
    };

    var _gaApply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        var subject = this.subject();
        var item = this.item();
        var hpBefore = target ? target.hp : 0;
        _gaApply.call(this, target);
        if (target && subject && isInBattle) {
            var hpDamage = hpBefore - target.hp;
            var isActorSide = $gameParty && $gameParty.members().some(function(m) { return m === subject; });
            var entry = {
                type: "action",
                subject: subject ? subject.name() : "unknown",
                subject_type: isActorSide ? "actor" : "enemy",
                action: item ? item.name : "Attack",
                target: target.name(),
                hpDamage: Math.max(0, hpDamage),
                hpBefore: hpBefore, hpAfter: target.hp,
                alive: target.hp > 0,
                critical: target.result ? target.result().critical : false,
                formula: item && item.damage ? (item.damage.formula || "") : "",
                turn: $gameTroop ? ($gameTroop._turnCount || 0) : 0
            };
            battleLog.push(entry);
            xhrPost(bridgeUrl + "/log", entry);
        }
    };

    poll();
})();`;
  },
};
