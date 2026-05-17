# AGENTS.md — RPG Maker AI Toolkit (Multi-Platform)

Guide for AI agents (and human contributors) working on this codebase.

---

## Project at a glance

An MCP server written in **TypeScript ESM** (Node 20+, `"type": "module"`, `.js` extensions in all imports). It exposes **12 macro tools** to the LLM, backed by ~110 internal handlers. Each tool call is stateless — the server creates a fresh Reader/Writer per call.

Supported engines: **MZ · MV · VX Ace · VX · XP** (selected via `RPGMAKER_ENGINE` env var, default `mz`).

Key invariants:
- **Never throw from a handler** — always return `JSON.stringify({ error: … })`.
- **Backups before every write** — writer creates a timestamped backup automatically.
- **Validate before writing** — use `RPGMakerValidator` at the handler boundary; return error JSON if invalid.
- **Append to change log** — every successful write calls `ctx.changeLog.append(…)`.

---

## Architecture

```
src/index.ts                       ← server bootstrap, tool list, HTTP bridge, handleToolCall()
                                     selects reader/writer based on RPGMAKER_ENGINE

src/core/
  resolve-handler.ts               ← engine-aware handler lookup (RUBY_ENGINES → ruby registry)
  change-log.ts                    ← engine-agnostic audit log (mcp-changes.json)
  types/
    reader.ts                      ← IProjectReader interface
    writer.ts                      ← IProjectWriter interface

src/macro/                         ← 12 macro tools exposed to the LLM
  schemas/
    runtime-control.ts             ← runtime-control macro schema
    runtime-inspect.ts             ← runtime-inspect macro schema
    query-data.ts                  ← query-data macro schema
    game-entity.ts                 ← game-entity macro schema
    game-map.ts                    ← game-map macro schema
    dialogue-tools.ts              ← dialogue-tools macro schema
    battle-sim.ts                  ← battle-sim macro schema
    project-tools.ts               ← project-tools macro schema
    plugin-manage.ts               ← plugin-manage macro schema
    game-setup.ts                  ← game-setup macro schema
    manage-backups.ts              ← manage-backups macro schema
    (batch-edit is the escape hatch — schema in src/adapters/mz/tools/)
  handlers/
    *.ts                           ← macro dispatchers → call internal handlers via resolveHandler()

src/handlers/                      ← ~110 internal handlers (not exposed to LLM)
  registry.ts                      ← TOOL_HANDLERS map (all internal tools except batch-edit)
  registry-ruby.ts                 ← RUBY_RUNTIME_HANDLERS map (Ruby engine overrides)
  runtime-ruby.ts                  ← runtime handlers for VX Ace/VX/XP via TCP bridge
  types.ts                         ← HandlerContext interface
  batch-edit.ts                    ← imports registry.ts (no circular dep)
  *.ts                             ← one handler file per tool group

src/adapters/
  mz/                              ← RPG Maker MZ (JSON, NW.js) — full feature set
    reader.ts                      ← RPGMakerReader implements IProjectReader
    writer.ts                      ← RPGMakerWriter implements IProjectWriter
    validator.ts                   ← static validation methods
    commands.ts                    ← event command builders (30+ command types)
    constants.ts                   ← EVENT_CMD, TRAIT_CODE, EFFECT_CODE, PARAM_INDEX enums
    debug-bridge.ts                ← HTTP bridge for runtime control
    story-manager.ts / dialogue-manager.ts
    tools/
      *.ts                         ← internal JSON Schema definitions (not exposed to LLM)
    types/
      rpgmaker.ts                  ← RPGMap, RPGMapEvent, RPGActor, … interfaces
    templates/
      plugin-template.ts

  mv/                              ← RPG Maker MV (JSON, NW.js) — extends MZ
    reader.ts                      ← MVReader extends RPGMakerReader
    writer.ts                      ← MVWriter extends RPGMakerWriter

  vxace/                           ← RPG Maker VX Ace (.rvdata2, Marshal Ruby 1.9)
    reader.ts                      ← VXAceReader implements IProjectReader
    writer.ts                      ← VXAceWriter implements IProjectWriter
    normalize.ts                   ← snakeToCamel / camelToSnake key normalization

  vx/                              ← RPG Maker VX (.rvdata, Marshal Ruby 1.8)
    reader.ts                      ← VXReader extends VXAceReader
    writer.ts                      ← VXWriter extends VXAceWriter

  xp/                              ← RPG Maker XP (.rxdata, Marshal Ruby 1.8)
    reader.ts                      ← XPReader extends VXAceReader
    writer.ts                      ← XPWriter extends VXAceWriter

  ruby-bridge/                     ← Ruby bridges (Marshal I/O + runtime TCP)
    bridge.rb                      ← Marshal ↔ JSON: read/write .rxdata/.rvdata/.rvdata2
    index.ts                       ← Node.js wrapper (spawnSync, 30s timeout, RUBY_PATH)
    game-bridge.rb                 ← TCP server injected into the game (port 9002, RGSS3)
    tcp-bridge.ts                  ← Node.js TCP client for game-bridge.rb

tests/
  rpgmaker/*.test.ts               ← Vitest tests using temp project dirs
scripts/
  copy-assets.js                   ← copies .rb files from src/ to dist/ after tsc
```

