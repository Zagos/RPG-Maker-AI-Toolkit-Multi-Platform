# RPG Maker MCP

**Model Context Protocol server for RPG Maker MZ** — lets any MCP-compatible AI (Claude, GPT, etc.) read and write your game project directly, and control the running game in real time.

> Available in [English](#english) · [Español](#español)

---

## English

### What it does

RPG Maker MCP exposes your RPG Maker MZ project as a set of tools that an AI assistant can call. Instead of describing what you want and then copy-pasting JSON by hand, you just ask the AI and it reads/writes the project files for you — with automatic backups, validation, and a full change log.

It also includes a **runtime control bridge**: install a lightweight plugin in your game once, and the AI can read game state, flip switches, set variables, teleport the player, and trigger battles while the game is actually running.

### Requirements

| Requirement | Version |
|---|---|
| Node.js | 20 + |
| RPG Maker MZ | any (existing project) |

TypeScript is only needed for development; the compiled output runs with plain Node.

### Installation

```bash
git clone https://github.com/Zagos/RPG-Maker-AI-Toolkit.git
cd RpgMakerMCP
npm install
npm run build
```

### Configuration

Copy `.env.example` to `.env` and fill in your paths:

```env
# Required — absolute path to your RPG Maker MZ project root
RPGMAKER_PROJECT_PATH=C:\Users\you\Documents\MyGame

# Optional — path to the RPG Maker MZ executable (for launch-game tool)
RPGMAKER_EXECUTABLE_PATH=C:\Program Files\RPG Maker MZ\RPGMakerMZ.exe

# Optional
MCP_DEBUG=false
LOG_LEVEL=info          # debug | info | warn | error
BACKUP_MAX_COUNT=10     # how many backup files to keep per JSON file
```

### Running

```bash
# Development (auto-reload on save)
npm run dev

# Production
npm run build
npm start
```

When the server starts you will see `✓ RPG Maker project found at: …` in the console.

### Connecting to Claude Desktop

Add this block to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rpgmaker": {
      "command": "node",
      "args": ["C:/path/to/RpgMakerMCP/dist/index.js"],
      "env": {
        "RPGMAKER_PROJECT_PATH": "C:/path/to/MyGame"
      }
    }
  }
}
```

### Project Structure

```
RpgMakerMCP/
├── src/
│   ├── index.ts               # Server entry point, tool registry, HTTP bridge
│   ├── handlers/              # One file per tool group
│   │   ├── registry.ts        # TOOL_HANDLERS routing map
│   │   ├── debug.ts           # Runtime control handlers
│   │   ├── actor.ts / item.ts / enemy.ts …
│   │   ├── batch-edit.ts      # Batch dispatcher
│   │   └── types.ts           # HandlerContext interface
│   ├── rpgmaker/
│   │   ├── reader.ts          # JSON read helpers
│   │   ├── writer.ts          # JSON write + backup + prune
│   │   ├── validator.ts       # Input validation
│   │   ├── debug-bridge.ts    # Runtime bridge (commands, ack, game state)
│   │   ├── change-log.ts      # mcp-changes.json audit log
│   │   ├── commands.ts        # Event command builders
│   │   ├── story-manager.ts
│   │   └── dialogue-manager.ts
│   ├── templates/
│   │   └── plugin-template.ts # RPGMakerDebugger plugin generator (v2)
│   ├── tools/                 # Zod/JSON schema definitions (one per tool)
│   └── types/                 # RPG Maker MZ TypeScript interfaces
├── tests/                     # Vitest test suite (250 tests, 10 suites)
├── scripts/                   # launch-rpgmaker.js helper
├── skills/                    # Claude Code slash-command skills
├── .env.example
└── .github/workflows/ci.yml   # Node 20 + 22 matrix CI
```

### Available Tools

All tools return JSON. `_id` fields are optional on input — omit them to **create** a new entity; include them to **update** an existing one.

---

#### Data & System

| Tool | Description |
|---|---|
| `health-check` | Server liveness check — returns status, project path, timestamp |
| `list-game-data` | List entities of a given type with names and IDs |
| `list-maps` | List all maps from MapInfos.json, sorted by display order |
| `read-map` | Read map metadata, events list and encounter groups |
| `read-entity` | Read a single entity by type and ID |
| `get-change-history` | Query the audit log of all MCP writes |
| `edit-system` | Edit global game settings: title, currency, party, start position, switch/variable names, audio |
| `read-system-extended` | Read extended System.json sections not exposed by `edit-system`: terms, vehicles, sounds, window settings |

**`list-game-data`** — `data_type` enum: `Actors` `Classes` `Skills` `Items` `Weapons` `Armors` `Enemies` `Troops` `States` `Animations` `Tilesets` `Maps` `CommonEvents`

**`read-map`** — input: `map_id (number)`

**`read-entity`** — `entity_type`: `Actor` `Item` `Enemy` `Weapon` `Armor` `Skill` `Class` `State` `Troop` `CommonEvent` · `entity_id (integer)`

**`get-change-history`** — filters: `limit` · `entity_type` · `tool` · `action (create|update|delete)` · `since (ISO 8601)`

**`edit-system`** — all fields optional: `game_title` · `currency_unit` · `initial_party [actor_ids]` · `start_map_id` · `start_x` · `start_y` · `switch_names {"1":"Name"}` · `variable_names {"1":"Name"}` · `title_bgm` · `battle_bgm` · `victory_me` · `defeat_me`

**`read-system-extended`** — `section` enum: `terms` `vehicles` `sounds` `basic` `all` (default: `all`). Read-only; no writes.

---

#### Characters & Enemies

| Tool | Key inputs |
|---|---|
| `edit-actor` | `actor_id?` · `name` · `nickname` · `class_id` · `initial_level` · `max_level` · `face.name` · `face.index` · `character.name` · `character.index` · `battler_name` · `equips [weapon,shield,head,body,acc]` · `profile` · `note` |
| `edit-enemy` | `enemy_id?` · `name` · `gold` · `exp` · `battler_name` · `battler_hue (0-360)` · `max_hp` · `max_mp` · `attack` · `defense` · `magic_attack` · `magic_defense` · `agility` · `luck` · `drops [{kind,data_id,denominator}]` · `note` |
| `edit-drop-items` | `enemy_id` · `mode (replace\|append\|clear)` · `drops [{kind,data_id,denominator}]` |

**`edit-actor`** — `equips` is an array of 5 IDs in order: `[weapon_id, shield_id, head_id, body_id, accessory_id]`. Use `0` for empty slot. `face` and `character` are nested objects with `name` (spritesheet filename) and `index` (0–7 or 0–3).

**`edit-enemy`** stat fields map to RPG Maker's `params[8]` array. Omit any field to keep the existing value.

**`edit-drop-items`** — Dedicated drop table editor. `kind`: 0=none, 1=item, 2=weapon, 3=armor. `denominator`: 1-in-N drop rate (e.g. `4` = 25% chance). Up to 3 slots; `append` fills from the first empty slot; `clear` resets all slots.

---

#### Equipment & Items

| Tool | Key inputs |
|---|---|
| `edit-item` | `item_id?` · `name` · `description` · `price` · `icon_index` · `itype_id (1=item,2=key)` · `consumable` · `scope (0-11)` · `occasion (0-3)` · `speed` · `success_rate` · `repeats` · `tp_gain` · `hit_type (0-2)` · `animation_id` · `note` |
| `edit-weapon` | `weapon_id?` · `name` · `wtype_id` · `price` · `icon_index` · `animation_id` · stat bonuses |
| `edit-armor` | `armor_id?` · `name` · `atype_id` · `price` · `icon_index` · stat bonuses |

Stat bonus fields (weapons & armors): `max_hp` · `max_mp` · `attack` · `defense` · `magic_attack` · `magic_defense` · `agility` · `luck`

**`edit-item`** — `scope` values: 0=none, 1=1 enemy, 2=all enemies, 3=1 enemy (dead), 4=all enemies (dead), 5=1 ally, 6=all allies, 7=1 ally (dead), 8=all allies (dead), 9=user, 10=1 ally (KO), 11=all allies (KO). `occasion` values: 0=always, 1=battle only, 2=menu only, 3=never. `hit_type`: 0=certain, 1=physical, 2=magical.

---

#### Skills, Classes & States

| Tool | Key inputs |
|---|---|
| `edit-skill` | `skill_id?` · `name` · `description` · `mp_cost` · `tp_cost` · `scope` · `occasion` · `speed` · `success_rate` · `animation_id` · `damage_type` · `icon_index` · `message1` · `message2` · `stype_id` · `required_wtype_id1` · `required_wtype_id2` · `tp_gain` · `repeats` · `hit_type` · `damage_formula` · `damage_element_id` · `damage_variance` · `damage_critical` · `note` |
| `edit-class` | `class_id?` · `name` · `exp_basis` · `exp_extra` · `exp_acc_a` · `exp_acc_b` · `learnings_mode (replace\|append\|remove_at_level)` · `learnings [{level,skill_id,note?}]` · `remove_at_level` · `note` |
| `edit-state` | `state_id?` · `name` · `icon_index` · `priority` · `restriction` · `min_turns` · `max_turns` · `remove_at_battle_end` · `remove_by_recover` · `remove_by_damage` · `damage_rate` · `description` · `overlay (0-10)` · `motion (0-10)` · `remove_by_walking` · `steps_to_remove` · `note` |
| `edit-class-learnings` | `class_id` · `mode (replace\|append\|remove_at_level)` · `learnings [{level,skill_id,note?}]` · `level?` |

**`edit-skill`** damage sub-fields: patch `damage_formula`, `damage_element_id`, `damage_variance`, `damage_critical` independently — reads the current `damage` object first, patches only the provided fields, writes back.

**`edit-class`** / **`edit-class-learnings`** — `append` mode upserts by level (if an entry for that level exists it is replaced). Entries are sorted by level after every write. `remove_at_level` removes all learnings at the specified level.

---

#### Troops (Enemy formations)

| Tool | Key inputs |
|---|---|
| `create-troop` | `name` · `members [{enemy_id, x?, y?, hidden?}]` |
| `edit-troop` | `troop_id` · `name?` · `members?` |

**`create-troop`** — Creates a new entry in `Troops.json`. `members` is required (1–8 enemies). If `x`/`y` are omitted, enemies are auto-spaced across the battle screen. Returns `{ success, troop_id, name, member_count }`.

**`edit-troop`** — Renames a troop or replaces its full member list. Provide at least one of `name` or `members`.

---

#### Common Events

| Tool | Key inputs |
|---|---|
| `create-common-event` | `name` · `trigger (0\|1\|2)?` · `switch_id?` · `commands?` |
| `edit-common-event` | `event_id` · `name?` · `trigger?` · `switch_id?` · `commands?` |

**Trigger values:** `0` = None (call-only) · `1` = Autorun (runs while switch ON) · `2` = Parallel (loops while switch ON)

`commands` use the same format as `create-map-event`: `[{ type, data }]`

---

#### Maps & Events

| Tool | Key inputs |
|---|---|
| `create-map` | `name` · `map_id?` · `width?` · `height?` · `tileset_id?` · `parent_id?` · `scroll_type?` · `encounter_step?` · `note?` · `enable_name_display?` · `autoplay_bgm?` · `bgm_name?` · `autoplay_bgs?` · `bgs_name?` |
| `edit-map` | `map_id` · `name?` · `tileset_id?` · `scroll_type?` · `encounter_step?` · `autoplay_bgm?` · `bgm_name?` · `bgm_volume?` · `bgm_pitch?` · `autoplay_bgs?` · `bgs_name?` · `parallax_name?` · `parallax_show?` · `parallax_loop_x?` · `parallax_loop_y?` · `specify_battleback?` · `battleback1?` · `battleback2?` · `encounters [{enemy_id,weight?}]?` |
| `delete-map` | `map_id` · `confirm: true` (required) |
| `create-map-event` | `map_id` · `event_name` · `x` · `y` · `event_type (npc\|chest\|enemy\|trigger)` · `character` · `pages` · `dialogue` · `treasure` · `troop_id` |
| `edit-map-event` | `map_id` · `event_id` · `name?` · `x?` · `y?` · `note?` · `append_commands?` |
| `delete-map-event` | `map_id` · `event_id` |
| `add-dialogue` | `dialogue_lines [{speaker?, text}]` · `event_name?` |
| `create-dialogue-advanced` | `dialogue_name` · `dialogue_nodes` (branching tree with choices, conditions, actions) |
| `story-generator` | `story_title` · `story_description` · `scenes` (full multi-scene story) |

**`create-map`** — Creates a new empty map and registers it in `MapInfos.json`. If `map_id` is omitted, the next available ID is auto-assigned. The tile data array is initialised to all-zeros (6 layers × width × height). Returns `{ success, map_id, name, width, height, tileset_id, parent_id, filename }`.

**`delete-map`** — Deletes `MapXXX.json` (after backup) and nulls the entry in `MapInfos.json`. Requires `confirm: true` to prevent accidental deletion.

**`edit-map-event`** — Rename, move, or append commands to an existing event. `append_commands` inserts before the terminator on page 0. Command format: `{ type, data }` — types: `message` · `choice` · `wait` · `transfer` · `script` · `switch` · `variable` · `common-event` · `battle` · `animation`.

**`delete-map-event`** — Nulls the event slot in the map's events array (non-destructive to surrounding events).

`create-map-event` **event types:**
- `npc` — walking/talking character
- `chest` — treasure chest with item reward
- `enemy` — battle trigger
- `trigger` — generic script trigger

---

#### Vehicles

| Tool | Key inputs |
|---|---|
| `edit-vehicle` | `vehicle (boat\|ship\|airship)` · `character_name?` · `character_index?` · `bgm? {name,volume,pitch,pan}` · `start_map_id?` · `start_x?` · `start_y?` |

**`edit-vehicle`** — Edits boat, ship, or airship settings in `System.json`. All fields except `vehicle` are optional. Changes take effect on next game start (or map reload if already playing).

---

#### Tilesets

| Tool | Key inputs |
|---|---|
| `edit-tileset` | `tileset_id` · `flag_overrides [{tile_id, passable?, terrain_tag?}]` |

**`edit-tileset`** — Modify the passability and terrain tag of one or more tiles in a tileset. Each entry in `flag_overrides` targets a single `tile_id` (0–8191). `passable: false` blocks all four directions; `terrain_tag` (0–7) is stored in bits 12–15 of the flag word.

---

#### Plugins

| Tool | Key inputs |
|---|---|
| `create-plugin` | `plugin_name` · `description` · `author` · `version` · `code_type (empty\|simple-hook\|command\|skill-modifier)` |
| `create-plugin-advanced` | `plugin_name` · `template_type (with-parameters\|game-actor\|game-enemy\|event-handler\|custom-ui)` |
| `setup-debug-plugin` | *(no input)* — installs the runtime bridge plugin and registers all existing plugins |
| `manage-plugins` | `action (list\|enable\|disable\|delete)` · `plugin_name?` |

`setup-debug-plugin` writes `RPGMakerDebugger.js` into `js/plugins/`, registers it in `plugins.js` (enabled), and also registers any other `.js` files already in the folder (disabled) so they appear in the Plugin Manager. Safe to call multiple times — existing plugins are never overwritten.

**`manage-plugins`** — `list` returns all registered plugins with name/status/description. `enable`/`disable` toggle a plugin's active state. `delete` removes it from the registry and deletes the `.js` file if present.

Plugin filenames are sanitized on write: names with `<>:"/\|?*`, path separators, or Windows reserved names (CON, NUL, COM1…) are rejected.

