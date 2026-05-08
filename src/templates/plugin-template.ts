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
};
