# AGENTS.md — RPG Maker MCP

Guide for AI agents (and human contributors) working on this codebase.

---

## Project at a glance

An MCP server written in **TypeScript ESM** (Node 20+, `"type": "module"`, `.js` extensions in all imports). It exposes **57 tools** that read and write RPG Maker MZ project JSON files, plus a runtime control bridge for live game manipulation. Each tool call is stateless — the server creates a fresh Reader/Writer per call.

Key invariants:
- **Never throw from a handler** — always return `JSON.stringify({ error: … })`.
- **Backups before every write** — `RPGMakerWriter` creates a timestamped backup automatically.
- **Validate before writing** — use `RPGMakerValidator` at the handler boundary; return error JSON if invalid.
- **Append to change log** — every successful write calls `ctx.changeLog.append(…)`.

---

## Architecture

```
src/index.ts                 ← server bootstrap, tool list, HTTP bridge, handleToolCall()
src/handlers/
  registry.ts                ← TOOL_HANDLERS map (all tools except batch-edit)
  types.ts                   ← HandlerContext interface
  batch-edit.ts              ← imports registry.ts (no circular dep)
  debug.ts                   ← runtime control: launch, battle, save/load, party state, suite
  runtime-query.ts           ← runtime reads: get-switch/variable, get/modify-inventory,
                               call-common-event, modify-actor-runtime
  actor.ts / item.ts / …     ← one handler file per tool group
  drop-items.ts              ← edit-drop-items
  class-learnings.ts         ← edit-class-learnings
  vehicle.ts                 ← edit-vehicle
  system-extended.ts         ← read-system-extended
src/rpgmaker/
  reader.ts                  ← read-only JSON helpers
  writer.ts                  ← write + backup + prune + validation hooks
  validator.ts               ← static validation methods
  change-log.ts              ← append/read mcp-changes.json
  commands.ts                ← event command builders (textCommands, etc.)
  story-manager.ts
  dialogue-manager.ts
src/tools/
  edit-actor.ts / …          ← JSON Schema / Zod definitions (one per tool)
src/types/
  rpgmaker.ts                ← RPGMap, RPGMapEvent, RPGActor, … interfaces
tests/
  rpgmaker/*.test.ts         ← Vitest tests using temp project dirs
```

---

## HandlerContext

Every handler receives this object:

```typescript
interface HandlerContext {
  reader: RPGMakerReader;
  writer: RPGMakerWriter;
  input: Record<string, unknown>;   // raw tool input
  projectPath: string;
  debugBridge: RPGMakerDebugBridge;
  changeLog: ChangeLog;
  debug: boolean;
}
```

`reader` and `writer` are created fresh per `handleToolCall()` invocation. `changeLog` is a singleton shared across all calls in a server process.

---

## Adding a new tool — checklist

1. **Schema** — create `src/tools/my-tool.ts` exporting a `MyTool` object (`name`, `description`, `inputSchema`).

2. **Handler** — create `src/handlers/my-tool.ts` exporting `async function handleMyTool(ctx: HandlerContext): Promise<string>`.
   - Read from `ctx.input` (cast as needed).
   - Validate with `RPGMakerValidator` if writing entity data.
   - Call `ctx.writer.*` to persist.
   - Call `ctx.changeLog.append(…)` on success.
   - Wrap in try/catch; return `JSON.stringify({ error })` on failure.

3. **Register** — add to `src/handlers/registry.ts` (handler import + entry in `TOOL_HANDLERS`).

4. **Expose** — add `MyTool` to the `tools` array in `src/index.ts`.

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
- Coverage excludes `src/index.ts`, `src/tools/**`, `src/templates/**` (schema/config files).
- Handlers with internal `setTimeout` sleeps (e.g. `run-battle-suite`) need `vi.useFakeTimers()` + `vi.runAllTimersAsync()` to avoid multi-second test runs. Always call `vi.useRealTimers()` in a `finally` block to prevent leaking into other tests.

```bash
npm test                  # run once
npm run test:watch        # watch
npm run test:coverage     # v8 coverage
npx tsc --noEmit          # type-check without building
```

CI runs on Node 20 and 22 via `.github/workflows/ci.yml`.

---

## Runtime read pattern

`get-switch`, `get-variable`, and `get-inventory` cannot return values via the normal ACK flow. Instead, the handler builds a JS snippet that calls `fetch('http://127.0.0.1:9001/gamestate', { method:'POST', body: JSON.stringify({ ...standardState, queryResult: <value> }) })` inside the game. Then the handler calls `debugBridge.waitForGameState()`, which resolves with the full payload including `queryResult`. Access it as:

```typescript
debugBridge.setCommand("execute_script", { code: script });
const state = await debugBridge.waitForGameState(8000);
const qr = (state as unknown as Record<string, unknown>).queryResult;
```

The `queryResult` field is not declared in `GameState`; cast via `as unknown as Record<string,unknown>` to read it. Always call `waitForGameState` **before** `setCommand` to avoid a race condition (it nulls `gameState` synchronously before its first poll).

---

## Common mistakes to avoid

| Mistake | Why it breaks |
|---|---|
| Importing individual handlers in `index.ts` directly | The registry owns the map; adding there keeps batch-edit circular-dep-free |
| Throwing from a handler | MCP callers expect JSON — always catch and return `{ error }` |
| Calling `validator` inside `writer.ts` | Validation belongs at the handler boundary, not in the writer |
| Skipping `changeLog.append` | The audit trail becomes incomplete |
| Writing to `MapInfos.json` without the 7 required fields | `writer.writeMap` will throw before touching the file |
| Plugin filenames with `..` or special chars | `writer.writePlugin` throws; sanitize before calling |
| Adding `"batch-edit"` to `registry.ts` | Creates circular import — add it only in `index.ts` |
| Using `waitForAck` for runtime read tools | ACK doesn't carry a return value — use `waitForGameState` with the fetch-into-gamestate pattern |
| Calling `waitForGameState` after `setCommand` | Race: game may respond before the poll loop starts — call `waitForGameState` first |

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `RPGMAKER_PROJECT_PATH` | *(required)* | Absolute path to RPG Maker MZ project root |
| `RPGMAKER_EXECUTABLE_PATH` | — | Path to RPGMakerMZ.exe (for `launch-game`) |
| `MCP_DEBUG` | `false` | Enable verbose debug logging |
| `LOG_LEVEL` | `info` | `debug` \| `info` \| `warn` \| `error` |
| `BACKUP_MAX_COUNT` | `10` | Max backup files kept per JSON file |
