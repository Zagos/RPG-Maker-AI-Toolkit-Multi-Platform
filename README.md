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
├── tests/                     # Vitest test suite (357 tests, 20 suites)
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
| `list-resources` | List asset files in `img/` and `audio/` directories by category |
| `delete-entity` | Null out an entity in its database array (soft-delete with backup) |
| `get-change-history` | Query the audit log of all MCP writes |
| `edit-system` | Edit global game settings: title, currency, party, start position, switch/variable names, audio, UI terms |
| `read-system-extended` | Read extended System.json sections not exposed by `edit-system`: terms, vehicles, sounds, window settings |

**`list-game-data`** — `data_type` enum: `Actors` `Classes` `Skills` `Items` `Weapons` `Armors` `Enemies` `Troops` `States` `Animations` `Tilesets` `Maps` `CommonEvents`

**`read-map`** — input: `map_id (number)`

**`read-entity`** — `entity_type`: `Actor` `Item` `Enemy` `Weapon` `Armor` `Skill` `Class` `State` `Troop` `CommonEvent` · `entity_id (integer)`

**`list-resources`** — `category`: `characters` · `faces` · `battlers` · `sv_actors` · `tilesets` · `parallaxes` · `pictures` · `bgm` · `bgs` · `se` · `me` · `all`. Returns filenames without extension. Call this before assigning sprite/audio names in other tools to avoid silent failures from missing assets.

**`delete-entity`** — `entity_type (Actor|Item|Enemy|Weapon|Armor|Skill|Class|State|Troop|CommonEvent)` · `entity_id` · `confirm: true` (required guard). Creates a backup before nulling. The index slot is preserved — existing references remain pointing to a null entry, equivalent to the RPG Maker editor's delete behavior.

**`get-change-history`** — filters: `limit` · `entity_type` · `tool` · `action (create|update|delete)` · `since (ISO 8601)`

**`edit-system`** — all fields optional: `game_title` · `currency_unit` · `initial_party [actor_ids]` · `start_map_id` · `start_x` · `start_y` · `switch_names {"1":"Name"}` · `variable_names {"1":"Name"}` · `title_bgm` · `battle_bgm` · `victory_me` · `defeat_me` · `terms_basic {"0":"Level"}` · `terms_params {"0":"Max HP"}` · `terms_commands {"0":"Fight"}` · `terms_messages {"actorDamage":"..."}` (UI labels and battle message strings) · `opt_autosave` (boolean — enable auto-save) · `opt_display_tp` (boolean — show TP in battle) · `opt_slip_death` (boolean — allow death from slip damage) · `opt_floor_death` (boolean — allow death from floor damage) · `opt_follower_distance` (boolean — follower distance setting) · `opt_transparent` (boolean — start with transparent main actor)

**`read-system-extended`** — `section` enum: `terms` `vehicles` `sounds` `basic` `all` (default: `all`). Read-only; no writes.

---

#### Characters & Enemies

| Tool | Key inputs |
|---|---|
| `generate-character` | `name` · `archetype` · `nickname?` · `initial_level?` · `max_level?` · `character_name?` · `character_index?` · `face_name?` · `face_index?` · `profile?` · `note?` |
| `edit-actor` | `actor_id?` · `name` · `nickname` · `class_id` · `initial_level` · `max_level` · `face.name` · `face.index` · `character.name` · `character.index` · `battler_name` · `equips [weapon,shield,head,body,acc]` · `profile` · `note` |
| `edit-enemy` | `enemy_id?` · `name` · `gold` · `exp` · `battler_name` · `battler_hue (0-360)` · `max_hp` · `max_mp` · `attack` · `defense` · `magic_attack` · `magic_defense` · `agility` · `luck` · `drops [{kind,data_id,denominator}]` · `note` |
| `edit-enemy-actions` | `enemy_id` · `mode (replace\|append\|clear)` · `actions [{skill_id, rating, condition_type, condition_param1, condition_param2}]` |
| `edit-drop-items` | `enemy_id` · `mode (replace\|append\|clear)` · `drops [{kind,data_id,denominator}]` |

**`generate-character`** — Generates a complete actor from a high-level concept. Reads the project's classes, weapons, and armors and picks the best fit for the chosen archetype via keyword matching. Sprite and face sheet are auto-selected. Archetypes: `warrior` · `mage` · `rogue` · `healer` · `paladin` · `ranger`. Returns `{ actor_id, class_id, equips, sprite }`.

**Archetype behavior:**

| Archetype | Preferred class keywords | Weapon preference | Armor preference | Default sprite |
|---|---|---|---|---|
| `warrior` | warrior, fighter, knight | sword, axe, blade | heavy, plate, mail | Actor1 idx 0 |
| `mage` | mage, wizard, sorcerer | staff, rod, wand | robe, cloth, mystic | Actor2 idx 0 |
| `rogue` | rogue, thief, assassin | dagger, knife, claw | leather, light | Actor3 idx 0 |
| `healer` | healer, cleric, priest | staff, mace, holy | robe, sacred | Actor2 idx 2 |
| `paladin` | paladin, holy knight | sword, lance, blessed | heavy, holy, divine | Actor1 idx 2 |
| `ranger` | ranger, archer, hunter | bow, crossbow, gun | leather, light | Actor3 idx 2 |

**`edit-actor`** — `equips` is an array of 5 IDs in order: `[weapon_id, shield_id, head_id, body_id, accessory_id]`. Use `0` for empty slot. `face` and `character` are nested objects with `name` (spritesheet filename) and `index` (0–7 or 0–3).

