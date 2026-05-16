import { describe, it, expect } from "vitest";
import { RPGMakerValidator } from "../../src/adapters/mz/validator.js";

describe("validateActor", () => {
  it("valida actor con campos mínimos", () => {
    const result = RPGMakerValidator.validateActor({ name: "Hero", classId: 1 });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("falla si falta name", () => {
    const result = RPGMakerValidator.validateActor({ classId: 1 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("name"))).toBe(true);
  });

  it("falla si initialLevel > maxLevel", () => {
    const result = RPGMakerValidator.validateActor({ name: "Hero", initialLevel: 50, maxLevel: 10 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("initialLevel"))).toBe(true);
  });

  it("no requiere id (se asigna en el writer)", () => {
    const result = RPGMakerValidator.validateActor({ name: "Hero" });
    expect(result.valid).toBe(true);
  });
});

describe("validateItem", () => {
  it("valida item con nombre", () => {
    const result = RPGMakerValidator.validateItem({ name: "Potion", price: 50 });
    expect(result.valid).toBe(true);
  });

  it("falla si falta name", () => {
    const result = RPGMakerValidator.validateItem({ price: 50 });
    expect(result.valid).toBe(false);
  });

  it("avisa si price es negativo", () => {
    const result = RPGMakerValidator.validateItem({ name: "Cursed Item", price: -1 });
    expect(result.valid).toBe(true); // solo warning
    expect(result.warnings.some((w) => w.includes("price"))).toBe(true);
  });
});

describe("validateEnemy", () => {
  it("valida enemigo con nombre", () => {
    const result = RPGMakerValidator.validateEnemy({ name: "Slime" });
    expect(result.valid).toBe(true);
  });

  it("falla si falta name", () => {
    const result = RPGMakerValidator.validateEnemy({});
    expect(result.valid).toBe(false);
  });

  it("avisa si falta battlerName", () => {
    const result = RPGMakerValidator.validateEnemy({ name: "Ghost" });
    expect(result.warnings.some((w) => w.includes("battlerName"))).toBe(true);
  });
});

describe("validateSkill", () => {
  it("valida skill con nombre", () => {
    const result = RPGMakerValidator.validateSkill({ name: "Fire", mpCost: 10 });
    expect(result.valid).toBe(true);
  });

  it("falla si falta name", () => {
    const result = RPGMakerValidator.validateSkill({});
    expect(result.valid).toBe(false);
  });
});

describe("validateJavaScript", () => {
  it("acepta código JS válido", () => {
    const result = RPGMakerValidator.validateJavaScript("var x = 1 + 2;");
    expect(result.valid).toBe(true);
  });

  it("falla con sintaxis inválida", () => {
    const result = RPGMakerValidator.validateJavaScript("var x = {;");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("syntax"))).toBe(true);
  });

  it("avisa si no tiene PluginManager.register", () => {
    const result = RPGMakerValidator.validateJavaScript("var x = 1;");
    expect(result.warnings.some((w) => w.includes("PluginManager.register"))).toBe(true);
  });

  it("avisa si tiene console.log sin marca DEBUG", () => {
    const result = RPGMakerValidator.validateJavaScript("console.log('test');");
    expect(result.warnings.some((w) => w.toLowerCase().includes("console.log"))).toBe(true);
  });

  it("no avisa por console.log si tiene marca DEBUG", () => {
    const result = RPGMakerValidator.validateJavaScript("// DEBUG\nconsole.log('test');");
    expect(result.warnings.some((w) => w.includes("console.log"))).toBe(false);
  });
});

describe("validateFilename", () => {
  it("acepta nombre de archivo válido", () => {
    const result = RPGMakerValidator.validateFilename("Actors.json");
    expect(result.valid).toBe(true);
  });

  it("rechaza caracteres inválidos en Windows", () => {
    const result = RPGMakerValidator.validateFilename("file<>.json");
    expect(result.valid).toBe(false);
  });

  it("rechaza nombres reservados de Windows", () => {
    const result = RPGMakerValidator.validateFilename("CON.json");
    expect(result.valid).toBe(false);
  });

  it("rechaza nombres de más de 255 caracteres", () => {
    const result = RPGMakerValidator.validateFilename("A".repeat(256) + ".json");
    expect(result.valid).toBe(false);
  });
});

describe("validateBatch", () => {
  it("valida múltiples actores y acumula errores", () => {
    const result = RPGMakerValidator.validateBatch(
      [
        { id: 1, name: "Hero" },
        { id: 2 }, // sin nombre → error
      ],
      "actor",
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("ID: 2");
  });

  it("retorna válido si todos pasan", () => {
    const result = RPGMakerValidator.validateBatch(
      [{ id: 1, name: "Potion" }, { id: 2, name: "Ether" }],
      "item",
    );
    expect(result.valid).toBe(true);
  });
});