All internal handlers work on all engines. VX Ace / VX / XP adapters implement `IProjectReader`/`IProjectWriter` so every handler works unchanged across engines. Runtime tools use `ctx.debugBridge` on MZ/MV and `ctx.rubyBridge` (TCP) on Ruby engines. Plugin actions are MZ/MV-only; script actions are Ruby-only — the `plugin-manage` macro enforces this guard via `ctx.engine`.

---

## HandlerContext

Every handler receives this object:

```typescript
interface HandlerContext {
  reader: IProjectReader;          // concrete type depends on RPGMAKER_ENGINE
  writer: IProjectWriter;
  input: Record<string, unknown>;  // raw tool input
  projectPath: string;
  engine: string;                  // "mz" | "mv" | "vxace" | "vx" | "xp"
  debugBridge: RPGMakerDebugBridge; // MZ/MV HTTP bridge (port 9001)
  rubyBridge: RPGMakerRubyBridge;  // VX Ace/VX/XP TCP bridge (port 9002)
  changeLog: ChangeLog;
  debug: boolean;
}
```

`reader` and `writer` are created fresh per `handleToolCall()` invocation. `changeLog` is a singleton. On MZ/MV calls, `rubyBridge` is present but unused; on Ruby-engine calls, `debugBridge` is present but unused — check `ctx.engine` to decide which bridge to use.

---

## Adding a new internal handler — checklist

1. **Schema** (internal only) — create `src/adapters/mz/tools/my-tool.ts` exporting a tool object. These are NOT exposed to the LLM; they serve as documentation and are used by batch-edit.

2. **Handler** — create `src/handlers/my-tool.ts` exporting `async function handleMyTool(ctx: HandlerContext): Promise<string>`.
   - Read from `ctx.input` (cast as needed).
   - Validate with `RPGMakerValidator` if writing entity data.
   - Call `ctx.writer.*` to persist.
   - Call `ctx.changeLog.append(…)` on success.
   - Wrap in try/catch; return `JSON.stringify({ error })` on failure.

3. **Register** — add to `src/handlers/registry.ts` (handler import + entry in `TOOL_HANDLERS`).

4. **Wire to a macro** — add a routing case to the relevant macro handler in `src/macro/handlers/`. Do NOT add the internal tool to the `tools` array in `src/index.ts` — only the 12 macros are exposed to the LLM. Use the `batch-edit` escape hatch if a multi-step operation doesn't fit any macro.

5. **Tests** — add a test file in `tests/rpgmaker/`. Use `createTempProject()` pattern (mkdtemp + minimal JSON files + afterEach rmSync).

---

## Writer patterns

```typescript
// Update existing entity
writer.updateActor(id, { name: "Hero", … });

// Create new entity (returns new id)
const newId = writer.addActor({ name: "Hero", classId: 1, … });

// Write a map (validates mapInfo if provided)
writer.writeMap(mapId, mapData);
writer.writeMap(mapId, mapData, { id: mapId, name: "Town", parentId: 0, order: 1, expanded: false, scrollX: 0, scrollY: 0 });

// Write a plugin (sanitizes filename — throws on bad names)
writer.writePlugin("MyPlugin.js", pluginCode);
```