---

#### Runtime Control

These tools control the **running game** in real time. They require:
1. `setup-debug-plugin` called once on the project
2. The plugin enabled in the RPG Maker MZ Plugin Manager
3. The game running (press Play / F5)

The plugin polls the MCP server every 500 ms via HTTP. All commands are confirmed with an ACK before the tool returns.

| Tool | Description |
|---|---|
| `launch-game` | Launch the RPG Maker MZ executable |
| `get-game-state` | Read current map, player position, party HP/levels, gold |
| `get-switch` | Read the current ON/OFF value of a game switch (`id`) |
| `get-variable` | Read the current numeric value of a game variable (`id`) |
| `set-switch` | Turn a game switch ON or OFF (`id`, `value`) |
| `set-variable` | Assign a value to a game variable (`id`, `value`) |
| `get-inventory` | Read the current party inventory (`category?: items\|weapons\|armors\|all`) |
| `modify-inventory` | Add or remove items/weapons/armors/gold (`operations [{action,type,id?,amount}]`) |
| `call-common-event` | Trigger a common event by ID (`common_event_id`) |
| `modify-actor-runtime` | Change an actor's level/exp/HP/MP/TP while the game is running |
| `teleport-player` | Move the player to any map and coordinates (`map_id`, `x`, `y`, `direction?`) |
| `save-game` | Save to a slot (`slot`, default 98 — recommended for test snapshots) |
| `load-game` | Load from a slot (`slot`, default 98) — waits for the map to reload before returning |
| `set-party-state` | Set HP/MP % and add/remove status effects for one actor or the whole party |
| `start-encounter` | Trigger a battle (`troop_id` or `enemy_id` + `count` + optional `actions` turn plan) |
| `run-battle-suite` | Run the same battle N times and return aggregated stats: win rate, avg HP, damage dealt/taken |
| `execute-script` | Evaluate arbitrary JavaScript in the running game (`code`, `timeout?`) |
| `show-message` | Display a message in the game's message window (`text`, `speaker?`) |

