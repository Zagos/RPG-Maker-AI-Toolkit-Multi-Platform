# /status

Show the current state of the RPG Maker AI Toolkit project.

## Steps

1. Run `npx tsc --noEmit 2>&1` and report: clean or N errors.

2. Run `npm test 2>&1` and report: N tests passing / failing across M suites.

3. Count registered tools:
   - Count entries in `src/adapters/mz/handlers/registry.ts` TOOL_HANDLERS map
   - Add 1 for `batch-edit` (registered separately in index.ts)
   - Report total

4. List test files in `tests/rpgmaker/` and their test counts (from the vitest output).

5. Show git status summary: current branch, uncommitted files.

## Output format

```
Branch: <branch>
Type check: clean | N errors
Tests: N passing / M failing (K suites)
Tools: N registered

Test suites:
  writer.test.ts         22 tests
  commands.test.ts       30 tests
  …

Uncommitted changes: <list or "none">
```

Keep it concise. One line per item.