**`edit-enemy`** stat fields map to RPG Maker's `params[8]` array. Omit any field to keep the existing value.

**`edit-enemy-actions`** — Edits the AI action table of an enemy. Each action specifies which skill to use (`skill_id`), how often (`rating` 1–9), and under what condition (`condition_type`: 0=always, 1=turn X/Y, 2=HP≤%, 3=MP≤%, 4=state applied, 5=party level≥, 6=switch ON). `condition_param1`/`condition_param2` carry the threshold values.

**`edit-drop-items`** — Dedicated drop table editor. `kind`: 0=none, 1=item, 2=weapon, 3=armor. `denominator`: 1-in-N drop rate (e.g. `4` = 25% chance). Up to 3 slots; `append` fills from the first empty slot; `clear` resets all slots.

---

#### Traits & Effects

| Tool | Key inputs |
|---|---|
| `edit-traits` | `entity_type (Actor\|Class\|Enemy\|Weapon\|Armor\|State)` · `entity_id` · `mode (replace\|append\|clear)` · `traits [{code, data_id, value}]` |
| `edit-effects` | `entity_type (Skill\|Item)` · `entity_id` · `mode (replace\|append\|clear)` · `effects [{code, data_id, value1, value2}]` |

**`edit-traits`** — Structured editing of passive traits on any entity that carries them. `mode=replace` overwrites the full array; `mode=append` merges by `code`+`data_id` (upsert); `mode=clear` empties it.

Common trait codes:

| Code | Effect | Code | Effect |
|---|---|---|---|
| 11 | Element rate | 41 | Add skill type |
| 12 | Debuff rate | 42 | Seal skill type |
| 13 | State rate | 43 | Add skill |
| 14 | State resist | 44 | Seal skill |
| 21 | Parameter rate | 51 | Equip weapon type |
| 22 | Ex-parameter (hit/evasion/crit) | 52 | Equip armor type |
| 23 | Sp-parameter (target rate/guard) | 54 | Fix equip slot |
| 31 | Attack element | 55 | Seal equip slot |
| 32 | Attack state | 61 | Action plus |
| 33 | Attack speed | 62 | Special flag |
| | | 63 | Collapse type |
| | | 64 | Party ability |

**`edit-effects`** — Structured editing of use-effects on Skills and Items. `mode=append` adds to existing effects without deduplication.

Common effect codes:

| Code | Effect | Code | Effect |
|---|---|---|---|
| 11 | Recover HP (value1=rate, value2=flat) | 31 | Add buff (param, turns) |
| 12 | Recover MP | 32 | Add debuff |
| 13 | Gain TP | 33 | Remove buff |
| 21 | Add state (data_id=stateId, value1=chance) | 34 | Remove debuff |
| 22 | Remove state | 41 | Learn skill (data_id=skillId) |
| | | 42 | Call common event (data_id=eventId) |
| | | 44 | Gain exp |

---

#### Equipment & Items

| Tool | Key inputs |
|---|---|
| `edit-item` | `item_id?` · `name` · `description` · `price` · `icon_index` · `itype_id (1=item,2=key)` · `consumable` · `scope (0-11)` · `occasion (0-3)` · `speed` · `success_rate` · `repeats` · `tp_gain` · `hit_type (0-2)` · `animation_id` · `note` |
| `edit-weapon` | `weapon_id?` · `name` · `wtype_id` · `price` · `icon_index` · `animation_id` · stat bonuses |
| `edit-armor` | `armor_id?` · `name` · `atype_id` · `etype_id` · `price` · `icon_index` · stat bonuses |

Stat bonus fields (weapons & armors): `max_hp` · `max_mp` · `attack` · `defense` · `magic_attack` · `magic_defense` · `agility` · `luck`

**`edit-armor`** — `etype_id` controls the equipment slot: 1=weapon, 2=shield, 3=head, 4=body, 5=accessory (default 1).

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

| Tool | Key inputs |
|---|---|
| `edit-troop-events` | `troop_id` · `mode (replace_all\|append\|clear)` · `pages [{conditions, span, commands}]` |

**`edit-troop-events`** — Add, replace, or clear battle event pages in a troop. Each page has trigger conditions and a command list using the same `{type, data}` format as `create-map-event`.

Page conditions: `turnValid`+`turnA`+`turnB` (fire on turn A, A+B, A+2B…) · `enemyValid`+`enemyIndex`+`enemyHp` (enemy HP%) · `actorValid`+`actorId`+`actorHp` · `switchValid`+`switchId`. `span`: 0=once per battle, 1=once per turn, 2=each moment.

Battle-only command types (usable inside troop event pages):