**`get-switch`** / **`get-variable`** — Return `{ id, value, name? }`. Name is read from `System.json` if defined.

**`get-inventory`** — Returns `{ items: [{id,name,count}], weapons: [...], armors: [...], gold: number }`. Only the requested `category` is populated.

**`modify-inventory`** — `type`: `item` `weapon` `armor` `gold`. For gold, omit `id`. Multiple operations are batched into a single script call.

**`call-common-event`** — Validates the event exists in `CommonEvents.json` before executing. Logs to change log.

**`modify-actor-runtime`** — `field`: `level` `exp` `hp` `mp` `tp`. `mode`: `set` (assign directly) or `add` (delta). Multiple operations per call.

**Typical workflow:**

```
1. setup-debug-plugin              ← install once per project
2. launch-game                     ← start the game
3. get-game-state                  ← confirm connection and read initial state
4. get-switch / get-variable       ← read current flag/counter values
5. set-switch / set-variable       ← configure game flags for the scenario to test
6. get-inventory                   ← inspect party items before test
7. modify-inventory                ← add test items / gold
8. teleport-player                 ← jump to the area under test
9. modify-actor-runtime            ← set actor level/HP/TP for the scenario
10. set-party-state                ← configure HP/MP/states
11. call-common-event              ← trigger a setup event if needed
12. start-encounter                ← run a battle and get the full log
13. run-battle-suite               ← repeat N times for statistical analysis
14. save-game / load-game          ← snapshot and restore state for reproduction
```

