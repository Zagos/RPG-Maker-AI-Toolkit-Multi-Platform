# /fix-test

Investigate and fix one or more failing tests without altering test intent.

## Rules

- **Never skip a test** (`it.skip`, `test.skip`, `describe.skip`).
- **Never change test assertions** to match wrong behavior — fix the source code.
- **Never widen a type or cast to `any`** just to silence a TypeScript error.

## Steps

1. Run `npm test 2>&1` and identify the failing test(s) — note file, describe block, test name, and error message.

2. Read the test to understand what contract it is asserting.

3. Read the source code under test to find where the contract is violated.

4. Fix the source code (handler, writer, validator, or command builder — never the test).

5. Run `npx tsc --noEmit` to confirm no new type errors.

6. Run `npm test` again. All tests must pass before reporting done.

7. If fixing one test breaks another, trace the root cause — do not patch the newly broken test.

## Common causes in this codebase

| Symptom | Likely cause |
|---|---|
| Validator error not thrown | Validation is inside the writer's try/catch — move it before the try block |
| Backup dir ENOENT | Test is looking in `data/backups/` but backups live in `projectPath/backups/` |
| ChangeLog filter returns empty | Missing filter branch in `change-log.ts` `read()` method |
| MapInfo fields rejected | `mapInfo.id !== mapId` or required field name mismatch |
