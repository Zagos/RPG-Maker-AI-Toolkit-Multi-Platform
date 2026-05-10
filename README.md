# RPG Maker MCP

**Model Context Protocol server for RPG Maker MZ** — lets any MCP-compatible AI (Claude, GPT, etc.) read and write your game project directly.

> Available in [English](#english) · [Español](#español)

---

## English

### What it does

RPG Maker MCP exposes your RPG Maker MZ project as a set of tools that an AI assistant can call. Instead of describing what you want and then copy-pasting JSON by hand, you just ask the AI and it reads/writes the project files for you — with automatic backups, validation, and a full change log.

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
│   ├── index.ts               # Server entry point, tool registry
│   ├── handlers/              # One file per tool group
│   │   ├── registry.ts        # TOOL_HANDLERS routing map
│   │   ├── actor.ts / item.ts / enemy.ts …
│   │   ├── batch-edit.ts      # Batch dispatcher
│   │   └── types.ts           # HandlerContext interface
│   ├── rpgmaker/
│   │   ├── reader.ts          # JSON read helpers
│   │   ├── writer.ts          # JSON write + backup + prune
│   │   ├── validator.ts       # Input validation
│   │   ├── change-log.ts      # mcp-changes.json audit log
│   │   ├── commands.ts        # Event command builders
│   │   ├── story-manager.ts
│   │   └── dialogue-manager.ts
│   ├── tools/                 # Zod/JSON schema definitions (one per tool)
│   └── types/                 # RPG Maker MZ TypeScript interfaces
├── tests/                     # Vitest test suite (163 tests)
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
| `read-map` | Read map metadata, events list and encounter groups |
| `get-change-history` | Query the audit log of all MCP writes |

**`list-game-data`** — `data_type` enum: `Actors` `Classes` `Skills` `Items` `Weapons` `Armors` `Enemies` `Troops` `States` `Animations` `Tilesets` `Maps` `CommonEvents`

**`read-map`** — input: `map_id (number)`

**`get-change-history`** — filters: `limit` · `entity_type` · `tool` · `action (create|update|delete)` · `since (ISO 8601)`

---

#### Characters & Enemies

| Tool | Key inputs |
|---|---|
| `edit-actor` | `actor_id?` · `name` · `nickname` · `class_id` · `initial_level` · `max_level` · `face_name` · `character_name` |
| `edit-enemy` | `enemy_id?` · `name` · `gold` · `exp` |

---

#### Equipment & Items

| Tool | Key inputs |
|---|---|
| `edit-item` | `item_id?` · `name` · `description` · `price` · `icon_index` |
| `edit-weapon` | `weapon_id?` · `name` · `wtype_id` · `price` · `icon_index` · `animation_id` · stat bonuses |
| `edit-armor` | `armor_id?` · `name` · `atype_id` · `price` · `icon_index` · stat bonuses |

Stat bonus fields (weapons & armors): `max_hp` · `max_mp` · `attack` · `defense` · `magic_attack` · `magic_defense` · `agility` · `luck`

---

#### Skills, Classes & States

| Tool | Key inputs |
|---|---|
| `edit-skill` | `skill_id?` · `name` · `description` · `mp_cost` · `tp_cost` · `scope` · `occasion` · `speed` · `success_rate` · `animation_id` · `damage_type` · `icon_index` · `message1` · `message2` |
| `edit-class` | `class_id?` · `name` · `exp_basis` · `exp_extra` · `exp_acc_a` · `exp_acc_b` |
| `edit-state` | `state_id?` · `name` · `icon_index` · `priority` · `restriction` · `min_turns` · `max_turns` · `remove_at_battle_end` · `remove_by_recover` · `remove_by_damage` · `damage_rate` |

---

#### Maps & Events

| Tool | Key inputs |
|---|---|
| `create-map-event` | `map_id` · `event_name` · `x` · `y` · `event_type (npc\|chest\|enemy\|trigger)` · `character` · `pages` · `dialogue` · `treasure` · `troop_id` |
| `add-dialogue` | `dialogue_lines [{speaker?, text}]` · `event_name?` |
| `create-dialogue-advanced` | `dialogue_name` · `dialogue_nodes` (branching tree with choices, conditions, actions) |
| `story-generator` | `story_title` · `story_description` · `scenes` (full multi-scene story) |

`create-map-event` **event types:**
- `npc` — walking/talking character
- `chest` — treasure chest with item reward
- `enemy` — battle trigger
- `trigger` — generic script trigger

---

#### Plugins

| Tool | Key inputs |
|---|---|
| `create-plugin` | `plugin_name` · `description` · `author` · `version` · `code_type (empty\|simple-hook\|command\|skill-modifier)` |
| `create-plugin-advanced` | `plugin_name` · `template_type (with-parameters\|game-actor\|game-enemy\|event-handler\|custom-ui)` |
| `setup-debug-plugin` | *(no input)* — installs the AI debug bridge plugin |

Plugin filenames are sanitized on write: names with `<>:"/\|?*`, path separators, or Windows reserved names (CON, NUL, COM1…) are rejected.

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
    { "tool": "edit-skill", "input": { "skill_id": 5, "mp_cost": 20 } }
  ]
}
```

---

#### Debug / Battle

| Tool | Description |
|---|---|
| `launch-game` | Launch the RPG Maker MZ executable |
| `start-encounter` | Trigger a battle via the debug bridge (requires `setup-debug-plugin` first) |

---

### Change Log

Every successful write appends an entry to `<project>/mcp-changes.json`. Use `get-change-history` to query it:

```json
{ "tool": "get-change-history", "input": { "action": "create", "limit": 20 } }
```

Entry fields: `timestamp` · `tool` · `entityType` · `entityId` · `action` · `summary`

---

### Running Tests

```bash
npm test                  # run all tests once
npm run test:watch        # watch mode
npm run test:coverage     # with v8 coverage report
```

163 tests across 8 suites (writer, commands, validator, story-manager, dialogue-manager, phase3, phase4, phase5).

---

### Troubleshooting

| Error | Fix |
|---|---|
| `RPGMAKER_PROJECT_PATH is not set` | Set the variable in `.env` |
| `RPG Maker project path does not exist` | Verify the path; use forward slashes on Windows too |
| `RPG Maker data directory not found` | The project root must contain a `data/` folder |
| `Invalid plugin filename` | Plugin names must not contain `<>:"/\|?*` or path separators |
| `mapInfo is missing required fields` | Pass all 7 fields when providing mapInfo to `create-map-event` |
| Server hangs | `Ctrl+C`, verify the project path is accessible, restart with `npm run dev` |