---

#### Backups

| Tool | Key inputs |
|---|---|
| `manage-backups` | `action (list\|restore\|delete\|prune)` · `filename?` · `backup_name?` · `max_count?` |

Backups are created automatically before every write and stored in `<project>/backups/`. The `BACKUP_MAX_COUNT` env var (default `10`) controls how many are kept per file.

---

#### Batch Operations

| Tool | Key inputs |
|---|---|
| `batch-edit` | `operations [{tool, input}]` (max 50) · `stop_on_error?` |

Executes multiple tool calls in a single MCP round-trip. Each operation runs in order; failures are reported per-operation and do not block the rest (unless `stop_on_error: true`).

```json
{
  "operations": [
    { "tool": "edit-actor", "input": { "actor_id": 1, "name": "Aria" } },
    { "tool": "edit-item",  "input": { "name": "Mana Potion", "price": 150 } },
    { "tool": "set-switch", "input": { "id": 5, "value": true } }
  ]
}
```

---

### Change Log

Every successful write appends an entry to `<project>/mcp-changes.json`. Use `get-change-history` to query it:

```json
{ "tool": "get-change-history", "input": { "action": "create", "limit": 20 } }
```

Entry fields: `timestamp` · `tool` · `entityType` · `entityId` · `action` · `summary`