| Command type | Code | Key parameters |
|---|---|---|
| `change-enemy-hp` | 331 | `enemy_index` · `operation (0=add/1=sub/2=mul/3=div/4=mod)` · `operand` · `allow_ko (boolean)` |
| `change-enemy-mp` | 332 | `enemy_index` · `operation` · `operand` |
| `change-enemy-state` | 333 | `enemy_index` · `action (0=add/1=remove)` · `state_id` |
| `recover-all-enemies` | 334 | `enemy_index` (-1 = all) |
| `enemy-appear` | 335 | `enemy_index` |
| `enemy-transform` | 336 | `enemy_index` · `enemy_id` |
| `show-battle-animation` | 337 | `animation_id` · `enemy_index` (-1 = all) |
| `force-action` | 338 | `subject_type (0=enemy/1=actor)` · `subject_index` · `skill_id` · `target_index` |

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
| `edit-map` | `map_id` · `name?` · `tileset_id?` · `scroll_type?` · `encounter_step?` · `autoplay_bgm?` · `bgm_name?` · `bgm_volume?` · `bgm_pitch?` · `autoplay_bgs?` · `bgs_name?` · `bgs_volume?` · `bgs_pitch?` · `parallax_name?` · `parallax_show?` · `parallax_loop_x?` · `parallax_loop_y?` · `parallax_sx?` · `parallax_sy?` · `disable_dashing?` · `specify_battleback?` · `battleback1?` · `battleback2?` · `encounters [{enemy_id,weight?}]?` |
| `delete-map` | `map_id` · `confirm: true` (required) |
| `create-map-event` | `map_id` · `event_name` · `x` · `y` · `event_type (npc\|chest\|enemy\|trigger)` · `character` · `pages` · `dialogue` · `treasure` · `troop_id` |
| `edit-map-event` | `map_id` · `event_id` · `name?` · `x?` · `y?` · `note?` · `append_commands?` |
| `delete-map-event` | `map_id` · `event_id` |
| `add-dialogue` | `dialogue_lines [{speaker?, text}]` · `event_name?` |
| `create-dialogue-advanced` | `dialogue_name` · `dialogue_nodes` (branching tree with choices, conditions, actions) |
| `story-generator` | `story_title` · `story_description` · `scenes` (full multi-scene story) |

**`create-map`** — Creates a new empty map and registers it in `MapInfos.json`. If `map_id` is omitted, the next available ID is auto-assigned. The tile data array is initialised to all-zeros (6 layers × width × height). Returns `{ success, map_id, name, width, height, tileset_id, parent_id, filename }`.

**`delete-map`** — Deletes `MapXXX.json` (after backup) and nulls the entry in `MapInfos.json`. Requires `confirm: true` to prevent accidental deletion.

**`edit-map-event`** — Rename, move, or append commands to an existing event. `append_commands` inserts before the terminator on page 0. Command format: `{ type, data }` — types: `message` · `choice` · `wait` · `transfer` · `script` · `switch` · `variable` · `common-event` · `battle` · `animation` · `show-picture` · `tint-picture` · `move-picture` · `rotate-picture` · `erase-picture` (and many more — see EXAMPLES.md for the full command types reference).

| `edit-event-page` | `map_id` · `event_id` · `mode (add\|replace\|remove)` · `page_index?` · `page?` |

**`edit-event-page`** — Add a new page to an existing map event, replace a specific page by index, or remove a page (minimum 1 page enforced). Used to build multi-state NPCs without recreating the entire event. Page fields: `trigger` (0–4) · `priority_type` (0–2) · `move_type` (0–3) · `move_speed` · `move_frequency` · `direction_fix` · `walk_anime` · `step_anime` · `through` · `character_name` · `character_index` · `conditions` (switches/variables/self-switch/actor/item) · `commands [{type, data}]`.

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

#### Map Tile Painting

| Tool | Key inputs |
|---|---|
| `read-map-tiles` | `map_id` · `x?` · `y?` · `width?` · `height?` · `layers? [0-5]` |
| `paint-map-tiles` | `map_id` · `tiles [{x, y, layer, tile_id}]` |
| `fill-map-region` | `map_id` · `x` · `y` · `width` · `height` · `layer` · `tile_id` |
| `paint-map-region` | `map_id` · `layer` · `x` · `y` · `width` · `height` · `tile_id` or `tiles [flat array]` |

Tile index formula: `x + y × mapWidth + layer × mapWidth × mapHeight`. Layers: 0–3 = tile layers (0 = empty, valid IDs ≥ 2048), 4 = shadow flags (0–15), 5 = region ID (0–255).

**`read-map-tiles`** — Returns tile IDs for every cell in the requested region. Optionally filter by layer. Useful for understanding the current tile layout before painting.

**`paint-map-tiles`** — Applies an array of individual tile changes atomically (one file write). Invalid entries are skipped and returned as warnings. Layer max IDs: layers 0–3 → 0–8191, layer 4 → 0–15, layer 5 → 0–255.

**`fill-map-region`** — Fills a rectangle with a single tile ID across any layer. `tile_id=0` clears the region. Clamped to map bounds.

**`paint-map-region`** — Single-layer region paint with two modes: **fill** (`tile_id` — fills the entire rectangle with one tile) or **stamp** (`tiles` — flat row-major array of exactly `width×height` IDs). Stamp mode is the efficient path for placing pre-designed tile patterns like room templates or dungeon prefabs.

---

#### Tilesets

| Tool | Key inputs |
|---|---|
| `read-tileset` | `tileset_id?` · `include_flags?` |
| `create-tileset` | `name` · `mode?` · `tilesetNames? [9 entries]` |
| `edit-tileset-properties` | `tileset_id` · `name?` · `mode?` · `tilesetNames? [9 entries]` |
| `edit-tileset` | `tileset_id` · `flag_overrides [{tile_id, passable?, terrain_tag?}]` |

**`read-tileset`** — Reads tileset metadata: name, mode, graphic file references (`tilesetNames` array of 9 slots: A1 A2 A3 A4 A5 B C D E), and a passability flag summary. Pass `include_flags: true` to get the full 8192-entry flags array. Omit `tileset_id` to list all tilesets.

**`create-tileset`** — Creates a new tileset entry in `Tilesets.json`. All 8192 tile flags default to passable (0). `tilesetNames` is an array of 9 graphic file names (without extension) from `img/tilesets/`; omit for a blank tileset.