Backup files land in `<projectPath>/backups/` as `FileName_YYYY-MM-DDTHH-MM-SS-mmm_NNNN.json`. Auto-pruned to `maxBackups` (env: `BACKUP_MAX_COUNT`, default 10).

For VX Ace / VX / XP engines, backups are binary copies of the Marshal files (`.rvdata2`, `.rvdata`, `.rxdata`).

---

## Validator patterns

```typescript
// All return { valid: boolean, errors: string[], warnings: string[] }
RPGMakerValidator.validateActor({ name, initialLevel, maxLevel, traits });
RPGMakerValidator.validateItem({ name, price, effects });
RPGMakerValidator.validateEnemy({ name, actions });
RPGMakerValidator.validateSkill({ name, mpCost });
RPGMakerValidator.validateMapEvent({ x, y, name? }, { width, height });
RPGMakerValidator.validateJavaScript(code);
RPGMakerValidator.validateFilename(filename);
```

`validateMapEvent` checks that `x` is in `[0, width-1]` and `y` is in `[0, height-1]`.

---

## Change log

```typescript
ctx.changeLog.append({
  tool: "edit-actor",
  entityType: "Actor",
  entityId: 3,
  action: "update",          // "create" | "update" | "delete"
  summary: "Actor 3 updated: name='Hero'",
});

const entries = ctx.changeLog.read({ limit: 20, action: "create", since: "2025-01-01T00:00:00Z" });
```

Persisted to `<projectPath>/mcp-changes.json`. The `append` method is best-effort — it never throws.

---

## batch-edit architecture note

`batch-edit.ts` imports `TOOL_HANDLERS` from `registry.ts`, which does NOT include `"batch-edit"` itself (would be circular). `index.ts` spreads the registry and then adds `"batch-edit": handleBatchEdit`. Nested `batch-edit` calls are explicitly rejected at runtime.

---

## Testing conventions

- All tests use `vitest` with `import … from "vitest"` (no globals).
- Temp projects: `fs.mkdtempSync(path.join(os.tmpdir(), "rpgmaker-test-"))` + minimal JSON stubs.
- Always `afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))`.
- Test files live in `tests/rpgmaker/`. The vitest config picks up `tests/**/*.test.ts`.
- Coverage excludes `src/index.ts`, `src/adapters/mz/tools/**`, `src/adapters/mz/templates/**` (schema/config files).
- Handlers with internal `setTimeout` sleeps (e.g. `run-battle-suite`) need `vi.useFakeTimers()` + `vi.runAllTimersAsync()` to avoid multi-second test runs. Always call `vi.useRealTimers()` in a `finally` block to prevent leaking into other tests.
- Ruby bridge integration tests are skipped locally when Ruby is not installed; CI runs them with Ruby 3.2.

```bash
npm test                  # run once
npm run test:watch        # watch
npm run test:coverage     # v8 coverage
npx tsc --noEmit          # type-check without building
```

CI runs on Node 20 and 22 with Ruby 3.2 via `.github/workflows/ci.yml`.

---

## Runtime read pattern

`get-switch`, `get-variable`, `get-inventory`, and new runtime read tools (`get-actor-runtime`, `manage-party-runtime get`, `get-map-state-runtime`) cannot return values via the normal ACK flow. Instead, the handler builds a JS snippet that POSTs the result to `/gamestate`, then waits for the bridge to receive it.

```typescript
// ALWAYS call waitForGameState BEFORE setCommand (avoids race condition)
const state = await ctx.debugBridge.waitForGameState(8000);
ctx.debugBridge.setCommand("execute_script", { code: script });
const qr = (state as unknown as Record<string, unknown>).queryResult;
```

The script must POST to `http://127.0.0.1:9001/gamestate` with `queryResult` in the body:

```javascript
(function() {
  var result = $gameActors.actor(1).hp;
  fetch('http://127.0.0.1:9001/gamestate', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      mapId: $gameMap ? $gameMap.mapId() : 0,
      playerX: $gamePlayer ? $gamePlayer.x : 0,
      playerY: $gamePlayer ? $gamePlayer.y : 0,
      switches: {}, variables: {},
      queryResult: result
    })
  });
})();
```

For **write-only** runtime operations (weather, audio, party add/remove), use `waitForAck` instead — these don't return a value:

```typescript
await ctx.debugBridge.waitForAck(5000);
ctx.debugBridge.setCommand("execute_script", { code: script });
```

The `queryResult` field is not declared in `GameState`; cast via `as unknown as Record<string,unknown>` to read it.

---

## Event command builders (`src/adapters/mz/commands.ts`)

`commandInputToEventCommands(command)` accepts a `type` + structured `data` object. **30+ command types** are supported:

| Category | Types |
|---|---|
| Messages | `message`, `choice`, `comment`, `show-scrolling-text` |
| Flow | `conditional-branch`, `loop`, `break-loop`, `exit-event`, `label`, `jump-to-label` |
| Data | `switch`, `variable`, `change-variable`, `control-self-switch` |
| Party | `change-gold`, `change-item`, `change-weapon`, `change-armor`, `add-party-member`, `remove-party-member` |
| Actors | `change-hp`, `change-mp`, `change-tp`, `recover-all`, `change-state` |
| Media | `play-bgm`, `play-se`, `play-me`, `stop-bgm`, `fade-out`, `fade-in`, `show-picture`, `erase-picture` |
| Misc | `wait`, `transfer`, `script`, `battle`, `animation`, `common-event`, `shop` |

Use constants from `src/adapters/mz/constants.ts` (e.g. `EVENT_CMD.SHOP_PROCESSING`) instead of magic numbers when building commands manually.

---

## CREATE tools pattern

Dedicated `create-*` tools exist for all entity types. They differ from `edit-*` in that:
- `name` is always **required** in the schema
- No entity ID is accepted (always creates new)
- Full default values are applied explicitly
- Returns `{ success: true, <entity>_id: newId, name }`

Available: `create-actor`, `create-enemy`, `create-skill`, `create-item`, `create-weapon`, `create-armor`, `create-class`, `create-state`, `create-animation`

The underlying writer methods (`writer.addSkill()`, `writer.addItem()`, etc.) are shared between `edit-*` (when no ID given) and `create-*` handlers.

---

## Utility tools

| Tool | Handler | Purpose |
|---|---|---|
| `search-entity` | `search-entity.ts` | Find entities by field substring match |
| `duplicate-entity` | `duplicate-entity.ts` | Clone any entity with a new name |
| `export-project-summary` | `project-summary.ts` | Compact overview of entire project |
| `edit-map-info` | `map-info.ts` | Edit MapInfos.json without touching map content |

---

## Multi-engine notes

| Engine | Format | Adapter | Runtime bridge |
|---|---|---|---|
| MZ | JSON | `src/adapters/mz/` | Yes (HTTP, port 9001) |
| MV | JSON | `src/adapters/mv/` | Yes (same HTTP bridge) |
| VX Ace | `.rvdata2` | `src/adapters/vxace/` | Yes (TCP, port 9002) |
| VX | `.rvdata` | `src/adapters/vx/` | Yes (TCP, port 9002) |
| XP | `.rxdata` | `src/adapters/xp/` | Yes (TCP, port 9002) |

**Marshal bridge** (`src/adapters/ruby-bridge/bridge.rb` + `index.ts`): Node invokes `bridge.rb` via `spawnSync` to convert Marshal ↔ JSON for file I/O. Ruby must be on PATH (or set `RUBY_PATH`). Auto-detected at startup — clear error if missing.

**TCP runtime bridge** (`game-bridge.rb` + `tcp-bridge.ts`): For live game control on Ruby engines, `setup-debug-plugin` injects `game-bridge.rb` into `Scripts.rvdata2`. The script opens a TCP server on port 9002 inside the game. `RPGMakerRubyBridge` connects and sends newline-delimited JSON commands (`execute` / `query` / `ping`). `RUBY_RUNTIME_HANDLERS` in `registry-ruby.ts` routes runtime tool calls to `runtime-ruby.ts` handlers that use `ctx.rubyBridge`.