---

### Examples

See **[EXAMPLES.md](EXAMPLES.md)** for natural-language prompts and JSON reference inputs for every tool — in English and Spanish.

---

### Running Tests

```bash
npm test                  # run all tests once
npm run test:watch        # watch mode
npm run test:coverage     # with v8 coverage report
```

357 tests across 20 suites. (RMAI-028 to 042 handlers are covered by existing test patterns; new test files TBD.)

---

### Troubleshooting

| Error | Fix |
|---|---|
| `RPGMAKER_PROJECT_PATH is not set` | Set the variable in `.env` |
| `RPG Maker project path does not exist` | Verify the path; use forward slashes on Windows too |
| `RPG Maker data directory not found` | The project root must contain a `data/` folder |
| `Invalid plugin filename` | Plugin names must not contain `<>:"/\|?*` or path separators |
| `mapInfo is missing required fields` | Pass all 7 fields when providing mapInfo to `create-map-event` |
| `Game not connected` | Launch the game with the RPGMakerDebugger plugin enabled; wait for the map to load |
| Runtime tool times out | The game may be on the title screen — enter the map first; or the plugin is not enabled |
| Server hangs | `Ctrl+C`, verify the project path is accessible, restart with `npm run dev` |

---

## Español

### Qué hace

RPG Maker MCP expone tu proyecto de RPG Maker MZ como un conjunto de herramientas que un asistente IA puede llamar. En lugar de describir lo que quieres y copiar JSON a mano, simplemente pides al agente que lo haga — con backups automáticos, validación y un historial de cambios completo.

También incluye un **bridge de control en tiempo real**: instala un plugin ligero en tu juego una vez y el agente puede leer el estado del juego, activar switches, cambiar variables, teleportar al jugador y desencadenar batallas mientras el juego está corriendo.

### Requisitos

| Requisito | Versión |
|---|---|
| Node.js | 20 + |
| RPG Maker MZ | cualquiera (proyecto existente) |

### Instalación

```bash
git clone https://github.com/Zagos/RPG-Maker-AI-Toolkit.git
cd RpgMakerMCP
npm install
npm run build
```

### Configuración

Copia `.env.example` a `.env`:

```env
# Obligatorio — ruta absoluta a la raíz de tu proyecto RPG Maker MZ
RPGMAKER_PROJECT_PATH=C:\Users\tú\Documentos\MiJuego

# Opcional — ruta al ejecutable RPG Maker MZ (para la herramienta launch-game)
RPGMAKER_EXECUTABLE_PATH=C:\Program Files\RPG Maker MZ\RPGMakerMZ.exe

# Opcional
MCP_DEBUG=false
LOG_LEVEL=info
BACKUP_MAX_COUNT=10     # cuántos backups conservar por archivo JSON
```

### Ejecución

```bash
npm run dev    # desarrollo con recarga automática
npm run build && npm start   # producción
```

### Conexión con Claude Desktop

```json
{
  "mcpServers": {
    "rpgmaker": {
      "command": "node",
      "args": ["C:/ruta/a/RpgMakerMCP/dist/index.js"],
      "env": {
        "RPGMAKER_PROJECT_PATH": "C:/ruta/a/MiJuego"
      }
    }
  }
}
```

### Herramientas disponibles

#### Datos y sistema

