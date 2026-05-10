# /validate

Run all static checks and report the result.

## Steps

Run these commands sequentially and report any failures:

```bash
npx tsc --noEmit
```

Then:

```bash
npm test
```

## Reporting

- If both pass: confirm "Type check clean. All N tests passing."
- If `tsc` fails: show the errors with file:line references and fix them before running tests.
- If tests fail: show the failing test names and error messages. Do not mark the task done until all tests pass.

## Do not

- Do not run `npm run build` (that produces output files, which is not needed for validation).
- Do not skip failing tests or add `.skip`.
- Do not edit test files to make tests pass artificially — fix the source code instead.