**`edit-tileset-properties`** — Edits a tileset's display name, mode (`0`=World / `1`=Area), or the 9-slot `tilesetNames` graphic references. To edit passability and terrain tags use `edit-tileset`.

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

| Tool | Key inputs |
|---|---|
| `edit-plugin-parameters` | `plugin_name` · `parameters {key: "value", …}` |
| `reorder-plugin` | `plugin_name` · `position (first\|last\|before\|after)` · `relative_plugin?` |

**`edit-plugin-parameters`** — Update individual parameter values of a registered plugin. RPG Maker MZ stores all plugin parameter values as strings. Partial updates are supported — only the keys you provide are changed; all other parameters are preserved.

**`reorder-plugin`** — Change the load order of a plugin in `js/plugins.js`. `position: "before"` and `"after"` require `relative_plugin` to specify the reference plugin. Plugin load order is critical in RPG Maker MZ — compatibility layers must load before the plugins they extend.

---

#### Animations

| Tool | Key inputs |
|---|---|
| `read-animation` | `animation_id?` |
| `edit-animation` | `animation_id` · `name?` · `effect_name?` · `display_type?` · `offset_x?` · `offset_y?` · `speed?` |

**`read-animation`** — Returns the full animation object (name, effectName, displayType, flashTimings, soundTimings, offsetX/Y, speed) when `animation_id` is given. Omit to list all animations with id and name.

**`edit-animation`** — Edits animation metadata. `effect_name` references an Effekseer `.efkefc` file from the `effects/` folder (without extension). `display_type`: 0=target head, 1=target center, 2=full screen, -1=front of screen. Full frame/timing editing is out of scope.

---

#### Entity Creation

All `edit-X` tools create a new entity when the `*_id` field is omitted. The dedicated create tools below offer stricter schemas with required `name`, explicit defaults, and return the new ID immediately.

| Tool | Description |
|---|---|
| `create-actor` | Create a new actor with class, levels, sprite, equips, and profile |
| `create-item` | Create a new item (consumable or key item) |
| `create-weapon` | Create a new weapon with weapon type and stat bonuses |
| `create-armor` | Create a new armor with armor/equipment type and stat bonuses |
| `create-skill` | Create a new skill with costs, scope, damage, and animation |
| `create-class` | Create a new class with exp curve and initial learnings |
| `create-state` | Create a new state with restriction, duration, and removal conditions |
| `create-enemy` | Create a new enemy with stats, drops, and battle actions |
| `create-animation` | Create a new animation entry (metadata only; frame data authored separately) |

All create tools return `{ success, <type>_id, name }`.

---

#### Utility Tools

| Tool | Key inputs |
|---|---|
| `search-entity` | `entity_type` · `query (substring search on name)` |
| `duplicate-entity` | `entity_type` · `entity_id` · `new_name` |
| `export-project-summary` | *(no required input)* |
| `edit-map-info` | `map_id` · `name?` · `parent_id?` · `order?` · `expanded?` |
| `validate-project` | `entity_types?` · `include_warnings?` |
| `find-and-replace` | `find` · `replace` · `targets?` · `confirm: true` |
| `copy-map` | `source_map_id` · `new_name` · `parent_id?` |
| `cleanup-project` | `entity_types?` |
| `batch-update-entities` | `entity_type` · `entity_ids [array]` · `updates {object}` · `confirm: true` |
| `export-dialogue` | `include_maps?` · `include_common_events?` · `map_ids?` |
| `import-dialogue` | `entries [array]` · `confirm: true` |

**`search-entity`** — Case-insensitive substring search across any entity type (Actor, Item, Weapon, Armor, Skill, Class, State, Enemy, Troop, CommonEvent, Animation, Tileset). Returns `{ matches: [{id, name}] }`.

**`duplicate-entity`** — Clone an entity with a new name and next available ID. The duplicate gets all fields copied from the source (except id). Returns `{ success, new_id, name }`.

**`export-project-summary`** — Returns a compact overview of the whole project: actor/enemy/skill counts, map names, switch and variable totals. Useful for getting oriented in an unfamiliar project.

**`edit-map-info`** — Edit only the MapInfos.json metadata entry (name, parent, order, scroll) without touching the map tile/event file.

**`validate-project`** — Run all entity validators across the entire project and return a structured report. Returns `{ valid, total_checked, total_errors, total_warnings, issues: [{entity_type, id, name, errors[], warnings[]}] }`. Filter with `entity_types` to limit scope.

**`find-and-replace`** — Bulk search and replace text across entity names, notes, and event command text in all data files and map files. `targets`: `"names"` `"notes"` `"event_commands"` (default: all three). Requires `confirm: true`. Returns `{ total_replacements, files_changed[] }`.

**`copy-map`** — Duplicate an existing map (tiles + events) with a new name and the next available ID. Automatically adds the new entry to `MapInfos.json`. Returns `{ new_map_id, name, copied_from }`.

**`cleanup-project`** — Read-only audit of null slots in entity JSON arrays. Reports `{ null_slots, active_entities, total_slots }` per entity type. Does NOT rewrite files or reassign IDs.

**`batch-update-entities`** — Apply the same field updates to multiple entities of the same type in one call. Useful for bulk balancing: set HP on 10 enemies, rename a group of items, etc. Supported types include all entity types: `Actor` `Item` `Weapon` `Armor` `Skill` `Class` `State` `Enemy` `Troop` `CommonEvent` `Animation` `Tileset`. Returns `{ results: [{id, success}] }`. Requires `confirm: true`.