---

## Español

### Qué hace

RPG Maker MCP expone tu proyecto de RPG Maker MZ como un conjunto de herramientas que un asistente IA puede llamar. En lugar de describir lo que quieres y copiar JSON a mano, simplemente pides al agente que lo haga — con backups automáticos, validación y un historial de cambios completo.

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
| `read-map` | Lee metadatos del mapa, lista de eventos y encuentros |
| `get-change-history` | Consulta el historial de escrituras MCP |

#### Personajes y enemigos

| Herramienta | Campos clave |
|---|---|
| `edit-actor` | `actor_id?` · `name` · `nickname` · `class_id` · `initial_level` · `max_level` |
| `edit-enemy` | `enemy_id?` · `name` · `gold` · `exp` |

#### Equipamiento e ítems

| Herramienta | Campos clave |
|---|---|
| `edit-item` | `item_id?` · `name` · `description` · `price` · `icon_index` |
| `edit-weapon` | `weapon_id?` · `name` · `wtype_id` · bonificaciones de estadísticas |
| `edit-armor` | `armor_id?` · `name` · `atype_id` · bonificaciones de estadísticas |

Bonificaciones de estadísticas: `max_hp` · `max_mp` · `attack` · `defense` · `magic_attack` · `magic_defense` · `agility` · `luck`

#### Habilidades, clases y estados

| Herramienta | Campos clave |
|---|---|
| `edit-skill` | `skill_id?` · `name` · `mp_cost` · `tp_cost` · `scope` · `damage_type` |
| `edit-class` | `class_id?` · `name` · parámetros de experiencia |
| `edit-state` | `state_id?` · `name` · `restriction` · `priority` · duraciones |

#### Mapas y eventos

| Herramienta | Campos clave |
|---|---|
| `create-map-event` | `map_id` · `event_name` · `x` · `y` · `event_type` · `pages` |
| `add-dialogue` | `dialogue_lines` · `event_name?` |
| `create-dialogue-advanced` | `dialogue_name` · `dialogue_nodes` (árbol con opciones y condiciones) |
| `story-generator` | `story_title` · `scenes` (historia multi-escena completa) |

#### Plugins

| Herramienta | Descripción |
|---|---|
| `create-plugin` | Plugin básico con plantillas de código |
| `create-plugin-advanced` | Plugin avanzado con plantillas especializadas |
| `setup-debug-plugin` | Instala el plugin de debug para control de batallas |

#### Backups

`manage-backups` — acciones: `list` · `restore` · `delete` · `prune`

Los backups se crean automáticamente antes de cada escritura. `BACKUP_MAX_COUNT` controla cuántos se conservan (por defecto 10).

#### Operaciones en lote

`batch-edit` — ejecuta hasta 50 operaciones en una sola llamada MCP. Devuelve resultados individuales. Usa `stop_on_error: true` para detener en el primer error.

```json
{
  "operations": [
    { "tool": "edit-actor", "input": { "actor_id": 1, "name": "Aria" } },
    { "tool": "edit-weapon", "input": { "weapon_id": 3, "attack": 45 } }
  ]
}
```

### Tests

```bash
npm test               # ejecutar todos los tests
npm run test:coverage  # con informe de cobertura
```

163 tests en 8 suites.

### Solución de problemas

| Error | Solución |
|---|---|
| `RPGMAKER_PROJECT_PATH is not set` | Configura la variable en `.env` |
| `RPG Maker project path does not exist` | Verifica la ruta; en Windows usa barras `/` también |
| `RPG Maker data directory not found` | La raíz del proyecto debe tener una carpeta `data/` |
| `Invalid plugin filename` | Los nombres de plugin no pueden contener `<>:"/\|?*` ni separadores de ruta |
| Server cuelgado | `Ctrl+C` → verifica que la ruta es accesible → reinicia con `npm run dev` |

---

## Contributing / Contribuir

Pull requests are welcome. See [AGENTS.md](AGENTS.md) for architecture notes and conventions.

## License / Licencia

MIT — Created by **Zagos**
