const fs = require("fs");
const path = require("path");

const projectPath = "C:\\Users\\tcl_m\\Documents\\RMMZ\\Project1";

const pluginCode = `/*:
 * @target MZ
 * @plugindesc AI Debug Bridge - Enables AI control of battles via TCP
 * @author MCP Server
 * @version 1.0.0
 *
 * @help
 * RPGMakerDebugger v1.0.0
 *
 * This plugin creates a TCP server that allows external AI
 * to control and monitor battles using the real game engine.
 *
 * === Commands (TCP JSON) ===
 * {"command":"start_battle","troopId":1}
 * {"command":"get_state"}
 * {"command":"get_log"}
 *
 * === Requirements ===
 * Requires Node.js integration (enabled by default in RPG Maker MZ).
 * Place this plugin at the bottom of the plugin list.
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

    var pluginName = "RPGMakerDebugger";
    var server = null;
    var connectedSocket = null;
    var battleLog = [];
    var isInBattle = false;
    var battleComplete = false;

    function startServer() {
        try {
            var net = require("net");
            server = net.createServer(function(socket) {
                connectedSocket = socket;
                socket.setEncoding("utf8");
                var buffer = "";
                socket.on("data", function(chunk) {
                    buffer += chunk;
                    var lines = buffer.split("\\n");
                    buffer = lines.pop() || "";
                    lines.forEach(function(line) {
                        if (!line.trim()) return;
                        try {
                            processCommand(socket, JSON.parse(line));
                        } catch (e) {
                            safeSend(socket, {status:"error", message:e.message});
                        }
                    });
                });
                socket.on("close", function() {
                    if (connectedSocket === socket) connectedSocket = null;
                });
                safeSend(socket, {status:"ready", message:"Debug bridge connected"});
            });
            server.listen(9000, "127.0.0.1");
        } catch (e) {
            console.warn("RPGMakerDebugger: Failed to start TCP server", e);
        }
    }

    function safeSend(socket, data) {
        try {
            if (socket && socket.writable) {
                socket.write(JSON.stringify(data) + "\\n");
            }
        } catch (e) {}
    }

    function processCommand(socket, msg) {
        switch (msg.command) {
            case "start_battle":
                var troopId = Number(msg.troopId) || 1;
                startBattleCommand(troopId);
                safeSend(socket, {status:"ok", message:"Battle started with troop " + troopId});
                break;
            case "get_state":
                safeSend(socket, {status:"ok", state: getBattleState()});
                break;
            case "get_log":
                safeSend(socket, {status:"ok", log: battleLog});
                break;
            default:
                safeSend(socket, {status:"error", message:"Unknown command: " + msg.command});
        }
    }

    function startBattleCommand(troopId) {
        battleLog = [];
        isInBattle = true;
        battleComplete = false;

        var troop = $dataTroops[troopId];
        if (!troop) {
            battleLog.push({type:"error", message:"Troop " + troopId + " not found"});
            isInBattle = false;
            return;
        }

        var enemyNames = [];
        if (troop.members) {
            for (var i = 0; i < troop.members.length; i++) {
                var m = troop.members[i];
                var ed = $dataEnemies[m.enemyId];
                enemyNames.push(ed ? ed.name : "Enemy #" + m.enemyId);
            }
        }
        battleLog.push({type:"battle_start", troopId: troopId, enemies: enemyNames});

        BattleManager.setup(troopId, true, false);
        BattleManager.setEventCallback(function() {});

        SceneManager.push(Scene_Battle);

        startBattleLoop();
    }

    function startBattleLoop() {
        if (!isInBattle) return;
        if (!SceneManager._scene || !SceneManager._scene.constructor || SceneManager._scene.constructor.name !== "Scene_Battle") {
            if (BattleManager._phase) {
                BattleManager.update();
                setTimeout(startBattleLoop, 16);
            } else {
                isInBattle = false;
                battleComplete = true;
                battleLog.push({type:"battle_end", result: "abort"});
            }
            return;
        }

        if (!BattleManager.isBattleRunning()) {
            isInBattle = false;
            battleComplete = true;
            return;
        }

        if (BattleManager.isInputting()) {
            var actor = BattleManager._actor;
            if (actor) {
                var act = new Game_Action(actor);
                act.setAttack();
                BattleManager.startActorSelection();
            }
        }

        if (BattleManager._phase === "turn") {
            BattleManager.update();
        }

        BattleManager.update();
        setTimeout(startBattleLoop, 1);
    }

    function getBattleState() {
        if (!isInBattle && !battleComplete) {
            return {inBattle: false, turn: 0, actors: [], enemies: []};
        }

        var state = {
            inBattle: isInBattle || battleComplete,
            battleOver: battleComplete && !isInBattle,
            turn: $gameTroop ? ($gameTroop._turnCount || 0) : 0,
            actors: [],
            enemies: []
        };

        try {
            if ($gameParty) {
                $gameParty.members().forEach(function(actor) {
                    state.actors.push({
                        name: actor.name(),
                        hp: actor.hp,
                        mhp: actor.mhp,
                        mp: actor.mp,
                        mmp: actor.mmp,
                        states: actor.states().map(function(s) { return s.name; })
                    });
                });
            }
        } catch (e) {}

        try {
            if ($gameTroop) {
                $gameTroop.members().forEach(function(enemy) {
                    state.enemies.push({
                        name: enemy.name(),
                        hp: enemy.hp,
                        mhp: enemy.mhp,
                        mp: enemy.mp,
                        mmp: enemy.mmp,
                        states: enemy.states().map(function(s) { return s.name; })
                    });
                });
            }
        } catch (e) {}

        return state;
    }

    var _BattleManager_setup = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        _BattleManager_setup.call(this, troopId, canEscape, canLose);
    };

    var _BattleManager_endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function(result) {
        isInBattle = false;
        battleComplete = true;
        battleLog.push({type:"battle_end", result: result});
        _BattleManager_endBattle.call(this, result);
    };

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        var subject = this.subject();
        var item = this.item();
        var itemName = item ? item.name : "Attack";
        var subjectName = subject ? subject.name() : "unknown";

        var hpBefore = target ? target.hp : 0;

        _Game_Action_apply.call(this, target);

        if (target && subject && isInBattle) {
            var hpDamage = hpBefore - target.hp;
            var mpDamage = 0;
            var formula = "";
            var critical = false;

            if (item && item.damage) {
                formula = item.damage.formula || "";
                critical = this.isCritical();
            }

            battleLog.push({
                type: "action",
                subject: subjectName,
                action: itemName,
                target: target.name(),
                hpDamage: Math.max(0, hpDamage),
                mpDamage: Math.max(0, mpDamage),
                hpBefore: hpBefore,
                hpAfter: target.hp,
                targetHp: target.hp,
                alive: target.hp > 0,
                critical: critical,
                formula: formula,
                turn: $gameTroop ? ($gameTroop._turnCount || 0) : 0
            });
        }
    };

    try {
        startServer();
    } catch (e) {
        console.warn("RPGMakerDebugger: Could not start", e);
    }
})();
`;

// Write plugin file
const pluginPath = path.join(projectPath, "js", "plugins", "RPGMakerDebugger.js");
fs.writeFileSync(pluginPath, pluginCode, "utf-8");
console.log("✓ Plugin written:", pluginPath);

// Update plugins.js
const pluginsJsPath = path.join(projectPath, "js", "plugins.js");
let content = fs.readFileSync(pluginsJsPath, "utf-8");
const match = content.match(/\$plugins\s*=\s*(\[[\s\S]*?\]);/);
let plugins = [];
if (match) {
  try {
    plugins = JSON.parse(match[1]);
  } catch (e) {}
}
const name = "RPGMakerDebugger";
const entry = { name, status: true, description: "AI Debug Bridge for battle control", parameters: {} };
const idx = plugins.findIndex((p) => p && p.name === name);
if (idx >= 0) {
  plugins[idx] = entry;
} else {
  plugins.push(entry);
}
content =
  "// Generated by RPG Maker.\n// Do not edit this file directly.\nvar $plugins =\n" +
  JSON.stringify(plugins, null, 2) +
  ";\n";
fs.writeFileSync(pluginsJsPath, content, "utf-8");
console.log("✓ plugins.js updated - plugin enabled:", name);