**`export-dialogue`** — Extract all dialogue text from map events and common events into a structured JSON. Each entry contains `source_type`, `source_id`, `event_id`, `page`, `command_index`, `speaker`, and `lines[]`. Primary use case: prepare text for translation.

**`import-dialogue`** — Write translated/modified dialogue back into the project. Matches entries by `source_id`, `event_id`, `page`, and `command_index` from `export-dialogue`. Line count per entry must match the original. Requires `confirm: true`.

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
| `get-actor-runtime` | Read a single actor's live state: level, HP, MP, TP, states, equipment, skills |
| `manage-party-runtime` | `action (get\|add\|remove)` · `actor_id?` — read party list or add/remove member |
| `control-weather-runtime` | `type (none\|rain\|storm\|snow)` · `power (0-9)` · `duration?` |
| `play-audio-runtime` | `action (bgm\|bgs\|se\|me\|stop_bgm\|stop_bgs\|stop_se)` · `name?` · `volume?` · `pitch?` · `pan?` |
| `get-map-state-runtime` | Read current map dimensions, player position, and active weather |
| `control-timer-runtime` | `action (start\|stop\|get)` · `frames?` (required for start) |
| `get-battle-state-runtime` | *(no required input — must be in battle)* |

**`get-switch`** / **`get-variable`** — Return `{ id, value, name? }`. Name is read from `System.json` if defined.

**`get-inventory`** — Returns `{ items: [{id,name,count}], weapons: [...], armors: [...], gold: number }`. Only the requested `category` is populated.

**`modify-inventory`** — `type`: `item` `weapon` `armor` `gold`. For gold, omit `id`. Multiple operations are batched into a single script call.

**`call-common-event`** — Validates the event exists in `CommonEvents.json` before executing. Logs to change log.

**`modify-actor-runtime`** — `field`: `level` `exp` `hp` `mp` `tp`. `mode`: `set` (assign directly) or `add` (delta). Multiple operations per call.

**`control-timer-runtime`** — Start, stop, or query the in-game countdown timer. `action: "get"` returns `{ working, seconds }`. `action: "start"` requires `frames` (60 frames = 1 second). Uses `waitForAck` for write actions, `waitForGameState` for get.

**`get-battle-state-runtime`** — Read current battle state while in a battle: `{ in_battle, turn, enemies: [{id,name,hp,mhp,mp,alive,states}], party: [{id,name,hp,mhp,mp,alive}] }`. Returns `in_battle: false` when not in battle.

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
| `batch-create-entities` | `entity_type (Actor\|Item\|Weapon\|Armor\|Skill\|Class\|State\|Enemy\|Troop\|CommonEvent\|Animation\|Tileset)` · `entities [array of entity objects]` (max 50) |
| `batch-delete-entities` | `entity_type` · `entity_ids [array of integers]` (max 100) · `confirm: true` |

**`batch-edit`** — Executes multiple tool calls in a single MCP round-trip. Each operation runs in order; failures are reported per-operation and do not block the rest (unless `stop_on_error: true`).

**`batch-create-entities`** — Create multiple entities of the same type atomically. Each object in `entities` needs at least `name`. Supported types: `Actor` `Item` `Weapon` `Armor` `Skill` `Class` `State` `Enemy` `Troop` `CommonEvent` `Animation` `Tileset`. Returns `{ results: [{index, success, id}] }`.

**`batch-delete-entities`** — Null out multiple entities in one operation. Supports all entity types including Animation, Troop, CommonEvent, and Tileset. Requires `confirm: true`. Returns per-ID success/error.

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

### Examples

You never write JSON directly — just describe what you want in plain language and the AI handles the rest. See **[EXAMPLES.md](EXAMPLES.md)** for natural-language prompts and the equivalent JSON for every tool, in English and Spanish.

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

357 tests across 20 suites (coverage excludes `src/index.ts`, `src/tools/**`, `src/templates/**`).

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
| `read-entity` | Lee una entidad por tipo e ID |
| `list-resources` | Lista archivos de assets en `img/` y `audio/` por categoría |
| `delete-entity` | Anula una entidad en su array de base de datos (soft-delete con backup) |
| `get-change-history` | Consulta el historial de escrituras MCP |
| `edit-system` | Edita la configuración global: título, moneda, grupo inicial, posición de inicio, nombres de switches/variables, audio |
| `read-system-extended` | Lee secciones extendidas de System.json: términos, vehículos, sonidos, configuración de ventana |

**`list-resources`** — `category`: `characters` · `faces` · `battlers` · `sv_actors` · `tilesets` · `parallaxes` · `pictures` · `bgm` · `bgs` · `se` · `me` · `all`. Devuelve nombres de archivo sin extensión. Úsalo antes de asignar sprites/audio para evitar fallos silenciosos.

**`delete-entity`** — `entity_type` · `entity_id` · `confirm: true` (obligatorio). Crea backup antes de anular. El índice se preserva — las referencias existentes quedan apuntando a null.

**`edit-system`** — todos opcionales: `game_title` · `currency_unit` · `initial_party` · `start_map_id/x/y` · `switch_names {"id":"nombre"}` · `variable_names` · `title_bgm/battle_bgm/victory_me/defeat_me` · `opt_autosave` · `opt_display_tp` · `opt_slip_death` · `opt_floor_death` · `opt_follower_distance` · `opt_transparent`

**`read-system-extended`** — `section`: `terms` `vehicles` `sounds` `basic` `all`. Solo lectura.

#### Personajes y enemigos

