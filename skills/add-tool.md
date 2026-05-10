# /add-tool

Scaffold a complete new MCP tool end-to-end following the project conventions.

## Steps

1. **Read `AGENTS.md`** to refresh the checklist before starting.

2. **Ask the user** (if not already provided):
   - Tool name (kebab-case, e.g. `edit-troop`)
   - What entity or action it targets
   - Whether it reads, writes, or both

3. **Create the schema** at `src/tools/<tool-name>.ts`:
   - Export a const named `<PascalCase>Tool`
   - Use the JSON Schema object format (matching existing tools)
   - Mark `_id` fields optional to support create + update in one tool

4. **Create the handler** at `src/handlers/<tool-name>.ts`:
   - Export `async function handle<PascalCase>(ctx: HandlerContext): Promise<string>`
   - Read inputs from `ctx.input` with explicit casts
   - Validate with `RPGMakerValidator` where applicable
   - Wrap in try/catch — always return `JSON.stringify(…)`, never throw
   - Call `ctx.changeLog.append(…)` after every successful write
   - Follow the create-vs-update pattern: check if `_id` is present

5. **Add writer methods** if `RPGMakerWriter` is missing `update<Entity>` / `add<Entity>`:
   - Follow the existing pattern in `src/rpgmaker/writer.ts`
   - Use `readDatabaseArray` + `findIndex` + `writeJsonFile`

6. **Register** in `src/handlers/registry.ts`:
   - Import the handler
   - Add `"<tool-name>": handle<PascalCase>` to `TOOL_HANDLERS`

7. **Expose** in `src/index.ts`:
   - Import the schema tool object
   - Add it to the `tools` array

8. **Write tests** in `tests/rpgmaker/<tool-name>.test.ts`:
   - Use the `createTempProject()` + `afterEach rmSync` pattern
   - Cover: create success, update success, not-found error, validation failure

9. **Verify**:
   ```bash
   npx tsc --noEmit
   npm test
   ```

Do not add features beyond what was requested. One tool, one handler, one test file.