| Herramienta | Descripción |
|---|---|
| `health-check` | Comprueba que el servidor está activo |
| `list-game-data` | Lista entidades por tipo con nombres e IDs |
| `list-maps` | Lista todos los mapas de MapInfos.json ordenados por posición de visualización |
| `read-map` | Lee metadatos del mapa, lista de eventos y encuentros |
| `read-entity` | Lee una entidad por tipo e ID (`Actor` `Item` `Enemy` `Weapon` `Armor` `Skill` `Class` `State` `Troop` `CommonEvent`) |
| `get-change-history` | Consulta el historial de escrituras MCP |
| `edit-system` | Edita la configuración global: título, moneda, grupo inicial, posición de inicio, nombres de switches/variables, audio |
| `read-system-extended` | Lee secciones extendidas de System.json: términos, vehículos, sonidos, configuración de ventana |

**`edit-system`** — todos opcionales: `game_title` · `currency_unit` · `initial_party` · `start_map_id/x/y` · `switch_names {"id":"nombre"}` · `variable_names` · `title_bgm/battle_bgm/victory_me/defeat_me`

**`read-system-extended`** — `section`: `terms` `vehicles` `sounds` `basic` `all`. Solo lectura.

#### Personajes y enemigos

| Herramienta | Campos clave |
|---|---|
| `edit-actor` | `actor_id?` · `name` · `nickname` · `class_id` · `initial_level` · `max_level` · `face.name` · `face.index` · `character.name` · `character.index` · `battler_name` · `equips [arma,escudo,cabeza,cuerpo,accesorio]` · `profile` · `note` |
| `edit-enemy` | `enemy_id?` · `name` · `gold` · `exp` · `battler_name` · `battler_hue (0-360)` · `max_hp` · `max_mp` · `attack` · `defense` · `magic_attack` · `magic_defense` · `agility` · `luck` · `drops [{kind,data_id,denominator}]` · `note` |
| `edit-drop-items` | `enemy_id` · `mode (replace\|append\|clear)` · `drops [{kind,data_id,denominator}]` |

**`edit-actor`** — `equips` es un array de 5 IDs: `[arma_id, escudo_id, cabeza_id, cuerpo_id, accesorio_id]`. Usa `0` para slot vacío.

**`edit-drop-items`** — `kind`: 0=ninguno, 1=ítem, 2=arma, 3=armadura. `denominator`: probabilidad 1-en-N (ej. `4` = 25%). Máximo 3 slots.

#### Equipamiento e ítems

| Herramienta | Campos clave |
|---|---|
| `edit-item` | `item_id?` · `name` · `description` · `price` · `icon_index` · `itype_id (1=ítem,2=clave)` · `consumable` · `scope (0-11)` · `occasion (0-3)` · `speed` · `success_rate` · `repeats` · `tp_gain` · `hit_type (0-2)` · `animation_id` · `note` |
| `edit-weapon` | `weapon_id?` · `name` · `wtype_id` · bonificaciones de estadísticas |
| `edit-armor` | `armor_id?` · `name` · `atype_id` · bonificaciones de estadísticas |

Bonificaciones de estadísticas: `max_hp` · `max_mp` · `attack` · `defense` · `magic_attack` · `magic_defense` · `agility` · `luck`

#### Habilidades, clases y estados

| Herramienta | Campos clave |
|---|---|
| `edit-skill` | `skill_id?` · `name` · `mp_cost` · `tp_cost` · `scope` · `damage_type` · `stype_id` · `required_wtype_id1/2` · `tp_gain` · `repeats` · `hit_type` · `damage_formula` · `damage_element_id` · `damage_variance` · `damage_critical` · `note` |
| `edit-class` | `class_id?` · `name` · parámetros de experiencia · `learnings_mode` · `learnings [{level,skill_id}]` · `note` |
| `edit-state` | `state_id?` · `name` · `restriction` · `priority` · duraciones · `description` · `overlay (0-10)` · `motion (0-10)` · `remove_by_walking` · `steps_to_remove` · `note` |
| `edit-class-learnings` | `class_id` · `mode (replace\|append\|remove_at_level)` · `learnings [{level,skill_id,note?}]` · `level?` |

#### Tropas (formaciones de enemigos)

| Herramienta | Campos clave |
|---|---|
| `create-troop` | `name` · `members [{enemy_id, x?, y?, hidden?}]` |
| `edit-troop` | `troop_id` · `name?` · `members?` |

**`create-troop`** — Crea una nueva entrada en `Troops.json`. `members` requerido (1–8 enemigos). Si se omite `x`/`y`, los enemigos se distribuyen automáticamente en la pantalla de batalla. Devuelve `{ success, troop_id, name, member_count }`.

**`edit-troop`** — Renombra una tropa o reemplaza su lista de miembros completa.

#### Eventos comunes