| Herramienta | Campos clave |
|---|---|
| `generate-character` | `name` · `archetype` · `nickname?` · `initial_level?` · `max_level?` · `character_name?` · `character_index?` · `face_name?` · `face_index?` · `profile?` · `note?` |
| `edit-actor` | `actor_id?` · `name` · `nickname` · `class_id` · `initial_level` · `max_level` · `face.name` · `face.index` · `character.name` · `character.index` · `battler_name` · `equips [arma,escudo,cabeza,cuerpo,accesorio]` · `profile` · `note` |
| `edit-enemy` | `enemy_id?` · `name` · `gold` · `exp` · `battler_name` · `battler_hue (0-360)` · `max_hp` · `max_mp` · `attack` · `defense` · `magic_attack` · `magic_defense` · `agility` · `luck` · `drops [{kind,data_id,denominator}]` · `note` |
| `edit-drop-items` | `enemy_id` · `mode (replace\|append\|clear)` · `drops [{kind,data_id,denominator}]` |

**`edit-actor`** — `equips` es un array de 5 IDs: `[arma_id, escudo_id, cabeza_id, cuerpo_id, accesorio_id]`. Usa `0` para slot vacío.

**`edit-drop-items`** — `kind`: 0=ninguno, 1=ítem, 2=arma, 3=armadura. `denominator`: probabilidad 1-en-N (ej. `4` = 25%). Máximo 3 slots.

**`generate-character`** — Genera un actor completo a partir de un concepto de alto nivel. Lee las clases, armas y armaduras del proyecto y elige las más adecuadas para el arquetipo indicado mediante coincidencia de palabras clave. El sprite y la cara se seleccionan automáticamente. Arquetipos: `warrior` · `mage` · `rogue` · `healer` · `paladin` · `ranger`. Devuelve `{ actor_id, class_id, equips, sprite }`.

| `edit-enemy-actions` | `enemy_id` · `mode (replace\|append\|clear)` · `actions [{skill_id, rating, condition_type, condition_param1, condition_param2}]` |

**`edit-enemy-actions`** — Edita la tabla de acciones (IA) de un enemigo. `rating` (1–9) = frecuencia relativa. `condition_type`: 0=siempre, 1=turno X/Y, 2=HP≤%, 3=MP≤%, 4=estado aplicado, 5=nivel grupo≥, 6=switch ON.

---

#### Traits y efectos

| Herramienta | Campos clave |
|---|---|
| `edit-traits` | `entity_type (Actor\|Class\|Enemy\|Weapon\|Armor\|State)` · `entity_id` · `mode (replace\|append\|clear)` · `traits [{code, data_id, value}]` |
| `edit-effects` | `entity_type (Skill\|Item)` · `entity_id` · `mode (replace\|append\|clear)` · `effects [{code, data_id, value1, value2}]` |

**`edit-traits`** — Edita el array de traits de cualquier entidad que los tenga. `mode=append` hace merge por `code`+`data_id` (upsert). Códigos frecuentes: 11=tasa elemento, 13=tasa estado, 14=resistencia estado, 21=tasa parámetro, 31=elemento de ataque, 41=añadir tipo habilidad, 43=añadir habilidad, 51=equipar tipo arma.

**`edit-effects`** — Edita los efectos de uso de habilidades e ítems. Códigos: 11=recuperar HP, 12=recuperar MP, 13=ganar TP, 21=añadir estado, 22=quitar estado, 31-34=buff/debuff, 41=aprender habilidad, 42=llamar evento común.

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

| `edit-troop-events` | `troop_id` · `mode (replace_all\|append\|clear)` · `pages [{conditions, span, commands}]` |

**`edit-troop-events`** — Gestiona páginas de eventos de batalla. Condiciones: `turnValid`+`turnA`+`turnB` · `enemyValid`+`enemyIndex`+`enemyHp` · `actorValid`+`actorId`+`actorHp` · `switchValid`+`switchId`. `span`: 0=una vez/batalla, 1=una vez/turno, 2=cada momento.

Tipos de comando exclusivos de batalla (solo válidos dentro de páginas de eventos de tropa): `change-enemy-hp` (331) · `change-enemy-mp` (332) · `change-enemy-state` (333) · `recover-all-enemies` (334) · `enemy-appear` (335) · `enemy-transform` (336) · `show-battle-animation` (337) · `force-action` (338). Consulta la sección inglesa para los parámetros completos.

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

**`edit-map-event`** — Renombra, mueve o añade comandos a un evento existente. `append_commands` inserta antes del terminador en la página 0. Formato: `{ type, data }` — tipos: `message` · `choice` · `wait` · `transfer` · `script` · `switch` · `variable` · `common-event` · `battle` · `animation` · `show-picture` · `tint-picture` · `move-picture` · `rotate-picture` · `erase-picture` (y muchos más — consulta EXAMPLES.md para la referencia completa de tipos de comando).

| `edit-event-page` | `map_id` · `event_id` · `mode (add\|replace\|remove)` · `page_index?` · `page?` |

**`edit-event-page`** — Añade, reemplaza o elimina páginas de un evento de mapa sin recrear el evento completo. Útil para NPCs multi-estado (progresión de misiones, día/noche, puertas bloqueadas). La página define trigger, sprite, movimiento, condiciones y comandos.

**`delete-map-event`** — Pone null el slot del evento en el array de eventos del mapa.

#### Vehículos

