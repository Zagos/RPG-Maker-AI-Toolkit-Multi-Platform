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

    if (!actor.id || typeof actor.id !== "number") {
      errors.push("Actor must have a numeric 'id'");
    }

    if (!actor.name || typeof actor.name !== "string") {
      errors.push("Actor must have a 'name' property");
    }

    if (!actor.classId || typeof actor.classId !== "number") {
      warnings.push("Actor should have a valid 'classId'");
    }

    if (actor.initialLevel && typeof actor.initialLevel !== "number") {
      errors.push("Actor 'initialLevel' must be numeric");
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

    if (!item.id || typeof item.id !== "number") {
      errors.push("Item must have a numeric 'id'");
    }

    if (!item.name || typeof item.name !== "string") {
      errors.push("Item must have a 'name' property");
    }

    if (item.price && typeof item.price !== "number") {
      errors.push("Item 'price' must be numeric");
    }

    if (typeof item.price === "number" && item.price < 0) {
      warnings.push("Item price should not be negative");
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

    if (!enemy.id || typeof enemy.id !== "number") {
      errors.push("Enemy must have a numeric 'id'");
    }

    if (!enemy.name || typeof enemy.name !== "string") {
      errors.push("Enemy must have a 'name' property");
    }

    if (!enemy.battlerName || typeof enemy.battlerName !== "string") {
      warnings.push("Enemy should have a 'battlerName' for graphics");
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

    if (!skill.id || typeof skill.id !== "number") {
      errors.push("Skill must have a numeric 'id'");
    }

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