| Herramienta | Campos clave |
|---|---|
| `create-common-event` | `name` · `trigger (0\|1\|2)?` · `switch_id?` · `commands?` |
| `edit-common-event` | `event_id` · `name?` · `trigger?` · `switch_id?` · `commands?` |

**Trigger:** `0`=Solo llamada · `1`=Autorun (switch ON) · `2`=Paralelo (loop)

#### Mapas y eventos

| Herramienta | Campos clave |
|---|---|
| `create-map` | `name` · `map_id?` · `width?` · `height?` · `tileset_id?` · `parent_id?` · `scroll_type?` · `encounter_step?` · `note?` · `enable_name_display?` · `autoplay_bgm?` · `bgm_name?` |
| `edit-map` | `map_id` · `name?` · `tileset_id?` · `scroll_type?` · `encounter_step?` · `autoplay_bgm?` · `bgm_name?` · `bgm_volume?` · `encounters [{enemy_id, weight?}]?` |
| `delete-map` | `map_id` · `confirm: true` (obligatorio) |
| `create-map-event` | `map_id` · `event_name` · `x` · `y` · `event_type` · `pages` |
| `edit-map-event` | `map_id` · `event_id` · `name?` · `x?` · `y?` · `note?` · `append_commands?` |
| `delete-map-event` | `map_id` · `event_id` |
| `add-dialogue` | `dialogue_lines` · `event_name?` |
| `create-dialogue-advanced` | `dialogue_name` · `dialogue_nodes` (árbol con opciones y condiciones) |
| `story-generator` | `story_title` · `scenes` (historia multi-escena completa) |

**`create-map`** — Crea un nuevo mapa vacío y lo registra en `MapInfos.json`. Si se omite `map_id`, se asigna automáticamente el siguiente ID disponible. Devuelve `{ success, map_id, name, width, height, tileset_id, parent_id, filename }`.

**`edit-map`** — Modifica propiedades de un mapa existente sin tocar tiles ni eventos. Actualiza también `MapInfos.json` cuando cambia `name`.

**`delete-map`** — Elimina `MapXXX.json` (tras crear un backup) y pone null la entrada en `MapInfos.json`. Requiere `confirm: true`.

**`edit-map-event`** — Renombra, mueve o añade comandos a un evento existente. `append_commands` inserta antes del terminador en la página 0. Formato: `{ type, data }` — tipos: `message` · `choice` · `wait` · `transfer` · `script` · `switch` · `variable` · `common-event` · `battle` · `animation`.

**`delete-map-event`** — Pone null el slot del evento en el array de eventos del mapa.

#### Vehículos

| Herramienta | Campos clave |
|---|---|
| `edit-vehicle` | `vehicle (boat\|ship\|airship)` · `character_name?` · `character_index?` · `bgm? {name,volume,pitch,pan}` · `start_map_id?` · `start_x?` · `start_y?` |

**`edit-vehicle`** — Edita bote, barco o aeronave en `System.json`. Todos los campos excepto `vehicle` son opcionales.

---

#### Tilesets

| Herramienta | Campos clave |
|---|---|
| `edit-tileset` | `tileset_id` · `flag_overrides [{tile_id, passable?, terrain_tag?}]` |

**`edit-tileset`** — Modifica la pasabilidad y la etiqueta de terreno de uno o varios tiles de un tileset. `tile_id` va de 0 a 8191. `passable: false` bloquea las cuatro direcciones. `terrain_tag` (0–7) se almacena en los bits 12–15 del flag.

#### Plugins

| Herramienta | Descripción |
|---|---|
| `create-plugin` | Plugin básico con plantillas de código |
| `create-plugin-advanced` | Plugin avanzado con plantillas especializadas |
| `setup-debug-plugin` | Instala el plugin de bridge en tiempo real y registra todos los plugins existentes |
| `manage-plugins` | `action (list\|enable\|disable\|delete)` · `plugin_name?` |

`setup-debug-plugin` escribe `RPGMakerDebugger.js` en `js/plugins/`, lo registra en `plugins.js` (activado) y también registra los demás `.js` ya existentes en la carpeta (desactivados) para que aparezcan en el Plugin Manager. Se puede llamar varias veces — nunca sobreescribe plugins existentes.

**`manage-plugins`** — `list` devuelve todos los plugins registrados con nombre/estado/descripción. `enable`/`disable` activan o desactivan. `delete` los elimina del registro y borra el archivo `.js` si existe.

#### Control en tiempo real

Estas herramientas controlan el **juego en ejecución**. Requieren:
1. `setup-debug-plugin` llamado una vez en el proyecto
2. El plugin activado en el Plugin Manager de RPG Maker MZ
3. El juego en ejecución (pulsar Play / F5)