| Herramienta | Campos clave |
|---|---|
| `edit-vehicle` | `vehicle (boat\|ship\|airship)` · `character_name?` · `character_index?` · `bgm? {name,volume,pitch,pan}` · `start_map_id?` · `start_x?` · `start_y?` |

**`edit-vehicle`** — Edita bote, barco o aeronave en `System.json`. Todos los campos excepto `vehicle` son opcionales.

---

#### Pintura de tiles en mapas

| Herramienta | Campos clave |
|---|---|
| `read-map-tiles` | `map_id` · `x?` · `y?` · `width?` · `height?` · `layers? [0-5]` |
| `paint-map-tiles` | `map_id` · `tiles [{x, y, layer, tile_id}]` |
| `fill-map-region` | `map_id` · `x` · `y` · `width` · `height` · `layer` · `tile_id` |
| `paint-map-region` | `map_id` · `layer` · `x` · `y` · `width` · `height` · `tile_id` o `tiles [array plano]` |

Fórmula de índice: `x + y × anchura + capa × anchura × altura`. Capas: 0–3 = capas de tile (0=vacío, IDs válidos ≥ 2048), 4 = sombras (0–15), 5 = región (0–255).

**`read-map-tiles`** — Devuelve los IDs de tile de cada celda de la región solicitada. Útil para entender el estado actual antes de pintar.

**`paint-map-tiles`** — Aplica un array de cambios de tile individuales de forma atómica. Las entradas inválidas se omiten y se devuelven como advertencias.

**`fill-map-region`** — Rellena un rectángulo con un solo tile en cualquier capa. `tile_id=0` borra la región.

**`paint-map-region`** — Modo fill (`tile_id`) o modo stamp (`tiles` = array plano row-major de `anchura×altura` IDs). El modo stamp es el camino eficiente para colocar plantillas de habitaciones o prefabs de mazmorra.

---

#### Tilesets

| Herramienta | Campos clave |
|---|---|
| `read-tileset` | `tileset_id?` · `include_flags?` |
| `create-tileset` | `name` · `mode?` · `tilesetNames? [9 entradas]` |
| `edit-tileset-properties` | `tileset_id` · `name?` · `mode?` · `tilesetNames? [9 entradas]` |
| `edit-tileset` | `tileset_id` · `flag_overrides [{tile_id, passable?, terrain_tag?}]` |

**`read-tileset`** — Lee los metadatos del tileset: nombre, modo, archivos gráficos (`tilesetNames` con 9 slots: A1 A2 A3 A4 A5 B C D E) y un resumen de pasabilidad. Con `include_flags: true` devuelve el array completo de 8192 flags. Sin `tileset_id` lista todos los tilesets.

**`create-tileset`** — Crea un nuevo tileset en `Tilesets.json`. Todos los 8192 flags empiezan como pasables. `tilesetNames` es un array de 9 nombres de archivo (sin extensión) de `img/tilesets/`.

**`edit-tileset-properties`** — Edita nombre, modo (`0`=Mundo / `1`=Área) o los 9 archivos gráficos de un tileset. Para pasabilidad y terrain tags usa `edit-tileset`.

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

| `edit-plugin-parameters` | `plugin_name` · `parameters {clave: "valor", …}` |
| `reorder-plugin` | `plugin_name` · `position (first\|last\|before\|after)` · `relative_plugin?` |

**`edit-plugin-parameters`** — Actualiza parámetros individuales de un plugin registrado. Solo se cambian las claves indicadas; el resto se preserva. Los valores deben ser strings (formato de RPG Maker MZ).

**`reorder-plugin`** — Cambia el orden de carga de un plugin en `js/plugins.js`. `position: "before"` y `"after"` requieren `relative_plugin`. El orden de plugins es crítico en RPG Maker MZ.

#### Animaciones

| Herramienta | Campos clave |
|---|---|
| `read-animation` | `animation_id?` |
| `edit-animation` | `animation_id` · `name?` · `effect_name?` · `display_type?` · `offset_x?` · `offset_y?` · `speed?` |

**`read-animation`** — Devuelve el objeto de animación completo cuando se proporciona `animation_id`. Sin ID lista todas las animaciones con id y nombre.

**`edit-animation`** — Edita metadatos: `effect_name` referencia un archivo Effekseer de la carpeta `effects/` (sin extensión). `display_type`: 0=cabeza objetivo, 1=centro objetivo, 2=pantalla completa, -1=frente pantalla.

#### Herramientas de utilidad

| Herramienta | Campos clave |
|---|---|
| `search-entity` | `entity_type` · `query (búsqueda de subcadena en nombre)` |
| `duplicate-entity` | `entity_type` · `entity_id` · `new_name` |
| `export-project-summary` | *(sin entrada requerida)* |
| `edit-map-info` | `map_id` · `name?` · `parent_id?` · `order?` · `expanded?` |
| `validate-project` | `entity_types?` · `include_warnings?` |
| `find-and-replace` | `find` · `replace` · `targets?` · `confirm: true` |
| `copy-map` | `source_map_id` · `new_name` · `parent_id?` |
| `cleanup-project` | `entity_types?` |
| `batch-update-entities` | `entity_type` · `entity_ids [array]` · `updates {object}` · `confirm: true` |
| `export-dialogue` | `include_maps?` · `include_common_events?` · `map_ids?` |
| `import-dialogue` | `entries [array]` · `confirm: true` |

**`search-entity`** — Búsqueda de subcadena sin distinción de mayúsculas en cualquier tipo de entidad. Devuelve `{ matches: [{id, name}] }`.

**`duplicate-entity`** — Clona una entidad con un nuevo nombre y el siguiente ID disponible. Devuelve `{ success, new_id, name }`.

