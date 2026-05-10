/**
 * Validador para datos de RPG Maker MZ
 */

import { Script } from "vm";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class RPGMakerValidator {
  /**
   * Valida los datos de un actor
   */
  static validateActor(actor: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!actor.name || typeof actor.name !== "string") {
      errors.push("Actor must have a 'name' property");
    }

    if (actor.classId !== undefined && typeof actor.classId !== "number") {
      warnings.push("Actor 'classId' should be numeric");
    }

    if (actor.initialLevel !== undefined && typeof actor.initialLevel !== "number") {
      errors.push("Actor 'initialLevel' must be numeric");
    }

    if (
      typeof actor.initialLevel === "number" &&
      typeof actor.maxLevel === "number" &&
      actor.initialLevel > actor.maxLevel
    ) {
      errors.push("Actor 'initialLevel' cannot be greater than 'maxLevel'");
    }

    if (actor.traits !== undefined && !Array.isArray(actor.traits)) {
      errors.push("Actor 'traits' must be an array");
    }

    if (Array.isArray(actor.traits)) {
      for (let i = 0; i < actor.traits.length; i++) {
        const trait = actor.traits[i] as Record<string, unknown>;
        if (typeof trait !== "object" || trait === null || typeof trait.code !== "number") {
          errors.push(`Actor 'traits[${i}]' must be an object with a numeric 'code' field`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida los datos de un item
   */
  static validateItem(item: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!item.name || typeof item.name !== "string") {
      errors.push("Item must have a 'name' property");
    }

    if (item.price && typeof item.price !== "number") {
      errors.push("Item 'price' must be numeric");
    }

    if (typeof item.price === "number" && item.price < 0) {
      warnings.push("Item price should not be negative");
    }

    if (item.effects !== undefined && !Array.isArray(item.effects)) {
      errors.push("Item 'effects' must be an array");
    }

    if (Array.isArray(item.effects)) {
      for (let i = 0; i < item.effects.length; i++) {
        const effect = item.effects[i] as Record<string, unknown>;
        if (typeof effect !== "object" || effect === null) {
          errors.push(`Item 'effects[${i}]' must be an object`);
          continue;
        }
        if (typeof effect.code !== "number") {
          errors.push(`Item 'effects[${i}]' must have a numeric 'code' field`);
        }
        if (effect.dataId !== undefined && typeof effect.dataId !== "number") {
          errors.push(`Item 'effects[${i}].dataId' must be numeric`);
        }
        if (effect.value1 !== undefined && typeof effect.value1 !== "number") {
          errors.push(`Item 'effects[${i}].value1' must be numeric`);
        }
        if (effect.value2 !== undefined && typeof effect.value2 !== "number") {
          errors.push(`Item 'effects[${i}].value2' must be numeric`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida los datos de un enemigo
   */
  static validateEnemy(enemy: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!enemy.name || typeof enemy.name !== "string") {
      errors.push("Enemy must have a 'name' property");
    }

    if (!enemy.battlerName || typeof enemy.battlerName !== "string") {
      warnings.push("Enemy should have a 'battlerName' for graphics");
    }

    if (enemy.actions !== undefined && !Array.isArray(enemy.actions)) {
      errors.push("Enemy 'actions' must be an array");
    }

    if (Array.isArray(enemy.actions)) {
      const validConditionTypes = new Set([0, 1, 2, 3, 4, 5]);
      for (let i = 0; i < enemy.actions.length; i++) {
        const action = enemy.actions[i] as Record<string, unknown>;
        if (typeof action !== "object" || action === null) {
          errors.push(`Enemy 'actions[${i}]' must be an object`);
          continue;
        }
        if (typeof action.skillId !== "number" || action.skillId < 1) {
          errors.push(`Enemy 'actions[${i}].skillId' must be a positive number`);
        }
        if (action.conditionType !== undefined && !validConditionTypes.has(action.conditionType as number)) {
          errors.push(`Enemy 'actions[${i}].conditionType' must be 0–5`);
        }
        if (action.rating !== undefined && (typeof action.rating !== "number" || (action.rating as number) < 1 || (action.rating as number) > 9)) {
          warnings.push(`Enemy 'actions[${i}].rating' should be 1–9`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida los datos de una habilidad
   */
  static validateSkill(skill: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!skill.name || typeof skill.name !== "string") {
      errors.push("Skill must have a 'name' property");
    }

    if (skill.mpCost && typeof skill.mpCost !== "number") {
      errors.push("Skill 'mpCost' must be numeric");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida un fragmento de código JavaScript
   */
  static validateJavaScript(code: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificar sintaxis básica
    try {
      new Script(code);
    } catch (error) {
      errors.push(`JavaScript syntax error: ${(error as Error).message}`);
    }

    // Warnings
    if (!code.includes("PluginManager.register")) {
      warnings.push(
        "Plugin code should contain 'PluginManager.register' for proper registration"
      );
    }

    if (code.includes("console.log") && !code.includes("// DEBUG")) {
      warnings.push("Console.log statements found; consider removing for production");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida un nombre de archivo
   */
  static validateFilename(filename: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const invalidChars = new Set(["<", ">", ":", "\"", "|", "?", "*"]);
    if (
      [...filename].some(
        (char) => invalidChars.has(char) || char.charCodeAt(0) < 32
      )
    ) {
      errors.push(
        "Filename contains invalid characters: < > : \" | ? * or control characters"
      );
    }

    // Reservados en Windows
    const reserved = [
      "CON",
      "PRN",
      "AUX",
      "NUL",
      "COM1",
      "COM2",
      "LPT1",
      "LPT2",
    ];
    const baseName = filename.split(".")[0].toUpperCase();
    if (reserved.includes(baseName)) {
      errors.push(`Filename '${filename}' is reserved on Windows`);
    }

    // Largo máximo
    if (filename.length > 255) {
      errors.push("Filename is too long (max 255 characters)");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida coordenadas de un evento de mapa dentro de los límites del mapa
   */
  static validateMapEvent(
    event: { x: number; y: number; name?: string },
    map: { width: number; height: number }
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof event.x !== "number" || !Number.isInteger(event.x)) {
      errors.push("MapEvent 'x' must be an integer");
    } else if (event.x < 0 || event.x >= map.width) {
      errors.push(`MapEvent 'x' (${event.x}) is out of map bounds [0, ${map.width - 1}]`);
    }

    if (typeof event.y !== "number" || !Number.isInteger(event.y)) {
      errors.push("MapEvent 'y' must be an integer");
    } else if (event.y < 0 || event.y >= map.height) {
      errors.push(`MapEvent 'y' (${event.y}) is out of map bounds [0, ${map.height - 1}]`);
    }

    if (event.name !== undefined && typeof event.name !== "string") {
      errors.push("MapEvent 'name' must be a string");
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Valida múltiples datos
   */
  static validateBatch(
    items: Record<string, unknown>[],
    type: "actor" | "item" | "enemy" | "skill"
  ): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const item of items) {
      let result: ValidationResult;

      switch (type) {
        case "actor":
          result = this.validateActor(item);
          break;
        case "item":
          result = this.validateItem(item);
          break;
        case "enemy":
          result = this.validateEnemy(item);
          break;
        case "skill":
          result = this.validateSkill(item);
          break;
        default:
          continue;
      }

      allErrors.push(
        ...result.errors.map((e) => `[ID: ${item.id}] ${e}`)
      );
      allWarnings.push(
        ...result.warnings.map((w) => `[ID: ${item.id}] ${w}`)
      );
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
}
