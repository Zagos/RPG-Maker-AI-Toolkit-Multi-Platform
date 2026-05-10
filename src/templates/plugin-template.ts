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

  // Template: Debug Bridge plugin (AI battle control via XHR)
  debugBridge: (bridgePort = 9001): string => {
    return `/*:
 * @target MZ
 * @plugindesc AI Debug Bridge - Enables AI control of battles
 * @author MCP Server
 * @version 1.4.0
 *
 * @help
 * RPGMakerDebugger v1.4.0
 *
 * Uses XMLHttpRequest to communicate with the MCP server.
 * Automatically starts a new game from the title screen.
 *
 * @command startBattle
 * @text Start Battle
 * @desc Start a battle with specified troop
 *
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

    // --- Auto New Game from Title Screen ---

    function doAutoNewGame() {
        if (autoNewGameDone) return;
        if (!SceneManager._scene) { setTimeout(doAutoNewGame, 200); return; }
        if (SceneManager._scene instanceof Scene_Title) {
            autoNewGameDone = true;
            setTimeout(function() {
                if (SceneManager._scene instanceof Scene_Title) {
                    SceneManager._scene.commandNewGame();
                }
            }, 400);
        }
    }

    var _SceneTitle_create = Scene_Title.prototype.create;
    Scene_Title.prototype.create = function() {
        _SceneTitle_create.call(this);
        doAutoNewGame();
    };

    // Detect when map scene becomes active (game world ready)
    var _SceneMap_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _SceneMap_start.call(this);
        gameReady = true;
    };

    // --- Poll loop ---

    function poll() {
        xhrGet(bridgeUrl + "/ping", function(err, response) {
            if (!err) {
                if (response && response.length > 0) {
                    try {
                        var cmd = JSON.parse(response);
                        if (cmd.command === "start_battle") {
                            startBattle(Number(cmd.troopId) || 1);
                        }
                    } catch (e) {}
                }
            }
            pollTimer = setTimeout(poll, 500);
        });
    }

    // --- Battle logic ---

    function startBattle(troopId) {
        if (!gameReady) {
            logAndReport({type:"error", message:"Game world not ready yet"});
            return;
        }
        if (isInBattle) {
            logAndReport({type:"error", message:"Already in battle"});
            return;
        }

        battleLog = [];
        isInBattle = true;
        battleComplete = false;

        var troop = $dataTroops[troopId];
        if (!troop) {
            logAndReport({type:"error", message:"Troop " + troopId + " not found"});
            isInBattle = false;
            reportState();
            return;
        }

        var enemyNames = [];
        if (troop.members) {
            for (var i = 0; i < troop.members.length; i++) {
                var ed = $dataEnemies[troop.members[i].enemyId];
                enemyNames.push(ed ? ed.name : "Enemy " + troop.members[i].enemyId);
            }
        }
        logAndReport({type:"battle_start", troopId: troopId, enemies: enemyNames});

        BattleManager.setup(troopId, true, false);
        BattleManager.setEventCallback(function() {});
        SceneManager.push(Scene_Battle);
        xhrPost(bridgeUrl + "/state", { inBattle: true, battleOver: false, turn: 0, actors: [], enemies: [] });
    }

    // Poll for battle end
    function runBattle() {
        if (!isInBattle) return;
        if (BattleManager._phase === null) {
            var result = BattleManager._result || "win";
            isInBattle = false;
            battleComplete = true;
            logAndReport({type:"battle_end", result: result});
            reportState();
            return;
        }
        setTimeout(runBattle, 200);
    }

    function finishBattle(result) {
        isInBattle = false;
        battleComplete = true;
        logAndReport({type:"battle_end", result: result});
        reportState();
    }

    function logAndReport(entry) {
        battleLog.push(entry);
        xhrPost(bridgeUrl + "/log", entry);
    }

    function reportState() {
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
                    state.actors.push({
                        name: a.name(), hp: a.hp, mhp: a.mhp, mp: a.mp, mmp: a.mmp,
                        states: a.states().map(function(s) { return s.name; })
                    });
                });
            }
        } catch (e) {}
        try {
            if ($gameTroop) {
                $gameTroop.members().forEach(function(e) {
                    state.enemies.push({
                        name: e.name(), hp: e.hp, mhp: e.mhp, mp: e.mp, mmp: e.mmp,
                        states: e.states().map(function(s) { return s.name; })
                    });
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

    // Auto-battle: override makeActions to always use Attack on first enemy
    var _actorMakeActions = Game_Actor.prototype.makeActions;
    Game_Actor.prototype.makeActions = function() {
        _actorMakeActions.call(this);
        if (isInBattle && this.canMove() && this._actions.length > 0) {
            var action = new Game_Action(this);
            action.setAttack();
            var targets = $gameTroop.aliveMembers();
            if (targets.length > 0) {
                action.setTarget(targets[0].index());
            }
            this._actions[0] = action;
            this.setActionState("waiting");
        }
    };

    var _gaApply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        var subject = this.subject();
        var item = this.item();
        var hpBefore = target ? target.hp : 0;
        _gaApply.call(this, target);
        if (target && subject && isInBattle) {
            var hpDamage = hpBefore - target.hp;
            battleLog.push({
                type: "action",
                subject: subject ? subject.name() : "unknown",
                action: item ? item.name : "Attack",
                target: target.name(),
                hpDamage: Math.max(0, hpDamage),
                hpBefore: hpBefore, hpAfter: target.hp,
                alive: target.hp > 0,
                critical: item && item.damage ? this.isCritical() : false,
                formula: item && item.damage ? (item.damage.formula || "") : "",
                turn: $gameTroop ? ($gameTroop._turnCount || 0) : 0
            });
        }
    };

    // Start battle polling after a short delay for the scene to load
    setTimeout(runBattle, 500);

    poll();
})();`;
  },
};