**`export-project-summary`** — Devuelve un resumen compacto del proyecto: conteos de actores/enemigos/habilidades, nombres de mapas, totales de switches y variables.

**`edit-map-info`** — Edita solo la entrada de metadatos de MapInfos.json (nombre, padre, orden) sin tocar el archivo de tiles/eventos.

**`validate-project`** — Ejecuta todos los validadores sobre el proyecto completo y devuelve un informe estructurado. Devuelve `{ valid, total_checked, total_errors, total_warnings, issues: [{entity_type, id, name, errors[], warnings[]}] }`. Filtra con `entity_types` para limitar el alcance.

**`find-and-replace`** — Busca y reemplaza texto en masa en nombres de entidades, notas y texto de comandos de evento en todos los archivos de datos y mapas. `targets`: `"names"` `"notes"` `"event_commands"` (por defecto: los tres). Requiere `confirm: true`. Devuelve `{ total_replacements, files_changed[] }`.

**`copy-map`** — Duplica un mapa existente (tiles + eventos) con un nuevo nombre y el siguiente ID disponible. Añade automáticamente la entrada a `MapInfos.json`. Devuelve `{ new_map_id, name, copied_from }`.

**`cleanup-project`** — Auditoría de solo lectura de las ranuras nulas en los arrays JSON de entidades. Informa `{ null_slots, active_entities, total_slots }` por tipo de entidad. NO reescribe archivos ni reasigna IDs.

**`batch-update-entities`** — Aplica las mismas actualizaciones de campo a múltiples entidades del mismo tipo en una sola llamada. Útil para balanceo masivo: establecer HP en 10 enemigos, renombrar un grupo de ítems, etc. Tipos admitidos: `Actor` `Item` `Weapon` `Armor` `Skill` `Class` `State` `Enemy` `Troop` `CommonEvent` `Animation` `Tileset`. Devuelve `{ results: [{id, success}] }`. Requiere `confirm: true`.

**`export-dialogue`** — Extrae todo el texto de diálogo de eventos de mapa y eventos comunes en un JSON estructurado. Cada entrada contiene `source_type`, `source_id`, `event_id`, `page`, `command_index`, `speaker` y `lines[]`. Caso de uso principal: preparar texto para traducción.

**`import-dialogue`** — Escribe el diálogo traducido/modificado de vuelta al proyecto. Empareja entradas por `source_id`, `event_id`, `page` y `command_index` de `export-dialogue`. El número de líneas por entrada debe coincidir con el original. Requiere `confirm: true`.

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
| `get-actor-runtime` | Lee el estado en vivo de un actor: nivel, HP, MP, TP, estados, equipo, habilidades |
| `manage-party-runtime` | `action (get\|add\|remove)` · `actor_id?` — leer grupo o añadir/eliminar miembro |
| `control-weather-runtime` | `type (none\|rain\|storm\|snow)` · `power (0-9)` · `duration?` |
| `play-audio-runtime` | `action (bgm\|bgs\|se\|me\|stop_bgm\|stop_bgs\|stop_se)` · `name?` · `volume?` · `pitch?` · `pan?` |
| `get-map-state-runtime` | Lee dimensiones del mapa actual, posición del jugador y clima activo |
| `control-timer-runtime` | `action (start\|stop\|get)` · `frames?` (requerido para start) |
| `get-battle-state-runtime` | *(sin entrada requerida — debe estar en batalla)* |

**`control-timer-runtime`** — Inicia, detiene o consulta el temporizador de cuenta regresiva del juego. `action: "get"` devuelve `{ working, seconds }`. `action: "start"` requiere `frames` (60 frames = 1 segundo).

**`get-battle-state-runtime`** — Lee el estado de batalla actual: `{ in_battle, turn, enemies: [{id,name,hp,mhp,mp,alive,states}], party: [{id,name,hp,mhp,mp,alive}] }`.

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

| Herramienta | Campos clave |
|---|---|
| `batch-edit` | `operations [{tool, input}]` (máx 50) · `stop_on_error?` |
| `batch-create-entities` | `entity_type (Actor\|Item\|Weapon\|Armor\|Skill\|Class\|State\|Enemy\|Troop\|CommonEvent\|Animation\|Tileset)` · `entities [array de objetos]` (máx 50) |
| `batch-delete-entities` | `entity_type` · `entity_ids [array de enteros]` (máx 100) · `confirm: true` |

**`batch-edit`** — Ejecuta hasta 50 operaciones en una sola llamada MCP. Devuelve resultados individuales. Usa `stop_on_error: true` para detener en el primer error.

**`batch-create-entities`** — Crea múltiples entidades del mismo tipo de forma atómica. Cada objeto en `entities` necesita al menos `name`. Tipos admitidos: `Actor` `Item` `Weapon` `Armor` `Skill` `Class` `State` `Enemy` `Troop` `CommonEvent` `Animation` `Tileset`. Devuelve `{ results: [{index, success, id}] }`.

**`batch-delete-entities`** — Anula múltiples entidades en una sola operación. Admite todos los tipos de entidad, incluyendo Animation, Troop, CommonEvent y Tileset. Requiere `confirm: true`. Devuelve resultado por ID.

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

No escribes JSON directamente — solo describe lo que quieres en lenguaje natural y la IA se encarga del resto. Consulta **[EXAMPLES.md](EXAMPLES.md)** para ver prompts en lenguaje natural y el JSON equivalente de cada herramienta, en inglés y español.

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