| Herramienta | Descripción |
|---|---|
| `launch-game` | Lanza el ejecutable de RPG Maker MZ |
| `get-game-state` | Lee mapa actual, posición del jugador, HP/nivel del grupo, oro |
| `get-switch` | Lee el valor ON/OFF actual de un switch del juego (`id`) |
| `get-variable` | Lee el valor numérico actual de una variable del juego (`id`) |
| `set-switch` | Activa o desactiva un switch del juego (`id`, `value`) |
| `set-variable` | Asigna un valor a una variable del juego (`id`, `value`) |
| `get-inventory` | Lee el inventario actual del grupo (`category?: items\|weapons\|armors\|all`) |
| `modify-inventory` | Añade o quita ítems/armas/armaduras/oro (`operations [{action,type,id?,amount}]`) |
| `call-common-event` | Dispara un evento común por ID (`common_event_id`) |
| `modify-actor-runtime` | Modifica nivel/exp/HP/MP/TP de un actor en tiempo real |
| `teleport-player` | Mueve al jugador a cualquier mapa y coordenadas (`map_id`, `x`, `y`, `direction?`) |
| `save-game` | Guarda en un slot (`slot`, por defecto 98 — recomendado para snapshots de test) |
| `load-game` | Carga desde un slot (`slot`, por defecto 98) — espera a que el mapa recargue antes de devolver |
| `set-party-state` | Ajusta HP/MP % y añade/quita estados a un actor o a todo el grupo |
| `start-encounter` | Inicia una batalla (`troop_id` o `enemy_id` + `count` + `actions` opcional con plan de turnos) |
| `run-battle-suite` | Corre la misma batalla N veces y devuelve estadísticas agregadas: win rate, HP medio, daño infligido/recibido |
| `execute-script` | Evalúa JavaScript arbitrario en el juego en ejecución (`code`, `timeout?`) |
| `show-message` | Muestra un mensaje en la ventana de mensajes del juego (`text`, `speaker?`) |

**Flujo típico:**

```
1. setup-debug-plugin              ← instalar una vez por proyecto
2. launch-game                     ← iniciar el juego
3. get-game-state                  ← verificar conexión y leer estado inicial
4. get-switch / get-variable       ← leer valores actuales de flags/contadores
5. set-switch / set-variable       ← configurar flags para el escenario a probar
6. get-inventory                   ← inspeccionar inventario antes del test
7. modify-inventory                ← añadir ítems/oro de prueba
8. teleport-player                 ← saltar al área bajo prueba
9. modify-actor-runtime            ← ajustar nivel/HP/TP del actor para el escenario
10. set-party-state                ← configurar HP/MP/estados del grupo
11. call-common-event              ← disparar evento de configuración si es necesario
12. start-encounter                ← ejecutar batalla y obtener el log completo
13. run-battle-suite               ← repetir N veces para análisis estadístico
14. save-game / load-game          ← guardar y restaurar estado para reproducción
```

#### Backups

`manage-backups` — acciones: `list` · `restore` · `delete` · `prune`

Los backups se crean automáticamente antes de cada escritura. `BACKUP_MAX_COUNT` controla cuántos se conservan (por defecto 10).

#### Operaciones en lote

`batch-edit` — ejecuta hasta 50 operaciones en una sola llamada MCP. Devuelve resultados individuales. Usa `stop_on_error: true` para detener en el primer error.

```json
{
  "operations": [
    { "tool": "edit-actor",   "input": { "actor_id": 1, "name": "Aria" } },
    { "tool": "edit-weapon",  "input": { "weapon_id": 3, "attack": 45 } },
    { "tool": "set-switch",   "input": { "id": 10, "value": true } }
  ]
}
```

### Ejemplos

Consulta **[EXAMPLES.md](EXAMPLES.md)** para ver prompts en lenguaje natural y entradas JSON de referencia para cada herramienta — en inglés y español.

---

### Tests

```bash
npm test               # ejecutar todos los tests
npm run test:coverage  # con informe de cobertura
```

357 tests en 20 suites.

### Solución de problemas

| Error | Solución |
|---|---|
| `RPGMAKER_PROJECT_PATH is not set` | Configura la variable en `.env` |
| `RPG Maker project path does not exist` | Verifica la ruta; en Windows usa barras `/` también |
| `RPG Maker data directory not found` | La raíz del proyecto debe tener una carpeta `data/` |
| `Invalid plugin filename` | Los nombres de plugin no pueden contener `<>:"/\|?*` ni separadores de ruta |
| `Game not connected` | Lanza el juego con el plugin RPGMakerDebugger activado; espera a que cargue el mapa |
| Tool de runtime agota el tiempo | El juego puede estar en la pantalla de título — entra al mapa primero |
| Server cuelgado | `Ctrl+C` → verifica que la ruta es accesible → reinicia con `npm run dev` |

---

## Contributing / Contribuir

Pull requests are welcome. See [CLAUDE.md](CLAUDE.md) for architecture notes and conventions.

## License / Licencia

MIT — Created by **Zagos**
