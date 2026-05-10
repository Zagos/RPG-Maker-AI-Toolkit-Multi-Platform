# /review-handler

Review an existing handler for correctness, safety, and consistency with project conventions.

## Checklist

Read the handler file specified (or ask which one) and verify each point:

### Error handling
- [ ] All logic is inside try/catch (or all paths return before can throw)
- [ ] catch returns `JSON.stringify({ error: (error as Error).message })`
- [ ] No bare `throw` — errors are always surfaced as JSON

### Input
- [ ] Required fields checked (missing input returns error JSON, not a crash)
- [ ] `_id` field used to branch create vs. update
- [ ] Numeric inputs cast as `as number`, not assumed

### Validation
- [ ] Entity data validated with `RPGMakerValidator` before writing
- [ ] Validation errors returned as `{ error, errors[] }` not silently swallowed
- [ ] Map event coordinates validated against map bounds

### Writer calls
- [ ] Uses `ctx.writer.update<Entity>` for updates, `ctx.writer.add<Entity>` for creates
- [ ] Does not construct file paths manually — writer handles that
- [ ] Does not call `fs.*` directly — all I/O via reader/writer

### Change log
- [ ] `ctx.changeLog.append(…)` called after every successful write
- [ ] `action` is `"create"` for new entities, `"update"` for edits
- [ ] `entityId` included when an ID is known

### Output
- [ ] Returns `JSON.stringify(…)` in all code paths
- [ ] Success response includes the entity ID and a human-readable message
- [ ] No console.log in production paths

## Reporting

List each failed check with the line number and a one-sentence explanation. Propose the minimal fix. Do not refactor unrelated code.
