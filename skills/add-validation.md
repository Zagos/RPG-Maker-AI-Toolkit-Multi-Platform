# /add-validation

Add deep input validation for an existing tool or entity type.

## When to use

- A new field was added to an entity and needs runtime checking
- A handler is passing unvalidated data to the writer
- `validateEnemy` / `validateItem` / etc. is missing a check

## Steps

1. Identify which `RPGMakerValidator` method needs updating (or if a new one is needed).

2. Open `src/rpgmaker/validator.ts`. All validator methods return:
   ```typescript
   { valid: boolean, errors: string[], warnings: string[] }
   ```
   - `errors` block the write (method returns `valid: false`)
   - `warnings` are informational only

3. Add the validation logic:
   - Check types first (`typeof x !== "number"`)
   - Check ranges/constraints second (`x < 0`, `x > max`)
   - Check array element shapes when validating array fields

4. If the handler doesn't already call the validator, add the call:
   ```typescript
   const validation = RPGMakerValidator.validate<Entity>(data);
   if (!validation.valid) {
     return JSON.stringify({ error: "Validation failed", errors: validation.errors });
   }
   ```

5. Add tests in the relevant test file (e.g. `tests/rpgmaker/validator.test.ts` or the phase test file):
   - One test for valid input (must pass)
   - One test per new error case
   - One test per new warning case if applicable

6. Run `/validate` to confirm everything still passes.
