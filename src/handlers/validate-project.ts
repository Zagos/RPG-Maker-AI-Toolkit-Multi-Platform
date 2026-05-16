import * as fs from "fs";
import * as path from "path";
import type { HandlerContext } from "./types.js";
import { RPGMakerValidator } from "../rpgmaker/validator.js";

type ValidatorFn = (e: Record<string, unknown>) => { valid: boolean; errors: string[]; warnings: string[] };

const ENTITY_FILES: Record<string, { file: string; validator: ValidatorFn }> = {
  Actor: { file: "Actors.json", validator: (e) => RPGMakerValidator.validateActor(e) },
  Item: { file: "Items.json", validator: (e) => RPGMakerValidator.validateItem(e) },
  Weapon: { file: "Weapons.json", validator: (e) => RPGMakerValidator.validateWeapon(e) },
  Armor: { file: "Armors.json", validator: (e) => RPGMakerValidator.validateArmor(e) },
  Skill: { file: "Skills.json", validator: (e) => RPGMakerValidator.validateSkill(e) },
  Class: { file: "Classes.json", validator: (e) => RPGMakerValidator.validateClass(e) },
  State: { file: "States.json", validator: (e) => RPGMakerValidator.validateState(e) },
  Enemy: { file: "Enemies.json", validator: (e) => RPGMakerValidator.validateEnemy(e) },
  Troop: { file: "Troops.json", validator: (e) => RPGMakerValidator.validateTroop(e) },
  CommonEvent: { file: "CommonEvents.json", validator: (e) => RPGMakerValidator.validateCommonEvent(e) },
};

export async function handleValidateProject(ctx: HandlerContext): Promise<string> {
  const { input, projectPath } = ctx;
  const requestedTypes = input.entity_types as string[] | undefined;
  const includeWarnings = (input.include_warnings as boolean | undefined) ?? true;
  const typesToCheck = requestedTypes?.length
    ? requestedTypes.filter((t) => ENTITY_FILES[t])
    : Object.keys(ENTITY_FILES);

  const issues: Array<{ entity_type: string; id: number; name: string; errors: string[]; warnings: string[] }> = [];
  let totalChecked = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  try {
    for (const entityType of typesToCheck) {
      const { file, validator } = ENTITY_FILES[entityType];
      const filePath = path.join(projectPath, "data", file);
      if (!fs.existsSync(filePath)) continue;
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<Record<string, unknown> | null>;
      for (const entry of data) {
        if (!entry) continue;
        totalChecked++;
        const result = validator(entry);
        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;
        if (result.errors.length > 0 || (includeWarnings && result.warnings.length > 0)) {
          issues.push({
            entity_type: entityType,
            id: entry.id as number,
            name: (entry.name as string) || "",
            errors: result.errors,
            warnings: includeWarnings ? result.warnings : [],
          });
        }
      }
    }
    return JSON.stringify({
      success: true,
      valid: totalErrors === 0,
      total_checked: totalChecked,
      total_errors: totalErrors,
      total_warnings: totalWarnings,
      issues,
    });
  } catch (error) {
    return JSON.stringify({ error: (error as Error).message });
  }
}
