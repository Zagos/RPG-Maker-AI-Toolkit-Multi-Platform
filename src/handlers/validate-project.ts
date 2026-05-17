import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";
import { RPGMakerValidator } from "../adapters/mz/validator.js";
import { isRubyAvailable } from "../adapters/ruby-bridge/index.js";

type ValidatorFn = (e: Record<string, unknown>) => { valid: boolean; errors: string[]; warnings: string[] };

interface EntityDef {
  type: string;
  read: (ctx: HandlerContext) => Array<Record<string, unknown>>;
  validate: ValidatorFn;
}

const ENTITY_DEFS: EntityDef[] = [
  { type: "Actor",       read: (ctx) => ctx.reader.readActors()       as unknown as Array<Record<string, unknown>>, validate: (e) => RPGMakerValidator.validateActor(e) },
  { type: "Item",        read: (ctx) => ctx.reader.readItems()        as unknown as Array<Record<string, unknown>>, validate: (e) => RPGMakerValidator.validateItem(e) },
  { type: "Weapon",      read: (ctx) => ctx.reader.readWeapons()      as unknown as Array<Record<string, unknown>>, validate: (e) => RPGMakerValidator.validateWeapon(e) },
  { type: "Armor",       read: (ctx) => ctx.reader.readArmors()       as unknown as Array<Record<string, unknown>>, validate: (e) => RPGMakerValidator.validateArmor(e) },
  { type: "Skill",       read: (ctx) => ctx.reader.readSkills()       as unknown as Array<Record<string, unknown>>, validate: (e) => RPGMakerValidator.validateSkill(e) },
  { type: "Class",       read: (ctx) => ctx.reader.readClasses()      as unknown as Array<Record<string, unknown>>, validate: (e) => RPGMakerValidator.validateClass(e) },
  { type: "State",       read: (ctx) => ctx.reader.readStates()       as unknown as Array<Record<string, unknown>>, validate: (e) => RPGMakerValidator.validateState(e) },
  { type: "Enemy",       read: (ctx) => ctx.reader.readEnemies()      as unknown as Array<Record<string, unknown>>, validate: (e) => RPGMakerValidator.validateEnemy(e) },
  { type: "Troop",       read: (ctx) => ctx.reader.readTroops()       as Array<Record<string, unknown>>,            validate: (e) => RPGMakerValidator.validateTroop(e) },
  { type: "CommonEvent", read: (ctx) => ctx.reader.readCommonEvents() as Array<Record<string, unknown>>,            validate: (e) => RPGMakerValidator.validateCommonEvent(e) },
];

const RUBY_EXT: Record<string, string> = { vxace: ".rvdata2", vx: ".rvdata", xp: ".rxdata" };
const RUBY_REQUIRED = ["System", "Actors", "Classes", "Skills", "Items", "Weapons", "Armors", "Enemies", "Troops", "States", "CommonEvents", "Scripts"];

export async function handleValidateProject(ctx: HandlerContext): Promise<string> {
  const { input, projectPath, engine } = ctx;
  const requestedTypes = input.entity_types as string[] | undefined;
  const includeWarnings = (input.include_warnings as boolean | undefined) ?? true;

  const rubyExt = RUBY_EXT[engine];
  const isRubyEngine = rubyExt !== undefined;

  try {
    // --- Ruby engine: structural checks first ---
    const structuralIssues: string[] = [];
    if (isRubyEngine) {
      const rubyOk = isRubyAvailable();
      if (!rubyOk) {
        return JSON.stringify({
          error: `Ruby is not available on PATH. Install Ruby or set RUBY_PATH to validate a ${engine.toUpperCase()} project.`,
        });
      }
      const dataPath = path.join(projectPath, "data");
      for (const name of RUBY_REQUIRED) {
        if (!fs.existsSync(path.join(dataPath, `${name}${rubyExt}`))) {
          structuralIssues.push(`Missing required file: data/${name}${rubyExt}`);
        }
      }
    }

    // --- Entity data validation (shared across all engines via IProjectReader) ---
    const typeNames = (requestedTypes?.length ? requestedTypes : ENTITY_DEFS.map((d) => d.type))
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1));

    const issues: Array<{ entity_type: string; id: number; name: string; errors: string[]; warnings: string[] }> = [];
    let totalChecked = 0;
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const def of ENTITY_DEFS) {
      if (!typeNames.includes(def.type)) continue;
      let entities: Array<Record<string, unknown>>;
      try {
        entities = def.read(ctx);
      } catch {
        // File missing or unreadable — structural issue already reported above for Ruby engines
        continue;
      }
      for (const entry of entities) {
        totalChecked++;
        const result = def.validate(entry);
        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;
        if (result.errors.length > 0 || (includeWarnings && result.warnings.length > 0)) {
          issues.push({
            entity_type: def.type,
            id: entry.id as number,
            name: (entry.name as string) || "",
            errors: result.errors,
            warnings: includeWarnings ? result.warnings : [],
          });
        }
      }
    }

    const response: Record<string, unknown> = {
      success: true,
      valid: totalErrors === 0 && structuralIssues.length === 0,
      total_checked: totalChecked,
      total_errors: totalErrors,
      total_warnings: totalWarnings,
      issues,
    };
    if (structuralIssues.length > 0) response.structural_issues = structuralIssues;
    return JSON.stringify(response);
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
