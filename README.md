# RPG Maker AI Toolkit — Multi-Platform

**Model Context Protocol server for RPG Maker MZ · MV · VX Ace · VX · XP** — lets any MCP-compatible AI (Claude, GPT, etc.) read and write your game project directly, and control the running game in real time.

> Available in [English](#english) · [Español](#español)

---

## English

### What it does

RPG Maker AI Toolkit exposes your RPG Maker project as **12 macro tools** that an AI assistant can call. Instead of describing what you want and then copy-pasting files by hand, you just ask the AI and it reads/writes the project files for you — with automatic backups, validation, and a full change log.

The server architecture uses 12 high-level macro tools exposed to the LLM, backed by ~110 internal handlers. This keeps the LLM's tool list lean while preserving full depth. A `batch-edit` escape hatch is also available for multi-step operations that need direct handler access.

Supports **all major RPG Maker engines**: MZ, MV (JSON-based), and VX Ace, VX, XP (Ruby Marshal format via a built-in bridge).

For MZ/MV it also includes a **runtime control bridge**: install a lightweight plugin in your game once, and the AI can read game state, flip switches, set variables, teleport the player, and trigger battles while the game is actually running. VX Ace, VX, and XP use an equivalent TCP bridge.

### Requirements

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20 + | Required for all engines |
| RPG Maker MZ or MV | any | JSON format — no extra deps |
| RPG Maker VX Ace, VX or XP | any | Also requires Ruby (see below) |
| Ruby | 2.7 + | Required only for VX Ace / VX / XP |

TypeScript is only needed for development; the compiled output runs with plain Node.

> **Ruby note:** For VX Ace (`.rvdata2`), VX (`.rvdata`), and XP (`.rxdata`) projects, a Ruby executable must be on your PATH (or set `RUBY_PATH` in `.env`). Most systems that have these engines installed already have Ruby available via RGSS.

### Installation

```bash
git clone https://github.com/Zagos/RPG-Maker-AI-Toolkit-Multi-Platform.git
cd RPG-Maker-AI-Toolkit-Multi-Platform
npm install
npm run build
```

### Configuration

Copy `.env.example` to `.env` and fill in your paths:

```env
# Required — absolute path to your RPG Maker project root
RPGMAKER_PROJECT_PATH=C:\Users\you\Documents\MyGame

# Required — engine to use: mz (default) | mv | vxace | vx | xp
RPGMAKER_ENGINE=mz

# Optional — path to the RPG Maker executable (for game-setup action: launch)
RPGMAKER_EXECUTABLE_PATH=C:\Program Files\RPG Maker MZ\RPGMakerMZ.exe

# Optional — path to Ruby executable (required for vxace / vx / xp)
# RUBY_PATH=ruby

# Optional
MCP_DEBUG=false
LOG_LEVEL=info          # debug | info | warn | error
BACKUP_MAX_COUNT=10     # how many backup files to keep per data file
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

### Engine compatibility

| Engine | Format | `RPGMAKER_ENGINE` | Runtime bridge |
|---|---|---|---|
| RPG Maker MZ | JSON | `mz` (default) | Yes — HTTP (port 9001) |
| RPG Maker MV | JSON | `mv` | Yes — HTTP (port 9001) |
| RPG Maker VX Ace | `.rvdata2` (Marshal) | `vxace` | Yes — TCP (port 9002) |
| RPG Maker VX | `.rvdata` (Marshal) | `vx` | Yes — TCP (port 9002) |
| RPG Maker XP | `.rxdata` (Marshal) | `xp` | Yes — TCP (port 9002) |

### Project Structure

```
src/
├── index.ts                   # Server entry point — exposes 12 macros + batch-edit
├── core/
│   ├── resolve-handler.ts     # Engine-aware handler routing
│   ├── change-log.ts          # mcp-changes.json audit log
│   └── types/
│       ├── reader.ts          # IProjectReader interface
│       └── writer.ts          # IProjectWriter interface
├── macro/
│   ├── schemas/               # 12 macro tool JSON schemas
│   └── handlers/              # Macro dispatchers → call internal handlers
├── handlers/                  # ~110 internal handlers (not exposed to LLM)
│   ├── registry.ts / registry-ruby.ts / types.ts
│   └── *.ts
└── adapters/
    ├── mz/                    # RPG Maker MZ (JSON)
    │   ├── reader.ts / writer.ts / validator.ts
    │   ├── commands.ts / constants.ts / debug-bridge.ts
    │   └── tools/             # Internal JSON schemas (batch-edit uses these)
    ├── mv/                    # RPG Maker MV (extends MZ)
    ├── vxace/                 # RPG Maker VX Ace (.rvdata2)
    ├── vx/                    # RPG Maker VX (.rvdata)
    ├── xp/                    # RPG Maker XP (.rxdata)
    └── ruby-bridge/
        ├── bridge.rb          # Ruby Marshal ↔ JSON converter
        ├── game-bridge.rb     # TCP server injected into game (port 9002)
        └── tcp-bridge.ts      # Node.js TCP client
tests/                         # Vitest test suite (810+ tests, 43 suites)
```

---

### Available Tools

The LLM sees **12 macro tools** plus `batch-edit`. Each macro accepts `{ action, data }` where `data` carries action-specific fields. Exceptions: `runtime-control` and `runtime-inspect` use flat top-level fields; `manage-backups` also uses flat fields.

All tools return JSON. Every successful write creates a timestamped backup and appends an entry to the change log.

---

#### `runtime-control` — Control the running game

Modifies live game state while the game is running. Requires the debug bridge to be set up first (see **Runtime Bridge Setup** below).

| `action` | Key fields | Description |
|---|---|---|
| `set-switch` | `id`, `value` | Turn a game switch ON or OFF |
| `set-variable` | `id`, `value` | Assign a value to a game variable |
| `teleport` | `map_id`, `x`, `y`, `direction?` | Move the player to any map and coordinates |
| `save` | `slot?` | Save to a slot (default 98) |
| `load` | `slot?` | Load from a slot (default 98) |
| `modify-inventory` | `operations [{action,type,id?,amount}]` | Add or remove items / weapons / armors / gold |
| `set-party-state` | `actor_id?`, `hp_percent?`, `mp_percent?`, `states?` | Set HP/MP % and status effects for one actor or whole party |
| `call-common-event` | `common_event_id` | Trigger a common event by ID |
| `modify-actor` | `actor_id`, `field`, `value`, `mode?` | Change an actor's level / exp / HP / MP / TP |
| `manage-party` | `action (get\|add\|remove)`, `actor_id?` | Read party list or add/remove a member |
| `control-weather` | `type (none\|rain\|storm\|snow)`, `power (0-9)`, `duration?` | Change weather effect |
| `play-audio` | `action (bgm\|bgs\|se\|me\|stop_bgm\|stop_bgs\|stop_se)`, `name?`, `volume?`, `pitch?`, `pan?` | Play or stop audio |
| `control-timer` | `action (start\|stop\|get)`, `frames?` | Control the in-game countdown timer |
| `show-message` | `text`, `speaker?` | Display a message in the game's message window |
| `execute-script` | `code`, `timeout?` | Evaluate arbitrary JavaScript (MZ/MV) or Ruby (VX Ace/VX/XP) in the running game |

---

#### `runtime-inspect` — Read live game state

Reads the current state of the running game. Same bridge requirement as `runtime-control`.

| `action` / `type` | Key fields | Returns |
|---|---|---|
| `game-state` | — | Map ID, player position, party HP/levels, gold |
| `switch` | `id` | Current ON/OFF value and name |
| `variable` | `id` | Current numeric value and name |
| `inventory` | `category? (items\|weapons\|armors\|all)` | Party inventory with counts |
| `actor` | `actor_id` | Level, HP, MP, TP, states, equipment, skills |
| `party` | — | Current party member list |
| `map` | — | Map dimensions, player position, active weather |
| `battle` | — | Current battle state: turn, enemies, party (returns `in_battle: false` if not in battle) |
| `timer` | — | Timer state: `{ working, seconds }` |

---

#### `query-data` — Read project data

Read-only access to all project data files. No writes are performed.

| `action` | Key fields | Description |
|---|---|---|
| `list` | `data_type` | List entities of a type with IDs and names |
| `entity` | `entity_type`, `entity_id` | Read a single entity's full data |
| `map` | `map_id` | Read map metadata, events, and encounters |
| `maps` | — | List all maps from MapInfos |
| `resources` | `category?` | List asset files in `img/` and `audio/` by category |
| `system` | `section?` | Read System.json (section: `terms\|vehicles\|sounds\|basic\|all`) |
| `animation` | `animation_id?` | Read one animation or list all |
| `tileset` | `tileset_id?`, `include_flags?` | Read tileset metadata and optional flag array |
| `search` | `entity_type`, `query` | Case-insensitive substring search by name |
| `summary` | — | Compact project overview: entity counts, map names, switch/variable totals |

`data_type` enum: `Actors` `Classes` `Skills` `Items` `Weapons` `Armors` `Enemies` `Troops` `States` `Animations` `Tilesets` `Maps` `CommonEvents`

`resources` categories: `characters` `faces` `battlers` `sv_actors` `tilesets` `parallaxes` `pictures` `bgm` `bgs` `se` `me` `all`

---

#### `game-entity` — Create, edit, delete, and duplicate entities

Manages all RPG database entities. Pass `action: "create"` to add a new entry (omit the ID); pass `action: "edit"` with an ID to update an existing one.

| `action` | `type` values | Key `data` fields |
|---|---|---|
| `create` | actor, item, weapon, armor, skill, class, state, enemy, troop, common-event, animation, tileset | `name` (required) + type-specific fields |
| `edit` | same as above | `<type>_id` + fields to update |
| `delete` | same as above | `entity_type`, `entity_id`, `confirm: true` |
| `duplicate` | same as above | `entity_type`, `entity_id`, `new_name` |
| `generate` | character | `name`, `archetype (warrior\|mage\|rogue\|healer\|paladin\|ranger)` |
| `traits` | actor, class, enemy, weapon, armor, state | `entity_id`, `mode (replace\|append\|clear)`, `traits [{code,data_id,value}]` |
| `effects` | skill, item | `entity_id`, `mode`, `effects [{code,data_id,value1,value2}]` |
| `class-learnings` | class | `class_id`, `mode (replace\|append\|remove_at_level)`, `learnings [{level,skill_id}]` |
| `enemy-actions` | enemy | `enemy_id`, `mode`, `actions [{skill_id,rating,condition_type,...}]` |
| `drop-items` | enemy | `enemy_id`, `mode`, `drops [{kind,data_id,denominator}]` |
| `character` | (system) | `vehicle (boat\|ship\|airship)` + optional sprite/BGM/start position |
| `system` | (system) | Global settings: `game_title`, `currency_unit`, `initial_party`, `start_map_id/x/y`, `switch_names`, `variable_names`, audio fields, option flags |

`generate` builds a complete actor from a high-level archetype. It reads the project's classes, weapons, and armors and picks the best fit via keyword matching. Returns `{ actor_id, class_id, equips, sprite }`.

`delete` creates a backup before nulling the entity slot. The index is preserved — equivalent to the RPG Maker editor's delete behavior.

---

#### `game-map` — All map and tileset operations

| `action` | Key `data` fields | Description |
|---|---|---|
| `create` | `name`, `map_id?`, `width?`, `height?`, `tileset_id?`, `parent_id?` | Create a new empty map |
| `edit` | `map_id`, `name?`, `tileset_id?`, `encounters?`, BGM/BGS/parallax fields | Edit map properties |
| `delete` | `map_id`, `confirm: true` | Delete map file and null MapInfos entry |
| `copy` | `source_map_id`, `new_name`, `parent_id?` | Duplicate a map with tiles and events |
| `edit-info` | `map_id`, `name?`, `parent_id?`, `order?`, `expanded?` | Edit MapInfos metadata only (no map file I/O) |
| `read-tiles` | `map_id`, `x?`, `y?`, `width?`, `height?`, `layers?` | Read tile IDs for a region |
| `paint-tiles` | `map_id`, `tiles [{x,y,layer,tile_id}]` | Apply individual tile changes atomically |
| `fill` | `map_id`, `x`, `y`, `width`, `height`, `layer`, `tile_id` | Fill a rectangle with one tile ID |
| `paint-region` | `map_id`, `layer`, `x`, `y`, `width`, `height`, `tile_id` or `tiles [flat array]` | Fill or stamp a tile region |
| `create-event` | `map_id`, `event_name`, `x`, `y`, `event_type`, `pages` | Create a new map event |
| `edit-event` | `map_id`, `event_id`, `name?`, `x?`, `y?`, `append_commands?` | Edit an existing event |
| `delete-event` | `map_id`, `event_id` | Null the event slot |
| `edit-event-page` | `map_id`, `event_id`, `mode (add\|replace\|remove)`, `page_index?`, `page?` | Add, replace, or remove an event page |
| `edit-troop-events` | `troop_id`, `mode (replace_all\|append\|clear)`, `pages [{conditions,span,commands}]` | Edit battle event pages in a troop |
| `create-tileset` | `name`, `mode?`, `tilesetNames? [9 entries]` | Create a new tileset entry |
| `edit-tileset` | `tileset_id`, `flag_overrides [{tile_id,passable?,terrain_tag?}]` | Edit tile passability and terrain tags |
| `edit-tileset-properties` | `tileset_id`, `name?`, `mode?`, `tilesetNames?` | Edit tileset name, mode, and graphic references |

Tile layers: 0–3 = tile layers (IDs >= 2048), 4 = shadow flags (0–15), 5 = region ID (0–255).

Event commands use `{ type, data }` format. Supported types include: `message`, `choice`, `conditional-branch`, `loop`, `switch`, `variable`, `transfer`, `script`, `battle`, `common-event`, `play-bgm`, `play-se`, `show-picture`, `wait`, and 20+ more. See EXAMPLES.md for full reference.

---

#### `dialogue-tools` — Dialogue and story authoring

| `action` | Key `data` fields | Description |
|---|---|---|
| `add` | `dialogue_lines [{speaker?,text}]`, `event_name?` | Add dialogue to an event (simple) |
| `create-advanced` | `dialogue_name`, `dialogue_nodes` | Create a branching dialogue tree with choices, conditions, and actions |
| `generate-story` | `story_title`, `story_description`, `scenes` | Generate a full multi-scene story with maps and events |
| `export` | `include_maps?`, `include_common_events?`, `map_ids?` | Export all dialogue text to structured JSON |
| `import` | `entries [array]`, `confirm: true` | Write translated/modified dialogue back into the project |

`export` produces entries with `source_type`, `source_id`, `event_id`, `page`, `command_index`, `speaker`, and `lines[]`. Primary use: translation workflows. `import` matches by those same fields — line count must match the original.

---

#### `battle-sim` — Battle simulation

| `action` | Key `data` fields | Description |
|---|---|---|
| `encounter` | `troop_id` or `enemy_id` + `count`, `actions?` | Trigger a single battle with an optional turn plan |
| `suite` | `troop_id` or `enemy_id`, `runs`, `actions?` | Run the same battle N times; returns win rate, avg HP, damage dealt/taken |

---

#### `project-tools` — Project maintenance and batch operations

| `action` | Key `data` fields | Description |
|---|---|---|
| `validate` | `entity_types?`, `include_warnings?` | Run all validators; returns structured report with errors and warnings |
| `cleanup` | `entity_types?` | Read-only audit of null slots in entity arrays |
| `find-replace` | `find`, `replace`, `targets?`, `confirm: true` | Bulk search and replace across names, notes, and event command text |
| `batch-update` | `entity_type`, `entity_ids [array]`, `updates {object}`, `confirm: true` | Apply the same field changes to multiple entities |
| `batch-create` | `entity_type`, `entities [array]` (max 50) | Create multiple entities of the same type atomically |
| `batch-delete` | `entity_type`, `entity_ids [array]` (max 100), `confirm: true` | Null multiple entity slots in one call |
| `history` | `limit?`, `entity_type?`, `action?`, `since?` | Query the audit change log |

`validate` returns `{ valid, total_checked, total_errors, total_warnings, issues: [{entity_type, id, name, errors[], warnings[]}] }`.

`find-replace` targets: `"names"` `"notes"` `"event_commands"` (default: all three). Returns `{ total_replacements, files_changed[] }`.

---

#### `plugin-manage` — Plugin management (MZ/MV) and Script management (Ruby engines)

**MZ / MV:**

| `action` | Key `data` fields | Description |
|---|---|---|
| `create` | `plugin_name`, `description`, `author`, `version`, `code_type` | Create a new plugin from a template |
| `create-advanced` | `plugin_name`, `template_type` | Create a plugin using a specialized template |
| `manage` | `action (list\|enable\|disable\|delete)`, `plugin_name?` | List or toggle plugins |
| `edit-parameters` | `plugin_name`, `parameters {key: "value", …}` | Update plugin parameter values (all values are strings in MZ) |
| `reorder` | `plugin_name`, `position (first\|last\|before\|after)`, `relative_plugin?` | Change plugin load order |

**VX Ace / VX / XP** (Ruby engines use scripts, not plugins):

| `action` | Key `data` fields | Description |
|---|---|---|
| `list-scripts` | — | Return `[{id, name}]` for all scripts |
| `read-script` | `id?` or `name?` | Return `{id, name, source}` |
| `create-script` | `name`, `source` | Append a new script; returns `script_id` |
| `edit-script` | `id`, `name?`, `source?` | Update script name and/or source |
| `delete-script` | `id`, `confirm: true` | Remove a script by ID |

Plugin filenames are sanitized on write — names with `<>:"/\|?*`, path separators, or Windows reserved names are rejected.

---

#### `game-setup` — Health check and game launch

| `action` | Key `data` fields | Description |
|---|---|---|
| `health-check` | — | Server liveness check: status, engine, project path, timestamp |
| `setup-debug` | — | Install the runtime bridge plugin/script into the project |
| `launch` | — | Launch the RPG Maker executable |

`setup-debug` on MZ/MV writes `RPGMakerDebugger.js` into `js/plugins/` and registers it. On VX Ace/VX/XP it injects `RpgMakerMCPBridge` into `Scripts.rvdata2`. Safe to call multiple times — existing plugins/scripts are never overwritten.

---

#### `manage-backups` — Backup management

Uses flat fields directly (no `data` wrapper):

| Field | Description |
|---|---|
| `action (list\|restore\|delete\|prune)` | Operation to perform |
| `filename?` | Filter by source file |
| `backup_name?` | Target a specific backup file |
| `max_count?` | Prune to this many backups per file |

Backups are created automatically before every write and stored in `<project>/backups/`. The `BACKUP_MAX_COUNT` env var (default `10`) controls retention. For Ruby engines, backups are binary copies of the Marshal files.

---

#### `batch-edit` — Escape hatch for multi-step operations

Executes multiple internal handler calls in a single MCP round-trip. Each operation runs in order; failures are reported per-operation and do not block the rest (unless `stop_on_error: true`).

```json
{
  "operations": [
    { "tool": "edit-actor", "input": { "actor_id": 1, "name": "Aria" } },
    { "tool": "edit-item",  "input": { "name": "Mana Potion", "price": 150 } },
    { "tool": "set-switch", "input": { "id": 5, "value": true } }
  ],
  "stop_on_error": false
}
```

Maximum 50 operations per call. Nested `batch-edit` calls are rejected. Use this when a workflow doesn't map cleanly to a single macro.

---

### Runtime Bridge Setup

#### MZ / MV — HTTP bridge (port 9001)

1. Call `game-setup` with `action: "setup-debug"` — installs `RPGMakerDebugger.js`
2. Enable the plugin in the RPG Maker Plugin Manager
3. Press Play / F5 — the plugin polls the MCP server every 500 ms

#### VX Ace / VX / XP — TCP bridge (port 9002)

1. Call `game-setup` with `action: "setup-debug"` — injects `RpgMakerMCPBridge` into `Scripts.rvdata2`
2. Close and reopen the project in RPG Maker so it picks up the new script
3. Press Play — the script starts a TCP server on port 9002 inside the game

You can change the Ruby bridge port with `RUBY_BRIDGE_PORT` in `.env` (default: `9002`).

**Typical runtime workflow:**

```
1. game-setup (setup-debug)        ← install once per project
2. game-setup (launch)             ← start the game
3. runtime-inspect (game-state)    ← confirm connection and read initial state
4. runtime-inspect (switch/variable) ← read current flag/counter values
5. runtime-control (set-switch/set-variable) ← configure flags for the scenario
6. runtime-inspect (inventory)     ← inspect party items before test
7. runtime-control (modify-inventory) ← add test items / gold
8. runtime-control (teleport)      ← jump to the area under test
9. runtime-control (modify-actor)  ← set actor level/HP/TP for the scenario
10. runtime-control (set-party-state) ← configure HP/MP/states
11. runtime-control (call-common-event) ← trigger a setup event if needed
12. battle-sim (encounter)         ← run a battle and get the full log
13. battle-sim (suite)             ← repeat N times for statistical analysis
14. runtime-control (save/load)    ← snapshot and restore state for reproduction
```

---

### Change Log

Every successful write appends an entry to `<project>/mcp-changes.json`. Query it via `project-tools` with `action: "history"`:

```json
{ "action": "history", "data": { "action": "create", "limit": 20 } }
```

Entry fields: `timestamp` · `tool` · `entityType` · `entityId` · `action` · `summary`

---

### Examples

You never write JSON directly — just describe what you want in plain language and the AI handles the rest. See **[EXAMPLES.md](EXAMPLES.md)** for natural-language prompts and the equivalent JSON for every macro, in English and Spanish.

---

### Running Tests

```bash
npm test                  # run all tests once
npm run test:watch        # watch mode
npm run test:coverage     # with v8 coverage report
```

810+ tests across 43 suites (coverage excludes `src/index.ts`, `src/adapters/mz/tools/**`, `src/adapters/mz/templates/**`).

---

### Troubleshooting

| Error | Fix |
|---|---|
| `RPGMAKER_PROJECT_PATH is not set` | Set the variable in `.env` |
| `RPG Maker project path does not exist` | Verify the path; use forward slashes on Windows too |
| `RPG Maker data directory not found` | The project root must contain a `data/` folder |
| `Invalid plugin filename` | Plugin names must not contain `<>:"/\|?*` or path separators |
| `mapInfo is missing required fields` | Pass all 7 required fields when providing mapInfo to `game-map` create |
| `Game not connected` (MZ/MV) | Launch the game with RPGMakerDebugger plugin enabled; wait for the map to load |
| `Ruby bridge not available` (VX Ace/VX/XP) | Run `game-setup (setup-debug)` first, reopen the project, press Play, and wait for the map to load |
| Runtime tool times out | The game may be on the title screen — enter a map first; or the bridge script is not running |
| Ruby bridge port conflict | Change `RUBY_BRIDGE_PORT` in `.env` to an unused port (default: 9002) |
| Server hangs | `Ctrl+C`, verify the project path is accessible, restart with `npm run dev` |

---

## Español

### Qué hace

RPG Maker AI Toolkit expone tu proyecto como **12 herramientas macro** que un asistente IA puede llamar. En lugar de describir lo que quieres y copiar archivos a mano, simplemente pides al agente que lo haga — con backups automáticos, validación y un historial de cambios completo.

La arquitectura usa 12 macros de alto nivel expuestas al LLM, respaldadas por ~110 handlers internos. Un escape hatch `batch-edit` está disponible para operaciones multi-paso que necesitan acceso directo a los handlers.

Compatible con **todos los engines principales**: MZ, MV (formato JSON) y VX Ace, VX, XP (formato Ruby Marshal con bridge integrado).

Incluye **bridge de control en tiempo real** para todos los engines: HTTP (puerto 9001) para MZ/MV y socket TCP (puerto 9002) para VX Ace/VX/XP. Instala el bridge una vez y el agente puede leer el estado del juego, activar switches, cambiar variables, teleportar al jugador y desencadenar batallas mientras el juego está corriendo.

### Requisitos

| Requisito | Versión | Notas |
|---|---|---|
| Node.js | 20 + | Obligatorio para todos los engines |
| RPG Maker MZ o MV | cualquiera | Formato JSON — sin dependencias extra |
| RPG Maker VX Ace, VX o XP | cualquiera | Requiere también Ruby (ver abajo) |
| Ruby | 2.7 + | Solo necesario para VX Ace / VX / XP |

> **Nota Ruby:** Para proyectos VX Ace (`.rvdata2`), VX (`.rvdata`) y XP (`.rxdata`) el ejecutable Ruby debe estar en el PATH (o configurar `RUBY_PATH` en `.env`).

### Instalación

```bash
git clone https://github.com/Zagos/RPG-Maker-AI-Toolkit-Multi-Platform.git
cd RPG-Maker-AI-Toolkit-Multi-Platform
npm install
npm run build
```

### Configuración

Copia `.env.example` a `.env`:

```env
# Obligatorio — ruta absoluta a la raíz de tu proyecto RPG Maker
RPGMAKER_PROJECT_PATH=C:\Users\tú\Documentos\MiJuego

# Obligatorio — engine: mz (por defecto) | mv | vxace | vx | xp
RPGMAKER_ENGINE=mz

# Opcional — ruta al ejecutable RPG Maker (para game-setup con action: launch)
RPGMAKER_EXECUTABLE_PATH=C:\Program Files\RPG Maker MZ\RPGMakerMZ.exe

# Opcional — ruta a Ruby (necesario para vxace / vx / xp)
# RUBY_PATH=ruby

# Opcional
MCP_DEBUG=false
LOG_LEVEL=info
BACKUP_MAX_COUNT=10     # cuántos backups conservar por archivo de datos
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

### Compatibilidad de engines

| Engine | Formato | `RPGMAKER_ENGINE` | Bridge en tiempo real |
|---|---|---|---|
| RPG Maker MZ | JSON | `mz` (por defecto) | Sí — HTTP (puerto 9001) |
| RPG Maker MV | JSON | `mv` | Sí — HTTP (puerto 9001) |
| RPG Maker VX Ace | `.rvdata2` (Marshal) | `vxace` | Sí — TCP (puerto 9002) |
| RPG Maker VX | `.rvdata` (Marshal) | `vx` | Sí — TCP (puerto 9002) |
| RPG Maker XP | `.rxdata` (Marshal) | `xp` | Sí — TCP (puerto 9002) |

---

### Herramientas disponibles

El LLM ve **12 herramientas macro** más `batch-edit`. Cada macro acepta `{ action, data }` donde `data` lleva los campos específicos de cada acción. Excepciones: `runtime-control` y `runtime-inspect` usan campos directos en el nivel superior; `manage-backups` también usa campos directos.

Todas las herramientas devuelven JSON. Cada escritura exitosa crea un backup con timestamp y añade una entrada al historial de cambios.

---

#### `runtime-control` — Controlar el juego en ejecución

Modifica el estado en vivo mientras el juego está corriendo. Requiere el bridge de debug configurado previamente (ver **Configuración del bridge** más abajo).

| `action` | Campos clave | Descripción |
|---|---|---|
| `set-switch` | `id`, `value` | Activar o desactivar un switch del juego |
| `set-variable` | `id`, `value` | Asignar un valor a una variable del juego |
| `teleport` | `map_id`, `x`, `y`, `direction?` | Mover al jugador a cualquier mapa y coordenadas |
| `save` | `slot?` | Guardar en un slot (por defecto 98) |
| `load` | `slot?` | Cargar desde un slot (por defecto 98) |
| `modify-inventory` | `operations [{action,type,id?,amount}]` | Añadir o quitar ítems / armas / armaduras / oro |
| `set-party-state` | `actor_id?`, `hp_percent?`, `mp_percent?`, `states?` | Ajustar HP/MP % y estados de un actor o todo el grupo |
| `call-common-event` | `common_event_id` | Disparar un evento común por ID |
| `modify-actor` | `actor_id`, `field`, `value`, `mode?` | Cambiar nivel / exp / HP / MP / TP de un actor |
| `manage-party` | `action (get\|add\|remove)`, `actor_id?` | Leer el grupo o añadir/eliminar un miembro |
| `control-weather` | `type (none\|rain\|storm\|snow)`, `power (0-9)`, `duration?` | Cambiar el efecto de clima |
| `play-audio` | `action (bgm\|bgs\|se\|me\|stop_bgm\|stop_bgs\|stop_se)`, `name?`, `volume?`, `pitch?`, `pan?` | Reproducir o detener audio |
| `control-timer` | `action (start\|stop\|get)`, `frames?` | Controlar el temporizador de cuenta regresiva del juego |
| `show-message` | `text`, `speaker?` | Mostrar un mensaje en la ventana del juego |
| `execute-script` | `code`, `timeout?` | Evaluar JavaScript arbitrario (MZ/MV) o Ruby (VX Ace/VX/XP) en el juego en ejecución |

---

#### `runtime-inspect` — Leer el estado en vivo del juego

Lee el estado actual del juego en ejecución. Requiere el mismo bridge que `runtime-control`.

| `action` / `type` | Campos clave | Devuelve |
|---|---|---|
| `game-state` | — | Mapa, posición del jugador, HP/niveles del grupo, oro |
| `switch` | `id` | Valor ON/OFF actual y nombre |
| `variable` | `id` | Valor numérico actual y nombre |
| `inventory` | `category? (items\|weapons\|armors\|all)` | Inventario del grupo con cantidades |
| `actor` | `actor_id` | Nivel, HP, MP, TP, estados, equipo, habilidades |
| `party` | — | Lista de miembros actuales del grupo |
| `map` | — | Dimensiones del mapa, posición del jugador, clima activo |
| `battle` | — | Estado de batalla: turno, enemigos, grupo (devuelve `in_battle: false` si no hay batalla) |
| `timer` | — | Estado del temporizador: `{ working, seconds }` |

---

#### `query-data` — Leer datos del proyecto

Acceso de solo lectura a todos los archivos de datos del proyecto.

| `action` | Campos clave | Descripción |
|---|---|---|
| `list` | `data_type` | Listar entidades por tipo con IDs y nombres |
| `entity` | `entity_type`, `entity_id` | Leer los datos completos de una entidad |
| `map` | `map_id` | Leer metadatos del mapa, eventos y encuentros |
| `maps` | — | Listar todos los mapas desde MapInfos |
| `resources` | `category?` | Listar archivos de assets en `img/` y `audio/` |
| `system` | `section?` | Leer System.json (sección: `terms\|vehicles\|sounds\|basic\|all`) |
| `animation` | `animation_id?` | Leer una animación o listar todas |
| `tileset` | `tileset_id?`, `include_flags?` | Leer metadatos del tileset |
| `search` | `entity_type`, `query` | Búsqueda de subcadena en nombres (sin distinción de mayúsculas) |
| `summary` | — | Resumen compacto del proyecto: conteos, mapas, totales |

---

#### `game-entity` — Crear, editar, eliminar y duplicar entidades

Gestiona todas las entidades de la base de datos RPG. Usa `action: "create"` para añadir una nueva entrada (sin ID); usa `action: "edit"` con un ID para actualizar una existente.

| `action` | Valores de `type` | Campos clave en `data` |
|---|---|---|
| `create` | actor, item, weapon, armor, skill, class, state, enemy, troop, common-event, animation, tileset | `name` (obligatorio) + campos específicos del tipo |
| `edit` | igual que arriba | `<type>_id` + campos a actualizar |
| `delete` | igual que arriba | `entity_type`, `entity_id`, `confirm: true` |
| `duplicate` | igual que arriba | `entity_type`, `entity_id`, `new_name` |
| `generate` | character | `name`, `archetype (warrior\|mage\|rogue\|healer\|paladin\|ranger)` |
| `traits` | actor, class, enemy, weapon, armor, state | `entity_id`, `mode (replace\|append\|clear)`, `traits [{code,data_id,value}]` |
| `effects` | skill, item | `entity_id`, `mode`, `effects [{code,data_id,value1,value2}]` |
| `class-learnings` | class | `class_id`, `mode (replace\|append\|remove_at_level)`, `learnings [{level,skill_id}]` |
| `enemy-actions` | enemy | `enemy_id`, `mode`, `actions [{skill_id,rating,condition_type,...}]` |
| `drop-items` | enemy | `enemy_id`, `mode`, `drops [{kind,data_id,denominator}]` |
| `character` | (sistema) | `vehicle (boat\|ship\|airship)` + sprite/BGM/posición inicial opcionales |
| `system` | (sistema) | Configuración global: `game_title`, `currency_unit`, `initial_party`, posición de inicio, nombres de switches/variables, audio, flags de opciones |

`generate` construye un actor completo a partir de un arquetipo de alto nivel. Lee las clases, armas y armaduras del proyecto y elige las más adecuadas mediante coincidencia de palabras clave. Devuelve `{ actor_id, class_id, equips, sprite }`.

`delete` crea un backup antes de anular el slot de la entidad. El índice se preserva — equivalente al comportamiento de delete del editor de RPG Maker.

---

#### `game-map` — Todas las operaciones de mapas y tilesets

| `action` | Campos clave en `data` | Descripción |
|---|---|---|
| `create` | `name`, `map_id?`, `width?`, `height?`, `tileset_id?`, `parent_id?` | Crear un nuevo mapa vacío |
| `edit` | `map_id`, `name?`, `tileset_id?`, `encounters?`, campos BGM/BGS/parallax | Editar propiedades del mapa |
| `delete` | `map_id`, `confirm: true` | Eliminar archivo de mapa y anular entrada en MapInfos |
| `copy` | `source_map_id`, `new_name`, `parent_id?` | Duplicar un mapa con tiles y eventos |
| `edit-info` | `map_id`, `name?`, `parent_id?`, `order?`, `expanded?` | Editar solo metadatos de MapInfos (sin I/O de archivo de mapa) |
| `read-tiles` | `map_id`, `x?`, `y?`, `width?`, `height?`, `layers?` | Leer IDs de tile de una región |
| `paint-tiles` | `map_id`, `tiles [{x,y,layer,tile_id}]` | Aplicar cambios de tile individuales de forma atómica |
| `fill` | `map_id`, `x`, `y`, `width`, `height`, `layer`, `tile_id` | Rellenar un rectángulo con un tile |
| `paint-region` | `map_id`, `layer`, `x`, `y`, `width`, `height`, `tile_id` o `tiles` | Modo fill o stamp para una región de tiles |
| `create-event` | `map_id`, `event_name`, `x`, `y`, `event_type`, `pages` | Crear un nuevo evento de mapa |
| `edit-event` | `map_id`, `event_id`, `name?`, `x?`, `y?`, `append_commands?` | Editar un evento existente |
| `delete-event` | `map_id`, `event_id` | Anular el slot del evento |
| `edit-event-page` | `map_id`, `event_id`, `mode (add\|replace\|remove)`, `page_index?`, `page?` | Añadir, reemplazar o eliminar una página de evento |
| `edit-troop-events` | `troop_id`, `mode`, `pages [{conditions,span,commands}]` | Editar páginas de eventos de batalla en una tropa |
| `create-tileset` | `name`, `mode?`, `tilesetNames? [9 entradas]` | Crear una nueva entrada de tileset |
| `edit-tileset` | `tileset_id`, `flag_overrides [{tile_id,passable?,terrain_tag?}]` | Editar pasabilidad y terrain tags |
| `edit-tileset-properties` | `tileset_id`, `name?`, `mode?`, `tilesetNames?` | Editar nombre, modo y referencias gráficas del tileset |

Capas de tile: 0–3 = capas de tile (IDs >= 2048), 4 = sombras (0–15), 5 = ID de región (0–255).

Los comandos de evento usan el formato `{ type, data }`. Consulta EXAMPLES.md para la referencia completa de tipos de comando.

---

#### `dialogue-tools` — Autoría de diálogos e historias

| `action` | Campos clave en `data` | Descripción |
|---|---|---|
| `add` | `dialogue_lines [{speaker?,text}]`, `event_name?` | Añadir diálogo a un evento (forma simple) |
| `create-advanced` | `dialogue_name`, `dialogue_nodes` | Crear un árbol de diálogo ramificado con opciones, condiciones y acciones |
| `generate-story` | `story_title`, `story_description`, `scenes` | Generar una historia multi-escena completa con mapas y eventos |
| `export` | `include_maps?`, `include_common_events?`, `map_ids?` | Exportar todo el texto de diálogo a JSON estructurado |
| `import` | `entries [array]`, `confirm: true` | Escribir diálogo traducido/modificado de vuelta al proyecto |

`export` produce entradas con `source_type`, `source_id`, `event_id`, `page`, `command_index`, `speaker` y `lines[]`. Caso de uso principal: flujos de traducción. `import` empareja por esos mismos campos — el número de líneas debe coincidir con el original.

---

#### `battle-sim` — Simulación de batallas

| `action` | Campos clave en `data` | Descripción |
|---|---|---|
| `encounter` | `troop_id` o `enemy_id` + `count`, `actions?` | Disparar una sola batalla con plan de turnos opcional |
| `suite` | `troop_id` o `enemy_id`, `runs`, `actions?` | Ejecutar la misma batalla N veces; devuelve win rate, HP medio, daño |

---

#### `project-tools` — Mantenimiento del proyecto y operaciones en lote

| `action` | Campos clave en `data` | Descripción |
|---|---|---|
| `validate` | `entity_types?`, `include_warnings?` | Ejecutar todos los validadores; devuelve informe estructurado |
| `cleanup` | `entity_types?` | Auditoría de solo lectura de slots nulos en arrays de entidades |
| `find-replace` | `find`, `replace`, `targets?`, `confirm: true` | Búsqueda y reemplazo masivo en nombres, notas y texto de comandos |
| `batch-update` | `entity_type`, `entity_ids [array]`, `updates {object}`, `confirm: true` | Aplicar los mismos cambios de campo a múltiples entidades |
| `batch-create` | `entity_type`, `entities [array]` (máx 50) | Crear múltiples entidades del mismo tipo de forma atómica |
| `batch-delete` | `entity_type`, `entity_ids [array]` (máx 100), `confirm: true` | Anular múltiples slots de entidad en una llamada |
| `history` | `limit?`, `entity_type?`, `action?`, `since?` | Consultar el historial de cambios |

`validate` devuelve `{ valid, total_checked, total_errors, total_warnings, issues: [{entity_type, id, name, errors[], warnings[]}] }`.

`find-replace` targets: `"names"` `"notes"` `"event_commands"` (por defecto: los tres). Devuelve `{ total_replacements, files_changed[] }`.

---

#### `plugin-manage` — Gestión de plugins (MZ/MV) y scripts (engines Ruby)

**MZ / MV:**

| `action` | Campos clave en `data` | Descripción |
|---|---|---|
| `create` | `plugin_name`, `description`, `author`, `version`, `code_type` | Crear un nuevo plugin desde una plantilla |
| `create-advanced` | `plugin_name`, `template_type` | Crear un plugin con plantilla especializada |
| `manage` | `action (list\|enable\|disable\|delete)`, `plugin_name?` | Listar o activar/desactivar plugins |
| `edit-parameters` | `plugin_name`, `parameters {clave: "valor", …}` | Actualizar valores de parámetros del plugin (todos son strings en MZ) |
| `reorder` | `plugin_name`, `position (first\|last\|before\|after)`, `relative_plugin?` | Cambiar el orden de carga del plugin |

**VX Ace / VX / XP** (los engines Ruby usan scripts, no plugins):

| `action` | Campos clave en `data` | Descripción |
|---|---|---|
| `list-scripts` | — | Devuelve `[{id, name}]` de todos los scripts |
| `read-script` | `id?` o `name?` | Devuelve `{id, name, source}` |
| `create-script` | `name`, `source` | Añadir un nuevo script; devuelve `script_id` |
| `edit-script` | `id`, `name?`, `source?` | Actualizar nombre y/o fuente del script |
| `delete-script` | `id`, `confirm: true` | Eliminar un script por ID |

---

#### `game-setup` — Comprobación de salud y lanzamiento

| `action` | Campos clave en `data` | Descripción |
|---|---|---|
| `health-check` | — | Comprobación de que el servidor está activo: estado, engine, ruta del proyecto |
| `setup-debug` | — | Instalar el plugin/script del bridge de runtime en el proyecto |
| `launch` | — | Lanzar el ejecutable de RPG Maker |

`setup-debug` en MZ/MV escribe `RPGMakerDebugger.js` en `js/plugins/` y lo registra. En VX Ace/VX/XP inyecta `RpgMakerMCPBridge` en `Scripts.rvdata2`. Se puede llamar varias veces — nunca sobreescribe plugins/scripts existentes.

---

#### `manage-backups` — Gestión de backups

Usa campos directos (sin wrapper `data`):

| Campo | Descripción |
|---|---|
| `action (list\|restore\|delete\|prune)` | Operación a realizar |
| `filename?` | Filtrar por archivo fuente |
| `backup_name?` | Apuntar a un archivo de backup específico |
| `max_count?` | Podar hasta esta cantidad de backups por archivo |

Los backups se crean automáticamente antes de cada escritura y se almacenan en `<proyecto>/backups/`. `BACKUP_MAX_COUNT` controla la retención (por defecto 10). Para engines Ruby, los backups son copias binarias de los archivos Marshal.

---

#### `batch-edit` — Escape hatch para operaciones multi-paso

Ejecuta múltiples llamadas a handlers internos en una sola llamada MCP. Las operaciones se ejecutan en orden; los fallos se reportan por operación y no bloquean el resto (salvo con `stop_on_error: true`).

```json
{
  "operations": [
    { "tool": "edit-actor",   "input": { "actor_id": 1, "name": "Aria" } },
    { "tool": "edit-weapon",  "input": { "weapon_id": 3, "attack": 45 } },
    { "tool": "set-switch",   "input": { "id": 10, "value": true } }
  ]
}
```

Máximo 50 operaciones por llamada. Las llamadas anidadas de `batch-edit` son rechazadas.

---

### Configuración del bridge en tiempo real

#### MZ / MV — bridge HTTP (puerto 9001)

1. Llamar `game-setup` con `action: "setup-debug"` — instala `RPGMakerDebugger.js`
2. Activar el plugin en el Plugin Manager de RPG Maker
3. Pulsar Play / F5 — el plugin consulta el servidor MCP cada 500 ms

#### VX Ace / VX / XP — bridge TCP (puerto 9002)

1. Llamar `game-setup` con `action: "setup-debug"` — inyecta `RpgMakerMCPBridge` en `Scripts.rvdata2`
2. Cerrar y reabrir el proyecto en RPG Maker para que cargue el nuevo script
3. Pulsar Play — el script inicia un servidor TCP en el puerto 9002 dentro del juego

Puedes cambiar el puerto del bridge Ruby con `RUBY_BRIDGE_PORT` en `.env` (por defecto: `9002`).

**Flujo típico de runtime:**

```
1. game-setup (setup-debug)              ← instalar una vez por proyecto
2. game-setup (launch)                   ← iniciar el juego
3. runtime-inspect (game-state)          ← verificar conexión y leer estado inicial
4. runtime-inspect (switch/variable)     ← leer valores actuales de flags/contadores
5. runtime-control (set-switch/set-variable) ← configurar flags para el escenario
6. runtime-inspect (inventory)           ← inspeccionar inventario antes del test
7. runtime-control (modify-inventory)    ← añadir ítems/oro de prueba
8. runtime-control (teleport)            ← saltar al área bajo prueba
9. runtime-control (modify-actor)        ← ajustar nivel/HP/TP del actor
10. runtime-control (set-party-state)    ← configurar HP/MP/estados del grupo
11. runtime-control (call-common-event)  ← disparar evento de configuración si es necesario
12. battle-sim (encounter)               ← ejecutar batalla y obtener el log completo
13. battle-sim (suite)                   ← repetir N veces para análisis estadístico
14. runtime-control (save/load)          ← guardar y restaurar estado para reproducción
```

---

### Historial de cambios

Cada escritura exitosa añade una entrada a `<proyecto>/mcp-changes.json`. Consúltalo con `project-tools` y `action: "history"`:

```json
{ "action": "history", "data": { "action": "create", "limit": 20 } }
```

Campos de entrada: `timestamp` · `tool` · `entityType` · `entityId` · `action` · `summary`

---

### Ejemplos

No escribes JSON directamente — solo describe lo que quieres en lenguaje natural y la IA se encarga del resto. Consulta **[EXAMPLES.md](EXAMPLES.md)** para ver prompts en lenguaje natural y el JSON equivalente de cada macro, en inglés y español.

---

### Tests

```bash
npm test               # ejecutar todos los tests
npm run test:coverage  # con informe de cobertura
```

810+ tests en 43 suites.

---

### Solución de problemas

| Error | Solución |
|---|---|
| `RPGMAKER_PROJECT_PATH is not set` | Configura la variable en `.env` |
| `RPG Maker project path does not exist` | Verifica la ruta; en Windows usa barras `/` también |
| `RPG Maker data directory not found` | La raíz del proyecto debe tener una carpeta `data/` |
| `Invalid plugin filename` | Los nombres de plugin no pueden contener `<>:"/\|?*` ni separadores de ruta |
| `Game not connected` (MZ/MV) | Lanza el juego con el plugin RPGMakerDebugger activado; espera a que cargue el mapa |
| `Ruby bridge not available` (VX Ace/VX/XP) | Ejecuta `game-setup (setup-debug)`, reabre el proyecto, pulsa Play y espera a que cargue el mapa |
| Tool de runtime agota el tiempo | El juego puede estar en la pantalla de título — entra al mapa primero; o el script del bridge no está en ejecución |
| Conflicto de puerto Ruby | Cambia `RUBY_BRIDGE_PORT` en `.env` a un puerto libre (por defecto: 9002) |
| Server cuelgado | `Ctrl+C` → verifica que la ruta es accesible → reinicia con `npm run dev` |

---

## Contributing / Contribuir

Pull requests are welcome. See [CLAUDE.md](CLAUDE.md) for architecture notes and conventions.

## License / Licencia

MIT — Created by **Zagos**