**Key normalization**: Ruby instance variable names are snake_case. `normalize.ts` converts snake_case keys → camelCase on read, camelCase → snake_case on write, so MZ handlers receive/send camelCase as usual.

**MapInfos format**: In VX Ace/VX/XP, MapInfos is a Ruby Hash `{id => RPG::MapInfo}`, not an array. `VXAceReader` has a dedicated `readMapInfosHash()` that converts it to the array format the handlers expect.

**Plugin tools**: Return a clear error on Ruby engines — those engines use script tools (`list-scripts`, `read-script`, `create-script`, `edit-script`, `delete-script`) instead.

**Script tools**: Only available on Ruby engines (VX Ace/VX/XP). Return a clear error on MZ/MV — those engines use plugin tools.

---

## Common mistakes to avoid

| Mistake | Why it breaks |
|---|---|
| Exposing a new internal handler directly in `index.ts` `tools` array | Only the 12 macros are exposed to the LLM — wire new handlers into a macro instead |
| Importing individual handlers in `index.ts` directly | The registry owns the map; adding there keeps batch-edit circular-dep-free |
| Throwing from a handler | MCP callers expect JSON — always catch and return `{ error }` |
| Calling `validator` inside `writer.ts` | Validation belongs at the handler boundary, not in the writer |
| Skipping `changeLog.append` | The audit trail becomes incomplete |
| Writing to `MapInfos.json` without the 7 required fields | `writer.writeMap` will throw before touching the file |
| Plugin filenames with `..` or special chars | `writer.writePlugin` throws; sanitize before calling |
| Adding `"batch-edit"` to `registry.ts` | Creates circular import — add it only in `index.ts` |
| Using `waitForAck` for runtime read tools | ACK doesn't carry a return value — use `waitForGameState` with the fetch-into-gamestate pattern |
| Calling `waitForGameState` after `setCommand` | Race: game may respond before the poll loop starts — call `waitForGameState` first |
| Using magic numbers for event codes | Use `EVENT_CMD`, `TRAIT_CODE`, `EFFECT_CODE` from `src/adapters/mz/constants.ts` |
| Adding `create-*` tools that duplicate `edit-*` logic | CREATE handlers call the same `writer.addXxx()` as edit handlers — share the writer method |
| Editing MapInfos inside `edit-map` when only metadata changes | Use `edit-map-info` which only touches MapInfos.json (no map file I/O) |
| Typing `ctx.reader` as `RPGMakerReader` in handlers | Type against `IProjectReader` so the handler works on all engines |
| Calling `waitForGameState` on a Ruby-engine project | HTTP bridge is MZ/MV only — use `ctx.rubyBridge.queryValue()` on Ruby engines |
| Using `ctx.rubyBridge` without checking if the game is running | `rubyBridge.executeScript()` will throw with a connection error — handle it and return `notConnected()` JSON |
| Adding Ruby runtime handlers to `registry.ts` | Ruby runtime overrides live in `registry-ruby.ts` (`RUBY_RUNTIME_HANDLERS`) — `resolveHandler()` picks the right map based on engine |

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `RPGMAKER_PROJECT_PATH` | *(required)* | Absolute path to RPG Maker project root |
| `RPGMAKER_ENGINE` | `mz` | Engine: `mz` \| `mv` \| `vxace` \| `vx` \| `xp` |
| `RPGMAKER_EXECUTABLE_PATH` | — | Path to RPGMaker executable (for `launch-game`) |
| `RUBY_PATH` | `ruby` | Ruby executable for VX Ace / VX / XP Marshal bridge |
| `RUBY_BRIDGE_PORT` | `9002` | TCP port for the Ruby runtime bridge (VX Ace/VX/XP) |
| `RUBY_BRIDGE_TIMEOUT` | `8000` | Timeout in ms for Ruby bridge queries |
| `MCP_DEBUG` | `false` | Enable verbose debug logging |
| `LOG_LEVEL` | `info` | `debug` \| `info` \| `warn` \| `error` |
| `BACKUP_MAX_COUNT` | `10` | Max backup files kept per file |
